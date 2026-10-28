#!/usr/bin/env node
/** Capture the actual chapter examples in Chrome.
 * Requires Playwright (npm package); set PLAYWRIGHT_MODULE to its absolute module
 * path when using an existing installation. Run from any directory.
 * Usage: node scripts/capture-game-stages.cjs [chapter numbers...]
 * HTML and CSS captures remove all scripts; behavior captures run the original
 * code and operate its controls. Animation time is advanced in fixed frames.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const chapters = fs.readdirSync(path.join(root, 'chapters')).filter(f => f.endsWith('.qmd')).sort();
const requested = process.argv.slice(2).map(Number);
const companion = {4:'foundations/behavior',15:'collision-lab',16:'robot-orchard',17:'robot-orchard',18:'robot-orchard',19:'three-explorer',20:'asset-workshop',21:'physics-lab',22:'marble-quest'};
const blocks = text => [...text.matchAll(/^```(html|css|javascript)\n([\s\S]*?)^```/gm)];
// Lesson cases below use the original indices; published chapter numbers are one higher.
const chapterNumber = n => n + 1;
const chapterText = n => fs.readFileSync(path.join(root,'chapters',chapters.find(f=>Number(f.slice(0,2))===chapterNumber(n))), 'utf8');
function example(n) {
  let html, base = root;
  if (companion[n]) { base=path.join(root,'games',companion[n]); html=fs.readFileSync(path.join(base,'index.html'),'utf8'); }
  else if (n===3) {
    html=example(2).html;
    const css=blocks(chapterText(3)).filter(m=>m[1]==='css').sort((a,b)=>b[2].length-a[2].length)[0][2];
    html=html.replace('</head>',`<style>${css}</style></head>`);
  } else {
    html=blocks(chapterText(n)).filter(m=>m[1]==='html' && /<!doctype html>/i.test(m[2])).sort((a,b)=>b[2].length-a[2].length)[0]?.[2];
  }
  if (!html) throw Error(`No complete source for chapter ${n}`);
  html=html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, tag=>{
    const href=tag.match(/href=["']([^"']+)/)[1];
    return `<style>${fs.readFileSync(path.resolve(base,href),'utf8')}</style>`;
  });
  return {html,base};
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.glb':'model/gltf-binary','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
  if (req.url === '/favicon.ico') { res.writeHead(204).end(); return; }
  const filename=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if (!filename.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(filename,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');res.end(data);});
});
const manifestPath=path.join(root,'figures','game-stage-captures.json');
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{};
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader']});
  try {
    for (let n=2;n<=22;n++) {
      if(requested.length && !requested.includes(chapterNumber(n))) continue;
      const folder=path.join(root,'figures',`chapter_${String(chapterNumber(n)).padStart(2,'0')}`);
      fs.mkdirSync(folder,{recursive:true});
      const entries=[];
      const errors=[];
      const page=await browser.newPage({viewport:{width:n>=15?1100:900,height:n>=15?960:560},deviceScaleFactor:1.5});
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error') console.error('Browser:',m.text())});
      page.on('requestfailed',r=>console.error('Request failed:',r.url(),r.failure()?.errorText));
      const shot=async(name,caption)=>{
        await page.mouse.move(0,0);
        await page.evaluate(()=>document.fonts.ready);
        await page.screenshot({path:path.join(folder,name+'.png'),fullPage:true});
        entries.push({file:`../figures/chapter_${String(chapterNumber(n)).padStart(2,'0')}/${name}.png`,caption});
        console.log(`Chapter ${chapterNumber(n)}: ${name}`);
      };
      const {html}=example(n);
      const staticHTML=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
      await page.setContent(staticHTML.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/\sstyle=("[^"]*"|'[^']*')/gi,''));
      await shot('stage-html', 'Structure: HTML only, before CSS or JavaScript.');
      await page.setContent(staticHTML);
      await shot('stage-style', /<style/i.test(staticHTML)?'Style: the same HTML with CSS applied; JavaScript is still off.':'Style check: this example has no custom CSS, so its appearance still uses browser defaults.');
      // Clock control changes only when browser callbacks run, not game rules.
      await page.addInitScript(()=>{
        let queue=new Map(),id=0,time=0;
        window.requestAnimationFrame=callback=>{queue.set(++id,callback);return id;};
        window.cancelAnimationFrame=key=>queue.delete(key);
        window.__framesReady=()=>queue.size>0;
        window.__advanceFrames=(count=1)=>{for(let i=0;i<count;i++){time+=1000/60;const callbacks=[...queue.values()];queue.clear();for(const cb of callbacks)cb(time);}};
      });
      if (n<=8) {
        await page.goto(origin+'/games/index.html');
        await page.setContent(html);
        if(n===3) {
          await page.locator('#monster').click();
          if(await page.locator('#score').innerText()!=='0') throw Error('Style stage changed the score');
          const appearance=await page.locator('#monster').evaluate(button=>{
            const css=getComputedStyle(button);
            return {padding:css.padding,margin:css.margin,border:css.borderWidth};
          });
          if(appearance.padding!=='16px' || appearance.margin!=='8px' || appearance.border!=='3px') throw Error('Unexpected box model: '+JSON.stringify(appearance));
        }
        if(n===4) {
          await shot('behavior-controls-default','Native controls: the nickname, mode, and sound choices before editing. The game rules are still a plan.');
          await page.locator('#player-name').fill('Maya');
          await page.locator('#difficulty').selectOption('hard');
          await page.locator('#sound').uncheck();
          await shot('behavior-controls-changed','Native controls after typing Maya, choosing Hard, and turning Sound off. These controls do not yet change the score.');
        }
        if(n===5) {
          await shot('behavior-data-ready','Behavior preparation: JavaScript has initialized the game data; the page still shows Score: 0.');
          await page.locator('#monster').click({force:true});
          await shot('behavior-click-check','After a test click, Score: 0 and the waiting message remain unchanged. Chapter 7 adds the click listener.');
        }
        if(n===6) {
          await shot('behavior-waiting','Behavior before input: the message asks Can you catch it?');
          await page.locator('#monster').click({force:true});
          if(await page.locator('#message').innerText()!=='Great hit!') throw Error('Click handler did not run');
          await shot('behavior-hit','After clicking the monster, the event handler changes the message to Great hit!');
        }
        if(n===7 || n===8) {
          const monster=n===7?'#monster':'#slime', power=n===7?'#power':'#powerHit';
          await shot('behavior-start','Behavior at the start: the score is zero and the controls are ready.');
          await page.locator(power).click({force:true});
          await shot('behavior-power-blocked','A Power Hit at score zero is refused because five points are required.');
          for(let i=0;i<5;i++) await page.locator(n===8?['#slime','#bat','#ghost'][i%3]:monster).click({force:true});
          if(!(await page.locator('#score').innerText()).includes('5')) throw Error('Expected score 5');
          await shot('behavior-level-five','After five monster clicks, the score reaches five and the level message changes.');
          await page.locator(power).click({force:true});
          await shot('behavior-power-hit','A Power Hit now succeeds and spends the five points.');
          for(let i=0;i<10;i++) await page.locator(monster).click({force:true});
          await shot('behavior-master','After building the score to ten, the game displays its master-level message.');
        }
      }
      if(n>=15) {
        await page.goto(`${origin}/games/${companion[n]}/index.html`);
        try { await page.waitForFunction(()=>window.__framesReady() || !document.getElementById('error').hidden,{},{timeout:20000,polling:100}); } catch(e) { console.error(await page.evaluate(()=>({status:document.getElementById('status').textContent,error:document.getElementById('error').textContent,resources:performance.getEntriesByType('resource').map(r=>r.name)}))); throw e; }
        if(await page.locator('#error').isVisible()) throw Error(await page.locator('#error').innerText());
        await page.evaluate(()=>window.__advanceFrames(2));
        if(await page.locator('#error').isVisible()) throw Error(await page.locator('#error').innerText());
        await shot('behavior-start',n===15?'Behavior: JavaScript draws the player, wall, and circular target in Collision Playground.':n<=18?'Behavior: Robot Orchard has loaded its assets and displays its ready screen.':n===19?'Behavior: JavaScript loads the robot and crystals and renders the 3D island.':n===20?'Behavior: the original turquoise robot model is loaded into the 3D Asset Workshop.':n===21?'Behavior: three balls begin the drop at the same height.':'Behavior: the marble, crates, gems, and gate are loaded on the ready screen.');
        if(n===15) {
          await page.locator('#game').focus();await page.keyboard.down('ArrowRight');
          await page.evaluate(()=>window.__advanceFrames(60));await page.keyboard.up('ArrowRight');
          await shot('behavior-moved','After holding Right for one second, the rectangle has moved toward the wall.');
          await page.locator('#shape').selectOption('circle');
          await page.locator('#game').evaluate(canvas=>{const r=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent('pointermove',{buttons:1,clientX:r.left+510*r.width/960,clientY:r.top+260*r.height/540}));});
          await page.evaluate(()=>window.__advanceFrames(2));
          if(!(await page.locator('#status').innerText()).includes('Wall overlap: YES')) throw Error('Missing overlap');
          await shot('behavior-overlap','Switching to a circle and dragging it onto the wall reports Wall overlap: YES; detection alone does not block movement.');
        }
        if(n>=16 && n<=18) {
          await page.locator('#start').click({force:true});await page.evaluate(()=>window.__advanceFrames(45));
          await shot('behavior-playing','After Start, the ready overlay is removed and the robot stands on the ground.');
          await page.locator('#debug').click({force:true});await page.evaluate(()=>window.__advanceFrames(2));
          await shot('behavior-hitboxes','Show hitboxes adds outlines for the robot, terrain, hazards, and gems over the artwork.');
          await page.keyboard.down('Space');await page.keyboard.down('ArrowRight');
          await page.evaluate(()=>window.__advanceFrames(15));await page.keyboard.up('Space');await page.keyboard.up('ArrowRight');
          await shot('behavior-jump','Pressing Jump and Right launches the robot above the ground while moving it forward.');
          await page.locator('#pause').click({force:true});await page.evaluate(()=>window.__advanceFrames(2));
          if(!(await page.locator('#status').innerText()).includes('PAUSED'))throw Error('Pause failed');
          await shot('behavior-paused','Pause freezes play and displays the PAUSED state.');
        }
        if(n===17) {
          await page.goto(`${origin}/games/robot-orchard/sprite-frames.html`);
          await page.waitForFunction(()=>!document.getElementById('status').textContent.startsWith('Loading'),{},{polling:100});
          await shot('behavior-sprite-frames','The sprite-frame task draws four different crops from one sheet, with the collision body outlined separately from the artwork.');
        }
        if(n===18) {
          await page.locator('#start').click({force:true});await page.evaluate(()=>window.__advanceFrames(45));
          await page.keyboard.down('ArrowRight');await page.evaluate(()=>window.__advanceFrames(145));await page.keyboard.up('ArrowRight');
          if(!(await page.locator('#status').innerText()).includes('Gems: 1/10')) throw Error('Orchard gem not collected');
          await shot('behavior-scrolling','After moving Right and collecting the first gem, the camera scrolls along the wider level; the counter shows Gems: 1/10.');
        }
        if(n===19) {
          await page.locator('canvas').focus();await page.keyboard.down('ArrowUp');await page.evaluate(()=>window.__advanceFrames(16));await page.keyboard.up('ArrowUp');await page.keyboard.down('ArrowRight');await page.evaluate(()=>window.__advanceFrames(80));await page.keyboard.up('ArrowRight');
          if(!(await page.locator('#status').innerText()).includes('1/4'))throw Error('Crystal not collected');
          await shot('behavior-collected','Moving Up and Right to the first crystal removes it and updates the counter to Crystals: 1/4.');
          await page.locator('#restart').click({force:true});await page.evaluate(()=>window.__advanceFrames(2));
          await shot('behavior-restarted','Restart collection restores all four crystals and resets the counter to zero.');
        }
        if(n===20) {
          await page.locator('#color').fill('#e852a0');await page.evaluate(()=>window.__advanceFrames(2));
          await shot('behavior-recolored','Changing Robot color updates the body material to pink while keeping the model geometry.');
          const download=page.waitForEvent('download');await page.locator('#export').click({force:true});await download;
          if(!(await page.locator('#status').innerText()).includes('Exported'))throw Error('Export failed');
          await shot('behavior-exported','Export robot.glb saves the customized model and shows the export confirmation.');
        }
        if(n===21) {
          await page.evaluate(()=>window.__advanceFrames(75));
          await shot('behavior-bounce','After the same elapsed simulation time, the balls reach different heights because their restitution values differ.');
          await page.locator('#debug').click({force:true});await page.evaluate(()=>window.__advanceFrames(1));
          await shot('behavior-colliders','Show colliders overlays the physics shapes on the visible balls and floor.');
          await page.locator('#restart').click({force:true});await page.evaluate(()=>window.__advanceFrames(1));
          await shot('behavior-reset','Drop again resets all three balls to their common starting height.');
        }
        if(n===22) {
          await page.locator('#start').click({force:true});await page.evaluate(()=>window.__advanceFrames(45));
          await shot('behavior-playing','Start creates a playing world with five gems and three lives.');
          await page.locator('#debug').click({force:true});await page.evaluate(()=>window.__advanceFrames(2));
          await shot('behavior-colliders','Show colliders reveals the marble, solid obstacles, and collectible sensor shapes.');
          await page.keyboard.down('ArrowLeft');await page.evaluate(()=>window.__advanceFrames(60));await page.keyboard.up('ArrowLeft');
          await page.keyboard.down('ArrowUp');await page.evaluate(()=>window.__advanceFrames(25));await page.keyboard.up('ArrowUp');
          if(!(await page.locator('#status').innerText()).includes('Gems: 1/5')) throw Error('Marble gem not collected');
          await shot('behavior-moved','Holding Left and Up rolls the marble into a gem sensor. The gem disappears and the counter becomes Gems: 1/5.');
          await page.locator('#pause').click({force:true});await page.evaluate(()=>window.__advanceFrames(2));
          if(!(await page.locator('#status').innerText()).includes('Paused.'))throw Error('Pause failed');
          await shot('behavior-paused','Pause suspends the physics game and shows the paused status.');
        }
      }
      if(errors.length) throw Error(`Chapter ${chapterNumber(n)} runtime errors: ${errors.join('; ')}`);
      manifest[chapterNumber(n)]={chapter:chapters.find(f=>Number(f.slice(0,2))===chapterNumber(n)),source:companion[n]?`games/${companion[n]}/index.html`:'complete chapter code',captures:entries};
      fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
      await page.close();
    }
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
