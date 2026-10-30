#!/usr/bin/env python3
"""Recapture the static Monster Clicker chapters without an npm dependency.

Run from any directory with Google Chrome installed. This covers Chapters 3–9,
including their behavior states, using the same 900 x 560 CSS-pixel viewport as
capture-game-stages.cjs.
"""

from pathlib import Path
import json
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "figures/game-stage-captures.json").read_text())
CHROME = shutil.which("google-chrome") or shutil.which("chromium")
if not CHROME:
    raise SystemExit("Google Chrome or Chromium is required.")


def code_blocks(chapter, language):
    source = (ROOT / "chapters" / MANIFEST[str(chapter)]["chapter"]).read_text()
    return re.findall(rf"^```{language}\n([\s\S]*?)^```", source, re.M)


def full_html(chapter):
    if chapter == 4:
        html = full_html(3)
        css = max(code_blocks(4, "css"), key=len)
        return html.replace("</head>", f"<style>\n{css}</style>\n</head>")
    if chapter == 5:
        base = ROOT / "games/foundations/behavior"
        html = (base / "index.html").read_text()
        return html.replace(
            '<link rel="stylesheet" href="styles.css">',
            f"<style>\n{(base / 'styles.css').read_text()}</style>",
        )
    return max(
        (block for block in code_blocks(chapter, "html") if "<!doctype html>" in block),
        key=len,
    )


def static_html(html, remove_css):
    html = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", "", html, flags=re.I)
    if remove_css:
        html = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", "", html, flags=re.I)
        html = re.sub(r'\sstyle=("[^"]*"|\x27[^\x27]*\x27)', "", html)
    return html


def with_actions(html, actions):
    return html.replace("</body>", f"<script>\n{actions}\n</script>\n</body>")


def states(chapter, html):
    result = {
        "stage-html": static_html(html, True),
        "stage-style": static_html(html, False),
    }
    if chapter == 5:
        result["behavior-controls-default"] = html
        result["behavior-controls-changed"] = with_actions(
            html,
            'document.getElementById("player-name").value = "Maya";'
            'document.getElementById("difficulty").value = "hard";'
            'document.getElementById("sound").checked = false;',
        )
    if chapter == 6:
        result["behavior-data-ready"] = html
        result["behavior-click-check"] = with_actions(
            html, 'document.getElementById("monster").click();'
        )
    if chapter == 7:
        result["behavior-waiting"] = html
        result["behavior-hit"] = with_actions(
            html, 'document.getElementById("monster").click();'
        )
    if chapter in (8, 9):
        monster = "monster" if chapter == 8 else "slime"
        power = "power" if chapter == 8 else "powerHit"
        click = lambda element: f'document.getElementById("{element}").click();'
        five = click(monster) * 5
        result["behavior-start"] = html
        result["behavior-power-blocked"] = with_actions(html, click(power))
        result["behavior-level-five"] = with_actions(html, five)
        result["behavior-power-hit"] = with_actions(html, five + click(power))
        result["behavior-master"] = with_actions(
            html, five + click(power) + click(monster) * 10
        )
    return result


def main():
    with tempfile.TemporaryDirectory(prefix="monster-captures-") as tmp:
        temp = Path(tmp)
        profile = temp / "chrome-profile"
        for chapter in range(3, 10):
            chapter_states = states(chapter, full_html(chapter))
            folder = ROOT / "figures" / f"chapter_{chapter:02}"
            for entry in MANIFEST[str(chapter)]["captures"]:
                filename = Path(entry["file"]).name
                name = Path(filename).stem
                if name not in chapter_states:
                    raise ValueError(f"Unplanned capture: Chapter {chapter}, {name}")
                source = temp / f"chapter-{chapter}-{name}.html"
                source.write_text(chapter_states[name])
                output = folder / filename
                command = [
                    CHROME,
                    "--headless",
                    "--no-sandbox",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--hide-scrollbars",
                    "--no-first-run",
                    f"--user-data-dir={profile}",
                    "--window-size=900,560",
                    "--force-device-scale-factor=1.5",
                    "--virtual-time-budget=1000",
                    f"--screenshot={output}",
                    source.as_uri(),
                ]
                completed = subprocess.run(command, capture_output=True, text=True, timeout=35)
                if completed.returncode or not output.is_file():
                    raise RuntimeError(
                        f"Chrome failed on Chapter {chapter} {name}: {completed.stderr[-1000:]}"
                    )
                print(f"Chapter {chapter}: {name}", flush=True)


if __name__ == "__main__":
    main()
