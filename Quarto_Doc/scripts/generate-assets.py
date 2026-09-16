#!/usr/bin/env python3
"""Optional asset source. Rebuilds the original asset pack, replacing edited copies.
Requires the packages in requirements-assets.txt. Back up your own art first.
"""
from pathlib import Path
import math, wave, struct, json
import cairosvg
import trimesh
import numpy as np
R=Path(__file__).resolve().parents[1]
for folder in ('games/assets/2d', 'games/assets/3d', 'games/assets/audio'):
    (R/folder).mkdir(parents=True, exist_ok=True)
A=R/'games/assets/2d'

def svg(name,w,h,body):
    text=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img"><title>{name.replace("-"," ")}</title>{body}</svg>'
    (A/f'{name}.svg').write_text(text)
    cairosvg.svg2png(bytestring=text.encode(),write_to=str(A/f'{name}.png'))

frames=[]
for f in range(4):
    lift=[0,-2,0,-2][f]; leg=[0,3,0,-3][f]
    frames.append(f'''<g transform="translate({f*64},0)">
    <ellipse cx="32" cy="60" rx="19" ry="3" fill="#253753" opacity=".18"/>
    <g transform="translate(0,{lift})">
    <path d="M24 44v{12+leg}h-8v-12m24-1v{12-leg}h8v-12" fill="#2d426c"/>
    <rect x="18" y="29" width="28" height="20" rx="6" fill="#20b7a5" stroke="#176277" stroke-width="2"/>
    <rect x="13" y="9" width="38" height="27" rx="9" fill="#65dfce" stroke="#176277" stroke-width="2"/>
    <rect x="18" y="16" width="28" height="12" rx="5" fill="#183253"/>
    <circle cx="25" cy="21" r="3" fill="#fff4b8"/><circle cx="39" cy="21" r="3" fill="#fff4b8"/>
    <path d="M32 9V4" stroke="#176277" stroke-width="2"/><circle cx="32" cy="4" r="3" fill="#ffb44e"/>
    <rect x="7" y="32" width="9" height="15" rx="4" fill="#f6b955"/><rect x="48" y="32" width="9" height="15" rx="4" fill="#f6b955"/>
    <circle cx="32" cy="39" r="4" fill="#fff0b3"/>
    </g></g>''')
svg('robot-strip',256,64,''.join(frames))
svg('gem',48,48,'<path d="M24 3L43 19L24 45L5 19Z" fill="#8157d5" stroke="#4d3485" stroke-width="2"/><path d="M24 3L31 19H17Z" fill="#d4c1ff"/><path d="M17 19L24 45L31 19" fill="#ac8eea"/><path d="M9 19H39" stroke="#eee4ff" stroke-width="2"/>')
svg('ground',64,64,'<rect width="64" height="64" rx="4" fill="#b27348"/><path d="M0 17H64V0H0Z" fill="#51ad71"/><path d="M0 9H64" stroke="#95e5a5" stroke-width="7"/><path d="M8 31h14m18 12h14M13 54h10" stroke="#d9a570" stroke-width="5" stroke-linecap="round"/>')
svg('crate',64,64,'<rect x="3" y="3" width="58" height="58" rx="5" fill="#e5a05c" stroke="#854931" stroke-width="4"/><path d="M9 9L55 55M55 9L9 55" stroke="#854931" stroke-width="9"/><path d="M9 9L55 55M55 9L9 55" stroke="#f2bf79" stroke-width="5"/><path d="M7 7H57V57H7Z" fill="none" stroke="#ad643c" stroke-width="5"/>')
svg('bug',48,48,'<ellipse cx="24" cy="30" rx="20" ry="14" fill="#bd4565"/><path d="M13 18L9 9M35 18L39 9" stroke="#513654" stroke-width="3"/><circle cx="16" cy="23" r="6" fill="white"/><circle cx="32" cy="23" r="6" fill="white"/><circle cx="16" cy="24" r="3" fill="#24334b"/><circle cx="32" cy="24" r="3" fill="#24334b"/><path d="M8 40L4 45m18-4v6m13-7l8 5" stroke="#513654" stroke-width="4"/>')
svg('portal',64,96,'<path d="M8 92V34a24 24 0 0 1 48 0v58" fill="#ddf7f0" stroke="#2b8d83" stroke-width="8"/><path d="M17 91V35a15 15 0 0 1 30 0v56" fill="#8cd9d3"/><path d="M28 45l12 11-12 11" fill="none" stroke="white" stroke-width="5"/><path d="M2 91H62" stroke="#183253" stroke-width="6"/>')
svg('background',960,540,'<rect width="960" height="540" fill="#e8f5ff"/><circle cx="800" cy="90" r="48" fill="#ffdf90"/><g fill="#fff" opacity=".9"><ellipse cx="140" cy="85" rx="85" ry="26"/><ellipse cx="180" cy="67" rx="43" ry="30"/><ellipse cx="530" cy="145" rx="85" ry="28"/></g><path d="M0 440Q160 230 330 430Q520 250 760 405Q860 320 960 385V540H0" fill="#c0e4dd"/><path d="M0 480Q180 355 360 490Q560 345 760 480Q860 420 960 455V540H0" fill="#97cdbb"/>')
svg('marble-pattern',256,128,'<rect width="256" height="128" fill="#18b9ab"/><path d="M-30 0L98 128M40 0L168 128M110 0L238 128M180 0L308 128" stroke="#ffdf8e" stroke-width="18"/><path d="M0 30H256M0 97H256" stroke="#166482" stroke-width="6"/>')
# Original short sound, no recordings or third-party samples.
with wave.open(str(R/'games/assets/audio/collect.wav'),'wb') as wav:
    rate=22050; duration=.16
    wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(rate)
    vals=[]
    for i in range(int(rate*duration)):
        t=i/rate; env=(1-t/duration)**2; freq=660+660*t/duration
        vals.append(struct.pack('<h',int(10500*env*math.sin(2*math.pi*freq*t))))
    wav.writeframes(b''.join(vals))

