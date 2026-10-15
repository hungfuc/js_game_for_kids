#!/usr/bin/env python3
"""Place captured game stages after chapter code; safe to run again.

Run capture-game-stages.cjs first. Existing gameplay figures in Chapters 9–14
are retained. Chapters 2–5 introduce the stages progressively rather than
inventing JavaScript gameplay before its lesson.
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / 'figures/game-stage-captures.json').read_text())


def figure(entry, number):
    name = Path(entry['file']).stem
    caption = entry['caption']
    alt = caption.replace('"', '&quot;')
    return f'![{caption}]({entry["file"]}){{#fig-ch{number:02d}-{name} fig-alt="{alt}" width="100%"}}'


def insert_after_code(text, anchor, content, marker, language=None):
    start = text.index(anchor) if anchor else 0
    pattern = r'^```' + (language if language else r'(?:html|css|javascript)') + r'\n[\s\S]*?^```[ \t]*$'
    block = re.search(pattern, text[start:], re.M)
    if not block:
        raise ValueError(f'No code after {anchor}')
    pos = start + block.end()
    return text[:pos] + f'\n\n<!-- game-stage-figures:{marker} -->\n\n{content}\n\n<!-- /game-stage-figures:{marker} -->' + text[pos:]


for number in range(2, 23):
    data = MANIFEST[str(number)]
    file = ROOT / 'chapters' / data['chapter']
    text = file.read_text()
    text = re.sub(r'\n\n<!-- game-stage-figures:([^>]+) -->[\s\S]*?<!-- /game-stage-figures:\1 -->', '', text)
    entries = data['captures']
    stages = entries[:2]
    behavior = entries[2:]
    if number == 2:
        text = text.replace('../figures/chapter_02/monster-scene-default.png', stages[0]['file'])
    elif number == 3:
        content = '\n\n'.join(figure(e, number) for e in entries)
        text = insert_after_code(text, '## Build the complete style in small steps', content, 'style', 'css')
    elif number == 4:
        intro = 'These views show all three controls together in the companion scene. Typing and selecting use built-in browser behavior; the game’s scoring rules are still a plan.'
        text = insert_after_code(text, '### Add an on/off choice', intro + '\n\n' + '\n\n'.join(figure(e,number) for e in entries), 'controls', 'html')
    elif number == 5:
        text = text.replace('../figures/chapter_05/monster-starter-html.png', stages[0]['file'])
        text = text.replace('../figures/chapter_05/monster-starter-styled.png', stages[1]['file'])
        complete = [m for m in re.finditer(r'^```html\n([\s\S]*?)^```', text, re.M) if '<!doctype html>' in m[1]][-1]
        pos = complete.end()
        content = '\n\n'.join(figure(e,number) for e in behavior)
        text = text[:pos] + '\n\n<!-- game-stage-figures:data -->\n\n' + content + '\n\n<!-- /game-stage-figures:data -->' + text[pos:]
    elif 6 <= number <= 14:
        full = [m for m in re.finditer(r'^```html\n([\s\S]*?)^```', text, re.M) if '<!doctype html>' in m[1]]
        complete = max(full, key=lambda m:len(m[1]))
        content = '\n\n'.join(figure(e,number) for e in entries)
        if number >= 10:
            content += '\n\nThe empty canvas is expected in these first two stages. JavaScript draws the game objects and runs the behavior shown in the following screenshots.'
        pos = complete.end()
        text = text[:pos] + '\n\n<!-- game-stage-figures:complete -->\n\n' + content + '\n\n<!-- /game-stage-figures:complete -->' + text[pos:]
    else:
        # The later chapters teach selections of the linked complete project.
        # Show that project's shell and its gameplay without adding invented code.
        intro = f'These stage views use the complete [companion page](../{data["source"]}). With its scripts disabled, HTML supplies the controls and CSS styles the page. The game world appears when JavaScript loads and draws it; the loading text in these static views is the HTML placeholder.'
        content = intro + '\n\n' + '\n\n'.join(figure(e,number) for e in stages)
        text = insert_after_code(text, None, content, 'shell')
        # Relocate the old introduction galleries to avoid repeating those states.
        if number in (19,20) and ('These Chrome screenshots show' in text or 'The workshop was run in Chrome' in text):
            if number == 19:
                start = text.index('These Chrome screenshots show')
                end = text.index('::: {.callout-tip',start)
            else:
                start = text.index('The workshop was run in Chrome')
                end = text.index('## Load a GLB',start)
            text = text[:start] + text[end:]
        # Keep the behavior gallery near the chapter's main gameplay code.
        anchors = {15:'## Keep one loop in charge',16:'## Resolve horizontal and vertical movement separately',17:'## Animate by selecting a frame',18:'## Restart the data, not the browser',19:'## Move across the floor',20:'## Customize materials without changing every copy',21:'## Compare bounce and friction',22:'## Restart one world, not several'}
        selected = behavior
        if number == 16:
            selected = [e for e in behavior if Path(e['file']).stem in ('behavior-playing','behavior-hitboxes','behavior-jump')]
        if number == 17:
            selected = [e for e in behavior if Path(e['file']).stem in ('behavior-playing','behavior-jump','behavior-hitboxes','behavior-sprite-frames')]
        content = 'The following captures run the complete companion project and exercise its controls.\n\n' + '\n\n'.join(figure(e,number) for e in selected)
        text = insert_after_code(text, anchors[number], content, 'behavior', 'javascript')
    file.write_text(text)
    print(f'Updated {file.name}')
