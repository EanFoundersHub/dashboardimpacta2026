import {chromium} from '../../impacta-2026-motion-lab-01/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const out = path.join(root, 'evidence', 'redesign-after');
const before = path.join(root, 'evidence', 'redesign-before');
const raw = path.join(out, 'raw');
await Promise.all([fs.mkdir(out,{recursive:true}),fs.mkdir(before,{recursive:true}),fs.mkdir(raw,{recursive:true})]);
const executablePath='C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser=await chromium.launch({headless:true,executablePath});
const errors=[];

for(const spec of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844}}]){
  const oldPage=await browser.newPage({viewport:spec.viewport});
  await oldPage.goto('http://127.0.0.1:4182/',{waitUntil:'networkidle'});
  await oldPage.screenshot({path:path.join(before,`${spec.name}-portada.png`),fullPage:false});
  await oldPage.locator('#portafolio').scrollIntoViewIfNeeded();
  await oldPage.screenshot({path:path.join(before,`${spec.name}-portafolio.png`),fullPage:false});
  await oldPage.close();

  const page=await browser.newPage({viewport:spec.viewport,reducedMotion:'no-preference'});
  page.on('pageerror',error=>errors.push(`${spec.name}: ${error.message}`));
  await page.goto('http://127.0.0.1:4184/',{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(out,`${spec.name}-portada-cerrada.png`),fullPage:false});
  await page.locator('.archive-launch').click();
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('#archive-stage').getAttribute('data-state'),'open');
  assert.equal(await page.locator('.archive-layer-nav').isVisible(),true);
  await page.screenshot({path:path.join(out,`${spec.name}-portada-abierta.png`),fullPage:false});
  await page.locator('[data-archive-layer="ventures"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(out,`${spec.name}-portafolio.png`),fullPage:false});
  await page.locator('#phase-filter').selectOption({label:'Crece'});
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#filtered-total').innerText(),'37');
  assert.match(await page.locator('#active-filters').innerText(),/Crece/i);
  await page.locator('[data-metric="sales"]').click();
  assert.equal(await page.locator('#metric-dialog').evaluate(element=>element.open),true);
  await page.screenshot({path:path.join(out,`${spec.name}-crece-ventas.png`),fullPage:false});
  await page.locator('.metric-records button').first().click();
  assert.equal(await page.locator('#venture-dialog').evaluate(element=>element.open),true);
  await page.screenshot({path:path.join(out,`${spec.name}-expediente.png`),fullPage:false});
  await page.close();
}

const keyboard=await browser.newPage({viewport:{width:1440,height:900}});
await keyboard.goto('http://127.0.0.1:4184/',{waitUntil:'networkidle'});
await keyboard.locator('.archive-launch').focus(); await keyboard.keyboard.press('Enter'); await keyboard.waitForTimeout(900);
assert.equal(await keyboard.locator('.archive-layer-nav a').first().evaluate(el=>el===document.activeElement),true);
await keyboard.keyboard.press('Escape');
assert.equal(await keyboard.locator('#archive-stage').getAttribute('data-state'),'closed');
await keyboard.close();

const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await reduced.goto('http://127.0.0.1:4184/',{waitUntil:'networkidle'});
assert.equal(await reduced.locator('#archive-stage').getAttribute('data-webgl'),'fallback');
assert.equal(await reduced.locator('.archive-layer-nav').isVisible(),true);
await reduced.screenshot({path:path.join(out,'mobile-reduced-motion.png')}); await reduced.close();

const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:raw,size:{width:1440,height:900}}});
const journey=await context.newPage(); await journey.goto('http://127.0.0.1:4184/',{waitUntil:'networkidle'}); await journey.waitForTimeout(800);
await journey.locator('.archive-launch').click(); await journey.waitForTimeout(1800); await journey.locator('[data-archive-layer="ventures"]').click(); await journey.waitForTimeout(900); await journey.locator('#phase-filter').selectOption({label:'Crece'}); await journey.waitForTimeout(900); await journey.locator('[data-metric="sales"]').click(); await journey.waitForTimeout(1100); await journey.locator('.metric-records button').first().click(); await journey.waitForTimeout(1600);
const video=journey.video(); await journey.close(); const rawVideo=await video.path(); await context.close(); await fs.rename(rawVideo,path.join(out,'recorrido-portada-a-expediente.webm'));
await browser.close();

const fallbackBrowser=await chromium.launch({headless:true,executablePath,args:['--disable-webgl']});
const noWebgl=await fallbackBrowser.newPage({viewport:{width:1440,height:900}}); await noWebgl.goto('http://127.0.0.1:4184/',{waitUntil:'networkidle'}); assert.equal(await noWebgl.locator('#archive-stage').getAttribute('data-webgl'),'fallback'); await noWebgl.screenshot({path:path.join(out,'desktop-sin-webgl.png')}); await fallbackBrowser.close();

assert.deepEqual(errors,[]);
console.log(JSON.stringify({desktopMobile:true,portfolioCrece:37,keyboard:true,reducedMotion:true,noWebgl:true,pageErrors:errors},null,2));
