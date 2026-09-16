#!/usr/bin/env python3
"""Build this book's self-contained reading preview. Requires Pandoc and Python 3.

This is a preview of the manuscript, not a native Quarto renderer. It preserves
our colorful callouts, embeds images, and links to the companion Game Lab.
"""
from pathlib import Path
import base64
import html
import json
import mimetypes
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def command(args, text=None):
    result = subprocess.run(args, input=text, text=True, capture_output=True, check=True)
    return result.stdout


def plain(node):
    if isinstance(node, list): return ''.join(plain(n) for n in node)
    if not isinstance(node, dict): return ''
    if node.get('t') in ('Str',): return node['c']
    if node.get('t') in ('Space', 'SoftBreak', 'LineBreak'): return ' '
    if node.get('t') == 'Code': return node['c'][1]
    return plain(node.get('c', []))


def main():
    if not shutil.which('pandoc'):
        raise SystemExit('Pandoc is required. Install it, then run this script again.')
    command(['python3', str(ROOT / 'scripts/build-single-file.py')])
    source = ROOT / 'single-file/book.qmd'
    document = json.loads(command(['pandoc', str(source), '-f', 'markdown', '-t', 'json']))
    anchors = {}
    for path in [ROOT/'index.qmd', *sorted((ROOT/'chapters').glob('*.qmd')),
                 *sorted((ROOT/'appendices').glob('*.qmd')), ROOT/'references.qmd']:
        match = re.search(r'^# .*?\{[^}]*#([^ }]+)',path.read_text(encoding='utf-8'), re.M)
        if match: anchors[path.name] = match.group(1)
    navigation=[]
    count=0

    def visit(node):
        nonlocal count
        if isinstance(node,list): return [visit(n) for n in node]
        if not isinstance(node,dict): return node
        node={key:visit(value) for key,value in node.items()}
        kind=node.get('t'); content=node.get('c')
        if kind=='Header' and content[0]==1:
            label=plain(content[2])
            if 'unnumbered' not in content[1][1]:
                count+=1; label=str(count)+'. '+label
            navigation.append((content[1][0],label))
        if kind=='Div':
            attrs,blocks=content; identifier,classes,pairs=attrs
            if any(c.startswith('callout-') for c in classes):
                options=dict(pairs); title=options.get('title','Explore')
                classes.insert(0,'callout')
                attrs[2]=[p for p in pairs if p[0] not in ('title','icon','collapse')]
                opening='<div class="callout-header">'+html.escape(title)+'</div><div class="callout-body">'
                node['c']=[attrs,[{'t':'RawBlock','c':['html',opening]},*blocks,
                                 {'t':'RawBlock','c':['html','</div>']}]]
        elif kind=='Image':
            attrs,alt,target=content; url=target[0]
            if not re.match(r'^(?:https?:|data:)',url):
                file=(source.parent/url).resolve()
                if not file.is_file(): raise ValueError('Image missing: '+str(file))
                mime=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
                target[0]='data:'+mime+';base64,'+base64.b64encode(file.read_bytes()).decode('ascii')
            attrs[2]=[pair for pair in attrs[2] if pair[0]!='fig-alt']
        elif kind=='Link':
            target=content[2]; url=target[0]
            if '.qmd' in url:
                filename=url.split('#')[0].split('/')[-1]
                anchor=url.split('#',1)[1] if '#' in url else anchors.get(filename)
                if anchor: target[0]='#'+anchor
            elif url.startswith('../games/'):
                target[0]=url[3:]
        return node

    document=visit(document)
    body=command(['pandoc','-f','json','-t','html5','--number-sections','--highlight-style=pygments'],json.dumps(document))
    syntax=command(['pandoc','--print-highlight-style=pygments'])
    # Ask Pandoc's standalone writer for its generated syntax CSS.
    sample=command(['pandoc','-f','markdown','-t','html5','--standalone','--highlight-style=pygments'], '```javascript\nconst score = 0;\n```')
    css_match=re.search(r'<style>\s*(.*?)\s*</style>',sample,re.S)
    syntax_css=css_match.group(1) if css_match else ''
    syntax_start=syntax_css.find('pre > code.sourceCode')
    syntax_css=syntax_css[syntax_start:] if syntax_start >= 0 else ''
    css=(ROOT/'styles/textbook.css').read_text()+ '\n'+(ROOT/'styles/preview.css').read_text()
    nav=''.join('<a href="#'+html.escape(anchor,quote=True)+'">'+html.escape(label)+'</a>' for anchor,label in navigation)
    js='''
for(const block of document.querySelectorAll('.advanced-study')){
  const title=block.querySelector('.callout-header'), body=block.querySelector('.callout-body');
  if(!title || !body) continue;
  const details=document.createElement('details');details.className=block.className;details.open=true;
  const summary=document.createElement('summary');summary.textContent=title.textContent;
  details.append(summary,body);block.replaceWith(details);
}
for(const block of document.querySelectorAll('div.sourceCode')){
 const code=block.querySelector('code');if(!code)continue;
 const button=document.createElement('button');button.className='copy-code';button.textContent='Copy';
 button.setAttribute('aria-label','Copy this code example');
 button.onclick=async()=>{try{await navigator.clipboard.writeText(code.textContent);button.textContent='Copied';}
 catch(error){button.textContent='Select code to copy';}setTimeout(()=>button.textContent='Copy',1800);};
 block.prepend(button);
}
for(const link of document.querySelectorAll('a[href^="https://"]')){link.target='_blank';link.rel='noopener';}
document.querySelector('.mobile-nav').addEventListener('click',()=>{
 const nav=document.querySelector('.preview-nav');nav.classList.toggle('is-open');
 document.querySelector('.mobile-nav').setAttribute('aria-expanded',String(nav.classList.contains('is-open')));
});
for(const link of document.querySelectorAll('.preview-nav a'))link.addEventListener('click',()=>{
 document.querySelector('.preview-nav').classList.remove('is-open');document.querySelector('.mobile-nav').setAttribute('aria-expanded','false');
});
'''
    output='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>JavaScript Game Programming for Kids | 2D + 3D</title><style>'''+syntax_css+'\n'+css+'''</style></head><body><a class="skip-link" href="#book-content">Skip to book</a><button class="mobile-nav" aria-expanded="false" aria-controls="book-nav">Chapters</button><nav id="book-nav" class="preview-nav" aria-label="Book chapters"><p class="nav-title">Game Maker's<br>JavaScript Book</p><p class="nav-subtitle">2D + 3D EDITION</p>'''+nav+'''<a class="lab-link" href="games/index.html">Open the Game Lab</a></nav><main id="book-content" class="preview-main">'''+body+'''<footer>JavaScript Game Programming for Kids - HTML reading edition. Editable Quarto source and complete companion projects are included in the project folder.</footer></main><script>'''+js+'''</script></body></html>'''
    (ROOT/'preview.html').write_text(output,encoding='utf-8')
    print('Built preview.html: '+str(len(navigation))+' navigation entries; '+str(len(output))+' characters.')


if __name__=='__main__':
    try: main()
    except (OSError,ValueError,subprocess.CalledProcessError) as error:
        raise SystemExit('Preview build failed: '+str(error))
