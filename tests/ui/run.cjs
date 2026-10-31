const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createFixtures}=require('./fixtures.cjs');
const baseURL=process.env.ULTRA_UI_URL || 'http://localhost:3000';
const channel=process.env.ULTRA_UI_BROWSER || (process.platform==='win32' ? 'msedge' : 'chrome');
const output=path.join(__dirname,'artifacts');
const cases=[{name:'desktop',width:1440,height:1000},{name:'short-desktop',width:1024,height:650},{name:'mobile',width:390,height:844},{name:'small-phone',width:320,height:568},{name:'landscape',width:740,height:360}];
async function check(browser,viewport) {
  const fixture=createFixtures(), errors=[], blocked=[];
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.tracing.start({screenshots:true,snapshots:true});
  await context.routeWebSocket('**/*',socket=>socket.close());
  await context.route('**/*',async route=>{
    const request=route.request(), url=new URL(request.url());
    if(url.pathname.includes('/api/')) {
      let body={};try {body=request.postDataJSON() || {};}catch {}
      const reply=fixture.response(request.method(),url.pathname.slice(url.pathname.indexOf('/api')+4),body);
      if(reply.status===501) blocked.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({status:reply.status,contentType:'application/json',body:JSON.stringify(reply.body)});
    }
    if(url.pathname==='/ui-test-result.svg') return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#164e63"/><text x="50" y="400" fill="white" font-size="40">UI fixture result</text></svg>'});
    if(url.origin!==new URL(baseURL).origin || !['GET','HEAD'].includes(request.method())) return route.abort();
    return route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.setDefaultTimeout(15000);
  try {
    await page.goto(`${baseURL}/character/new/s/hair`,{waitUntil:'domcontentloaded'});
    const root=page.getByRole('region',{name:'Creation workspace'});
    const task=label=>root.getByRole('navigation',{name:'Creation tasks'}).getByRole('button',{name:label,exact:true});
    const generate=root.getByRole('button',{name:'Generate',exact:true});
    const fit=async()=>{
      for(const item of [task('Design'),task('Preview'),generate]){
        assert.ok(await item.evaluate(el=>{const b=el.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.left>=0 && b.top>=0 && b.right<=innerWidth+1 && b.bottom<=innerHeight+1 && el.contains(hit);}), 'Task and Generate actions fit the viewport and receive taps');
      }
      const panel=root.locator('.bench-scroll');
      assert.ok(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Current task must fit the panel width');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1 && document.documentElement.scrollHeight<=innerHeight+1),'Builder should fit the viewport');
    };
    await root.waitFor();await fit();
    await root.getByTestId('chip-hair-style-straight').click();
    await root.getByLabel('Category',{exact:true}).selectOption('wardrobe');
    const wardrobe=root.getByTestId('wardrobe-focused-editor');await wardrobe.getByTestId('wardrobe-mode-custom').click();
    await wardrobe.getByLabel('Editing',{exact:true}).selectOption('top');
    await wardrobe.getByLabel('Choice category',{exact:true}).selectOption('Everyday');
    await wardrobe.getByTestId('chip-wardrobe-top-t-shirt').click();
    await root.getByLabel('Character name').fill('UI walkthrough');
    await root.getByRole('button',{name:'Save character'}).click();await page.waitForURL('**/character/ui-character/**');
    await task('Settings').click();await fit();await root.getByLabel('Settings menu').selectOption('Prompts');await fit();
    await task('Randomize').click();await root.getByRole('button',{name:'Scene only',exact:true}).click();
    await fit();await generate.click();
    await task('Preview').click();await root.getByTestId('studio-preview-media').locator('img').waitFor();
    assert.equal(fixture.dispatches,1);assert.equal(fixture.requests[0].subjects[0].dna.wardrobe.top,'t-shirt');
    await page.getByTestId(viewport.width>=768?'nav-gallery':'nav-gallery-mobile').click();await page.waitForURL('**/gallery');await page.goBack();
    await root.getByTestId('studio-preview-media').locator('img').waitFor();
    await task('Design').click();await root.getByLabel('Category',{exact:true}).selectOption('hair');
    assert.equal(await root.getByTestId('chip-hair-style-straight').getAttribute('aria-pressed'),'true');await fit();
    assert.deepEqual(errors,[],'Unexpected browser runtime errors');
    assert.deepEqual(blocked,[],'Fixture needs an explicit handler for these writes');
    await page.screenshot({path:path.join(output,`${viewport.name}.png`),fullPage:true});
    return {name:viewport.name,status:'passed'};
  } catch(error) {
    await page.screenshot({path:path.join(output,`${viewport.name}-failed.png`),fullPage:true}).catch(()=>{});
    return {name:viewport.name,status:'failed',error:error.message,runtimeErrors:errors,unhandledWrites:blocked};
  } finally {
    await context.tracing.stop({path:path.join(output,`${viewport.name}-trace.zip`)});
    await context.close();
  }
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify({status:'starting',startedAt:new Date().toISOString(),baseURL,channel},null,2));
  let browser;
  try {
    browser=await chromium.launch({channel,headless:process.env.ULTRA_UI_HEADED!=='1'});
    const results=[];
    for(const viewport of cases) results.push(await check(browser,viewport));
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify({baseURL,channel,results},null,2));
    console.log(JSON.stringify(results,null,2));
    if(results.some(result=>result.status==='failed'))process.exitCode=1;
  }catch(error){await fs.writeFile(path.join(output,'report.json'),JSON.stringify({status:'blocked',error:error.message,baseURL,channel},null,2));console.error(`UI checks could not start: ${error.message}\nInstall Microsoft Edge or Chrome and set ULTRA_UI_BROWSER to msedge or chrome.`);process.exitCode=1;}
  finally {await browser?.close();}
})();
