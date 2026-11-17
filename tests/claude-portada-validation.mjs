import {chromium} from '../../impacta-2026-motion-lab-01/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const executablePath='C:/Program Files/Google/Chrome/Application/chrome.exe';
const original='http://127.0.0.1:4185/src/index.html';
const integrated='http://127.0.0.1:4186/';
const ref=path.resolve('evidence/claude-reference');
const out=path.resolve('evidence/integrated-portada');
await Promise.all([fs.mkdir(ref,{recursive:true}),fs.mkdir(out,{recursive:true})]);
const browser=await chromium.launch({headless:true,executablePath});
const errors=[];

async function selectPrototype(page,state){
  await page.getByRole('button',{name:'B · Archivo'}).click();
  await page.getByRole('button',{name:state,exact:true}).click();
  await page.waitForTimeout(900);
}

for(const spec of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844}}]){
  const source=await browser.newPage({viewport:spec.viewport});
  await source.goto(original,{waitUntil:'networkidle'});
  await selectPrototype(source,'Inicial');
  await source.screenshot({path:path.join(ref,`${spec.name}-closed.png`)});
  await selectPrototype(source,'Abierto');
  await source.screenshot({path:path.join(ref,`${spec.name}-open.png`)});
  await source.close();

  const page=await browser.newPage({viewport:spec.viewport,reducedMotion:'no-preference'});
  page.on('pageerror',error=>errors.push(`${spec.name}: ${error.message}`));
  await page.goto(integrated,{waitUntil:'networkidle'}); await page.waitForTimeout(1100);
  assert.equal(await page.locator('.claude-cutaway-stage').getAttribute('data-ready'),'true');
  assert.equal(await page.locator('.claude-cutaway-stage').getAttribute('data-state'),'closed');
  await page.screenshot({path:path.join(out,`${spec.name}-closed.png`)});
  await page.locator('.claude-archive-launch').click(); await page.waitForTimeout(1500);
  assert.equal(await page.locator('#claude-cutaway').getAttribute('exploded'),'');
  assert.equal(await page.locator('.claude-cutaway-stage').getAttribute('data-state'),'open');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth),true);
  await page.screenshot({path:path.join(out,`${spec.name}-open.png`)});
  await page.close();
}

for(const [index,selector] of [[0,'#panorama'],[1,'#programas'],[2,'#portafolio']]){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(integrated,{waitUntil:'networkidle'}); await page.locator('.claude-archive-launch').click(); await page.waitForTimeout(1100);
  await page.locator('#claude-cutaway').evaluate((host,i)=>{const button=host.shadowRoot.querySelectorAll('.lb')[i];button.click();button.click();},index);
  await page.waitForTimeout(1300);
  const near=await page.locator(selector).evaluate(element=>Math.abs(element.getBoundingClientRect().top)<180);
  assert.equal(near,true,`La ficha ${index+1} no llegó a ${selector}`);
  await page.close();
}

const keyboard=await browser.newPage({viewport:{width:1440,height:900}});
await keyboard.goto(integrated,{waitUntil:'networkidle'}); const host=keyboard.locator('#claude-cutaway'); await host.focus(); await keyboard.keyboard.press('Enter'); await keyboard.waitForTimeout(800); assert.equal(await host.getAttribute('exploded'),''); await keyboard.keyboard.press('1'); await keyboard.keyboard.press('Escape'); await keyboard.waitForTimeout(500); assert.equal(await host.getAttribute('exploded'),null); await keyboard.close();

const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await reduced.goto(integrated,{waitUntil:'networkidle'}); await reduced.waitForTimeout(600); assert.equal(await reduced.locator('#claude-cutaway').evaluate(host=>host.shadowRoot.querySelectorAll('.static button').length),3); await reduced.screenshot({path:path.join(out,'mobile-reduced.png')}); await reduced.close();
await browser.close();

const noGlBrowser=await chromium.launch({headless:true,executablePath,args:['--disable-webgl']});
const noGl=await noGlBrowser.newPage({viewport:{width:1440,height:900}}); await noGl.goto(integrated,{waitUntil:'networkidle'}); await noGl.waitForTimeout(700); assert.equal(await noGl.locator('#claude-cutaway').evaluate(host=>host.shadowRoot.querySelectorAll('.static button').length),3); await noGl.screenshot({path:path.join(out,'desktop-no-webgl.png')}); await noGlBrowser.close();

assert.deepEqual(errors,[]);
console.log(JSON.stringify({sameViewports:['1440x900','390x844'],destinations:['panorama','programas','portafolio'],keyboard:true,reducedMotion:true,noWebgl:true,pageErrors:errors},null,2));
