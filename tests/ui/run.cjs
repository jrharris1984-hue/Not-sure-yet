const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createFixtures}=require('./fixtures.cjs');
const baseURL=process.env.ULTRA_UI_URL || 'http://localhost:3000';
const channel=process.env.ULTRA_UI_BROWSER || (process.platform==='win32' ? 'msedge' : 'chrome');
const output=path.join(__dirname,'artifacts');
const cases=[{name:'desktop',width:1440,height:1000},{name:'short-desktop',width:1024,height:650},{name:'mobile',width:390,height:844}];
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
    if(viewport.width>=768) {
      await page.getByTestId('dna-section-hair').waitFor({state:'visible'});
      await page.screenshot({path:path.join(output,`${viewport.name}-initial.png`),fullPage:false});
      const choiceVisible = await page.locator('[data-testid^="chip-hair-style-"]:not([data-testid*="-tab-"])').evaluateAll(buttons => buttons.some(button => {
        const bounds=button.getBoundingClientRect();
        if(button.disabled || bounds.width<=0 || bounds.height<=0 || bounds.top<0 || bounds.bottom>innerHeight) return false;
        const hit=document.elementFromPoint(bounds.left+bounds.width/2,bounds.top+bounds.height/2);
        return hit===button || button.contains(hit);
      }));
      assert.ok(choiceVisible,'No editable hair choice is visible before scrolling');
      const hairChoice=page.getByTestId('chip-hair-style-straight');
      await hairChoice.click();
      assert.equal(await hairChoice.getAttribute('aria-pressed'),'true','Hair choice should be selected');
      const choiceSearch=page.getByTestId('dna-section-hair').getByRole('searchbox',{name:'Search choices',exact:true});
      await choiceSearch.fill('waves beach');
      await page.getByTestId('chip-hair-style-beach-waves').waitFor({state:'visible'});
      await choiceSearch.press('Escape');
      assert.equal(await choiceSearch.inputValue(),'','Escape should clear choice search');
      assert.equal(await hairChoice.getAttribute('aria-pressed'),'true','Searching must retain the selection');

      const categories=page.getByRole('navigation',{name:'Design categories'});
      await categories.getByRole('button',{name:'Skin',exact:true}).click();
      await categories.getByRole('button',{name:'Hair',exact:true}).click();
      assert.equal(await hairChoice.getAttribute('aria-pressed'),'true','Category navigation must retain the selected choice');
      if(!await page.locator('.studio-more-actions').evaluate(el=>el.open)) await page.locator('.studio-more-actions > summary').click();
      await page.getByTestId('btn-desktop-studio-mode').click();
      await page.getByTestId('btn-desktop-studio-mode').click();
      assert.equal(await hairChoice.getAttribute('aria-pressed'),'true','Switching views must retain the selected choice');
      assert.equal(await page.locator('.studio-more-library').evaluate(link=>{
        const box=link.getBoundingClientRect();
        const hit=document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
        return hit===link || link.contains(hit);
      }),true,'More actions must appear above the editing controls');
      await page.screenshot({path:path.join(output,`${viewport.name}-more.png`),fullPage:false});
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.studio-more-actions').evaluate(el=>el.open),false,'Escape should close More');
      assert.equal(await page.locator('.studio-more-actions > summary').evaluate(el=>el===document.activeElement),true,'More should restore trigger focus');
      const viewSwitch=page.getByRole('group',{name:'Editor view',exact:true});
      await viewSwitch.getByRole('button',{name:'Preview',exact:true}).click();
      assert.equal(await page.locator('.workspace-editor-content').isVisible(),false,'Preview should hide editing controls');
      await viewSwitch.getByRole('button',{name:'Edit',exact:true}).click();
      assert.equal(await hairChoice.getAttribute('aria-pressed'),'true','View changes must preserve selections');
      const workflowMenu=page.locator('.workspace-workflow-menu');
      await workflowMenu.locator('summary').click();
      await page.getByLabel('Generation workflow',{exact:true}).waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      assert.equal(await workflowMenu.evaluate(element=>element.open),false,'Escape should close workflow settings');
      const name=page.getByTestId('input-character-name');
      await name.fill('UI walkthrough');
      const drawerButton=page.getByRole('button',{name:/^Selected details \(/});
      await page.locator('.studio-more-actions > summary').click();
      await drawerButton.click();
      const drawer=page.locator('dialog[open]');await drawer.waitFor();
      await drawer.getByRole('searchbox').fill('hair');
      await drawer.getByRole('button',{name:'Close',exact:true}).focus();
      await page.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});
      assert.equal(await drawerButton.evaluate(el=>el===document.activeElement),true,'Escape must restore focus');
      await page.getByTestId('btn-save-character').click();
      await page.waitForURL('**/character/ui-character/**');
      await page.getByTestId('btn-dispatch-comfyui-render').click();
      await page.waitForFunction(()=>document.body.textContent.includes('Ready to view'));
      assert.equal(fixture.dispatches,1,'Render should submit exactly once to the fixture');
      if(viewport.width>=1280) {
        await page.getByRole('group',{name:'Editor view',exact:true}).getByRole('button',{name:'Split',exact:true}).click();
        const expand=page.locator('.workspace-preview-content').getByRole('button',{name:'View larger preview'});
        await expand.click();
        const enlarged=page.getByRole('dialog',{name:'Expanded character preview'});
        await enlarged.waitFor({state:'visible'});
        await page.keyboard.press('Escape');
        await enlarged.waitFor({state:'hidden'});
        assert.equal(await expand.evaluate(el=>el===document.activeElement),true,'Closing the larger preview must restore focus');
        assert.equal(fixture.dispatches,1,'Viewing a preview must not submit another render');
      }
      if(viewport.width>=1280){
        await page.locator('.workspace-preview-options > summary').click();
        await page.locator('.workspace-preview-size input').press('End');
      }
      const galleryLink=page.getByTestId(viewport.width>=1280?'nav-gallery':'nav-gallery-tablet');
      const views=page.getByRole('group',{name:'Editor view',exact:true});
      await views.getByRole('button',{name:'Preview',exact:true}).click();
      for(const browserBack of [true,false]) {
        await galleryLink.click();await page.waitForURL('**/gallery');
        await page.getByRole('button',{name:'Back to editor',exact:true}).waitFor({state:'visible'});
        if(browserBack)await page.goBack();
        else await page.getByRole('button',{name:'Back to editor',exact:true}).click();
        await page.getByTestId('input-character-name').waitFor();
        await page.waitForFunction(()=>document.querySelector('[data-workspace-mode]')?.dataset.workspaceMode==='preview');
        await page.locator('.workspace-preview-content img').waitFor({state:'visible'});
        assert.equal(await page.getByTestId('input-character-name').inputValue(),'UI walkthrough');
        assert.equal(fixture.dispatches,1,'Returning from Gallery must not render again');
        if(viewport.width>=1280) assert.equal(await page.locator('[data-workspace-mode]').evaluate(el=>el.style.getPropertyValue('--workspace-preview-width')),'480px','Preview width should survive Gallery');

      }
      await page.reload({waitUntil:'domcontentloaded'});
      assert.equal(await page.getByTestId('input-character-name').inputValue(),'UI walkthrough');
    } else {
      const nav=page.getByRole('navigation',{name:'Workspace views'});
      await nav.getByRole('button',{name:'Preview',exact:true}).click();
      assert.match(await page.getByTestId('primary-creation-sheet').getAttribute('class'),/sheet-peek/);
      await page.getByTestId('nav-gallery-mobile').click();await page.waitForURL('**/gallery');
      await page.goBack();
      await page.getByTestId('primary-creation-sheet').waitFor();
      assert.match(await page.getByTestId('primary-creation-sheet').getAttribute('class'),/sheet-peek/,'Mobile preview stays open after Gallery');
      await nav.getByRole('button',{name:'Results',exact:true}).click();
      await page.getByRole('dialog').getByText(/No results yet/).waitFor();
      await nav.getByRole('button',{name:'Edit',exact:true}).click();
      await page.getByRole('dialog').waitFor({state:'hidden'});
      const sheet=await page.getByTestId('primary-creation-sheet').boundingBox();
      const dock=await page.locator('.sheet-generation-dock').boundingBox();
      assert.ok(sheet.y+sheet.height<=dock.y+2,'Editing sheet overlaps the bottom action dock');
    }
    await page.goto(`${baseURL}/character/new/s/wardrobe`,{waitUntil:'domcontentloaded'});
    if(viewport.width>=768) await page.getByRole('group',{name:'Editor view',exact:true}).getByRole('button',{name:'Edit',exact:true}).click();
    const wardrobe=page.locator('[data-testid="wardrobe-focused-editor"]:visible');
    await wardrobe.waitFor({state:'visible'});
    assert.equal(await wardrobe.getByTestId('wardrobe-mode-controls').count(),1,'Wardrobe should show one mode selector');
    assert.equal(await wardrobe.locator('[data-testid^="desktop-edit-"]').count(),0,'Duplicate field cards should be absent');
    await wardrobe.getByTestId('wardrobe-mode-custom').click();
    const detailPicker=wardrobe.getByRole('button',{name:'All details',exact:true});
    await detailPicker.click();
    await wardrobe.getByRole('group',{name:'Choose a detail',exact:true}).getByRole('button',{name:'Top',exact:true}).click();
    assert.equal(await wardrobe.getByLabel('Editing',{exact:true}).inputValue(),'top','Detail map should navigate directly to the chosen control');
    assert.equal(await detailPicker.evaluate(el=>el===document.activeElement),true,'Choosing a detail returns focus to the picker trigger');
    await detailPicker.click();
    await wardrobe.getByRole('group',{name:'Choose a detail',exact:true}).getByRole('button',{name:'Top',exact:true}).focus();
    await page.keyboard.press('Escape');
    assert.equal(await detailPicker.getAttribute('aria-expanded'),'false','Escape should dismiss the detail map');
    await wardrobe.getByLabel('Editing',{exact:true}).selectOption('top');
    await wardrobe.getByLabel('Choice category',{exact:true}).selectOption('Everyday');
    await wardrobe.getByTestId('chip-wardrobe-top-t-shirt').click();
    await wardrobe.getByRole('button',{name:'Favorite selected',exact:true}).click();
    await wardrobe.getByRole('button',{name:'Favorites (1)',exact:true}).click();
    assert.equal(await wardrobe.locator('.visual-choice').count(),1,'Favorites should narrow the picker without changing the selection');
    assert.equal(await wardrobe.getByTestId('chip-wardrobe-top-t-shirt').getAttribute('aria-pressed'),'true');
    await wardrobe.getByRole('button',{name:'Favorites (1)',exact:true}).click();
    await wardrobe.getByRole('button',{name:'Next detail',exact:true}).click();
    await wardrobe.getByRole('button',{name:'Previous detail',exact:true}).click();
    assert.equal(await wardrobe.getByTestId('chip-wardrobe-top-t-shirt').getAttribute('aria-pressed'),'true','Previous/next detail navigation should retain choices');

    await wardrobe.getByRole('button',{name:'Shoes',exact:true}).click();
    await wardrobe.getByRole('button',{name:'Clothes',exact:true}).click();
    await wardrobe.getByLabel('Editing',{exact:true}).selectOption('top');
    assert.equal(await wardrobe.getByTestId('chip-wardrobe-top-t-shirt').getAttribute('aria-pressed'),'true','Wardrobe navigation should retain selections');
    if(viewport.width>=768){
      const count=fixture.dispatches;
      const surprise=page.getByRole('button',{name:'Surprise me & generate',exact:true}).filter({visible:true});
      await surprise.click();
      await page.waitForFunction(()=>document.querySelector('[data-testid="btn-dispatch-comfyui-render"]')?.disabled===false);
      assert.equal(fixture.dispatches,count+1,'Surprise must submit exactly one image');
      const sent=fixture.requests.at(-1);
      assert.equal(sent.subjects[0].dna.wardrobe.top,'t-shirt','Surprise must preserve the selected outfit');
      assert.equal(sent.batch_size,1);
      assert.ok(sent.subjects[0].dna.scene,'Randomized scene must be included in the submitted snapshot');
    }
    if(viewport.width>=768){
      await page.goto(`${baseURL}/character/new/s/camera`,{waitUntil:'domcontentloaded'});
      await page.getByLabel('Editing detail',{exact:true}).selectOption('angle');
      const diagonal=page.getByTestId('chip-camera-angle-overhead-diagonal');
      await diagonal.click();
      assert.equal(await diagonal.getAttribute('aria-pressed'),'true','New camera angles must be selectable');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Page has horizontal overflow');
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
