import { chromium } from '../impacta-2026-motion-lab-01/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
await fs.mkdir('evidence/checks',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const spec of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844}}]){
  const page=await browser.newPage({viewport:spec.viewport,reducedMotion:'no-preference'});const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4181/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__impactaPilot);
  await page.screenshot({path:`evidence/checks/${spec.name}-dashboard.png`});await page.locator('.pilot-launch').click();
  for(const p of [.28,.47,.52,.57,.62,.72,.84,1]){await page.evaluate(p=>window.__impactaPilot.setProgress(p),p);await page.screenshot({path:`evidence/checks/${spec.name}-${String(p).replace('.','_')}.png`})}
  await page.locator('#pilot-content').scrollIntoViewIfNeeded();await page.screenshot({path:`evidence/checks/${spec.name}-content.png`,fullPage:false});
  const metrics=await page.evaluate(()=>({bodyWidth:document.body.scrollWidth,viewport:innerWidth,shellHidden:document.querySelector('#pilot-experience').hidden,title:document.querySelector('#pilot-title').textContent.trim(),ventures:document.querySelector('#result-count').textContent,theme:document.documentElement.dataset.theme,origin:getComputedStyle(document.querySelector('#pilot-cover')).transformOrigin}));
  console.log(JSON.stringify({device:spec.name,errors,metrics}));await page.close();
}
await browser.close();
