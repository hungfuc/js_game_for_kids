#!/usr/bin/env python3
"""Download exact library releases, verify npm's integrity hash, use local imports.

Requires Python 3 and an internet connection only for the initial download.
No pip packages are needed. Run with --cdn to restore the CDN import maps.
"""
from __future__ import annotations
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import tarfile
import tempfile
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PACKAGES = [('three', '0.180.0', 'three'),
            ('@dimforge/rapier3d-compat', '0.17.3', 'rapier')]
PAGES = ['three-explorer', 'physics-lab', 'marble-quest', 'asset-workshop']
MAX_BYTES = 80 * 1024 * 1024


def get_bytes(url: str) -> bytes:
    request = Request(url, headers={'User-Agent': 'GameMakerTextbook/1.0'})
    with urlopen(request, timeout=90) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError('Download exceeds the safety size limit: ' + url)
    return data


def extract_package(blob: bytes, target: Path) -> None:
    """Extract regular files below package/ only; never follow links or ../ paths."""
    expanded = 0
    with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as archive:
        for member in archive.getmembers():
            name = PurePosixPath(member.name)
            if not name.parts or name.parts[0] != 'package':
                continue
            relative = name.parts[1:]
            if not relative or '..' in relative or name.is_absolute():
                continue
            if not member.isfile():
                continue
            expanded += member.size
            if expanded > 160 * 1024 * 1024:
                raise ValueError('Expanded package exceeds the safety size limit.')
            destination = target.joinpath(*relative)
            destination.parent.mkdir(parents=True, exist_ok=True)
            source = archive.extractfile(member)
            if source is None:
                raise ValueError('Cannot read archive entry: ' + member.name)
            with source, destination.open('wb') as output:
                shutil.copyfileobj(source, output)


def rewrite_maps(local: bool) -> None:
    if local:
        imports = {
            'three': '../vendor/three/build/three.module.js',
            'three/addons/': '../vendor/three/examples/jsm/',
            '@dimforge/rapier3d-compat': '../vendor/rapier/rapier.es.js',
        }
    else:
        imports = {
            'three': 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
            'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/',
            '@dimforge/rapier3d-compat': 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.17.3/rapier.es.js',
        }
    replacement = '<script type="importmap">\n' + json.dumps({'imports': imports}, indent=2) + '\n</script>'
    for name in PAGES:
        path = ROOT / 'games' / name / 'index.html'
        text, count = re.subn(r'<script type="importmap">.*?</script>',
                             lambda _: replacement, path.read_text(encoding='utf-8'),
                             count=1, flags=re.S)
        if count != 1:
            raise ValueError('Expected exactly one import map in ' + str(path))
        path.write_text(text, encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cdn', action='store_true', help='Restore CDN maps without downloading.')
    args = parser.parse_args()
    if args.cdn:
        rewrite_maps(False)
        print('Restored CDN imports. Existing vendor files were left unchanged.')
        return
    vendor = ROOT / 'games' / 'vendor'
    vendor.mkdir(exist_ok=True)
    manifest = []
    with tempfile.TemporaryDirectory(prefix='game-libraries-') as temporary:
        staging = Path(temporary)
        for package, version, folder in PACKAGES:
            print('Downloading ' + package + '@' + version + ' ...', flush=True)
            metadata_url = 'https://registry.npmjs.org/' + package.replace('/', '%2f') + '/' + version
            metadata = json.loads(get_bytes(metadata_url))
            if metadata.get('version') != version:
                raise ValueError('Registry returned an unexpected version.')
            distribution = metadata['dist']
            url = distribution['tarball']
            if not url.startswith('https://registry.npmjs.org/'):
                raise ValueError('Unexpected package download host.')
            blob = get_bytes(url)
            integrity = distribution['integrity']
            algorithm, expected = integrity.split('-', 1)
            if algorithm not in {'sha256', 'sha384', 'sha512'}:
                raise ValueError('Unsupported integrity algorithm: ' + algorithm)
            actual = base64.b64encode(hashlib.new(algorithm, blob).digest()).decode('ascii')
            if actual != expected:
                raise ValueError('Integrity check failed for ' + package)
            extract_package(blob, staging / folder)
            manifest.append({'package': package, 'version': version, 'integrity': integrity,
                             'tarball': url, 'license': metadata.get('license', 'See package license')})
        required = ['three/build/three.module.js', 'three/build/three.core.js',
                    'three/examples/jsm/loaders/GLTFLoader.js',
                    'three/examples/jsm/exporters/GLTFExporter.js', 'rapier/rapier.es.js']
        for name in required:
            if not (staging / name).is_file():
                raise ValueError('Expected release file missing: ' + name)
        for _, _, folder in PACKAGES:
            destination = vendor / folder
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(staging / folder, destination)
    (vendor / 'dependency-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    rewrite_maps(True)
    print('Dependencies installed in games/vendor; import maps now use local files.')
    print('Keep the package license files. Restart the local server and test every 3D page offline.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, tarfile.TarError) as error:
        raise SystemExit('Dependency setup failed: ' + str(error))