# Low-poly, original glTF models. All materials are generated locally.
B=R/'games/assets/3d'
def rgba(hex): return list(bytes.fromhex(hex))+[255]
def material(name,color):
    return trimesh.visual.material.PBRMaterial(name=name,baseColorFactor=rgba(color),metallicFactor=.05,roughnessFactor=.7)
def add_box(scene,name,extents,pos,color):
    mesh=trimesh.creation.box(extents=extents)
    mesh.visual=trimesh.visual.TextureVisuals(material=material(name,color))
    transform=trimesh.transformations.translation_matrix(pos)
    scene.add_geometry(mesh,node_name=name,geom_name=name,transform=transform)
def output(scene,name):
    (B/f'{name}.glb').write_bytes(scene.export(file_type='glb'))

scene=trimesh.Scene()
for data in [('body',[.65,.55,.36],[0,.8,0],'20b7a5'),('head',[.85,.5,.48],[0,1.33,0],'65dfce'),('visor',[.66,.21,.02],[0,1.36,.25],'183253'),('eye-left',[.09,.09,.03],[-.18,1.38,.27],'fff0b3'),('eye-right',[.09,.09,.03],[.18,1.38,.27],'fff0b3'),('foot-left',[.22,.42,.32],[-.2,.21,0],'2d426c'),('foot-right',[.22,.42,.32],[.2,.21,0],'2d426c'),('arm-left',[.18,.48,.23],[-.49,.82,0],'f6b955'),('arm-right',[.18,.48,.23],[.49,.82,0],'f6b955'),('antenna',[.06,.18,.06],[0,1.66,0],'f6b955')]:
    add_box(scene,*data)
output(scene,'robot')
scene=trimesh.Scene()
# The crate's outer bounds are exactly one unit on every axis.
add_box(scene,'wood',[.94,.94,.94],[0,0,0],'b87946')
for axis in (0,2):
    for side in (-1,1):
        for p in (-.36,.36):
            ext=[.14,1,.03] if axis==2 else [.03,1,.14]
            pos=[p,0,side*.485] if axis==2 else [side*.485,0,p]
            add_box(scene,f'brace-{axis}-{side}-{p}',ext,pos,'f2c57e')
output(scene,'crate')
verts=np.array([[0,.7,0],[.45,0,0],[0,0,.45],[-.45,0,0],[0,0,-.45],[0,-.7,0]])
faces=np.array([[0,2,1],[0,3,2],[0,4,3],[0,1,4],[5,1,2],[5,2,3],[5,3,4],[5,4,1]])
mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False)
mesh.fix_normals()
mesh.visual=trimesh.visual.TextureVisuals(material=material('amethyst','9971e8'))
scene=trimesh.Scene(mesh);output(scene,'gem')
(B/'model-specifications.json').write_text(json.dumps({
    'units':'game units; y up; robot faces +z',
    'robot':{'origin':'feet, y=0','height':1.75,'format':'GLB; separate rigid mesh parts; no skeletal clips'},
    'crate':{'origin':'center','size':[1,1,1],'collider':'cuboid half extents 0.5, 0.5, 0.5'},
    'gem':{'origin':'center','size':[.9,1.4,.9],'collider':'sensor; chosen independently of visible facets'}
},indent=2))
(R/'games/assets/ASSET_LICENSE.md').write_text('''# Original game-lab assets\n\nThe SVG drawings, PNG exports, GLB models, and synthesized WAV sound in this folder were created for this textbook. They are not downloaded stock assets. You may use, edit, and redistribute these original assets in your learning projects and games, including commercial projects, without attribution. This permission does not apply to Three.js, Rapier, or other third-party software. Their own licenses apply.\n\nSVG is the editable source for the 2D artwork. PNG files are equivalent exports; the games load the SVG artwork directly except for the marble texture. The GLB files contain rigid component meshes, not rigged or skeletal animations. See 3d/model-specifications.json for their coordinate conventions.\n''')
print('Generated',len(list(A.glob('*'))),'2D asset files and',len(list(B.glob('*.glb'))),'GLB models.')
