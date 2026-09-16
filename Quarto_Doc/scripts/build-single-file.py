#!/usr/bin/env python3
"""Rebuild the standalone manuscript from the editable book chapters.

Run from any directory with Python 3. This script uses only the standard library.
It does not modify the chapters, styles, figures, or the HTML preview snapshot.
"""
from pathlib import Path
import re


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    chapters = sorted((root / "chapters").glob("*.qmd"))
    appendices = sorted((root / "appendices").glob("*.qmd"))
    if not chapters:
        raise SystemExit("No chapter files were found in chapters/.")
    files = [root / "index.qmd", *chapters, *appendices, root / "references.qmd"]
    parts = ['---\ntitle: "JavaScript Game Programming for Kids"\n'
             'subtitle: "From browser games to dynamic 2D and 3D worlds"\n---']
    for path in files:
        text = path.read_text(encoding="utf-8")
        if path.name == "index.qmd":
            for chapter in [*chapters, *appendices]:
                match = re.search(r"^# .*?\{#([^}]+)\}",
                                  chapter.read_text(encoding="utf-8"), re.M)
                if match:
                    source = chapter.relative_to(root).as_posix()
                    text = text.replace("](" + source + ")", "](#" + match.group(1) + ")")
        if path in appendices:
            letter = chr(ord("A") + appendices.index(path))
            text = text.replace("# ", "# Appendix " + letter + " | ", 1)
            text = re.sub(r"^(# [^\n]+) \{(#[^}]+)\}",
                          r"\1 {.unnumbered \2}", text, count=1, flags=re.M)
        parts.append(text.strip())
    target = root / "single-file" / "book.qmd"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("\n\n".join(parts) + "\n", encoding="utf-8")
    print("Updated " + str(target))


if __name__ == "__main__":
    main()
