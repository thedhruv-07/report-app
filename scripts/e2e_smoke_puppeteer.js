const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const previewUrl = process.env.PREVIEW_URL || 'http://localhost:5173';
  const token = process.env.REPORT_TOKEN || '';
  const user = process.env.REPORT_USER || '';

  console.log('Starting Puppeteer smoke test against', previewUrl);

  const headless = process.env.PUPPETEER_HEADLESS !== 'false';
  const slowMo = parseInt(process.env.PUPPETEER_SLOWMO || '0', 10) || 0;
  const browser = await puppeteer.launch({ headless, slowMo, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    try { consoleLogs.push({ type: msg.type(), text: msg.text() }); } catch (e) { /* ignore */ }
  });
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push({ message: err.message, stack: err.stack });
  });

  const seenUrls = new Set();
  page.on('response', res => {
    try { const url = res.url(); if (url) seenUrls.add(url); } catch (e) {}
  });

  // Wait for site to be up
  const waitForServer = async () => {
    for (let i=0;i<30;i++){
      try {
        const r = await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 2000 });
        if (r && r.status && r.status() < 400) return;
      } catch (e) {}
      await new Promise(r=>setTimeout(r, 500));
    }
    throw new Error('Preview server did not respond');
  };

  await waitForServer();

  // Set auth in localStorage
  if (token) {
    await page.evaluate((t,u)=>{
      localStorage.setItem('reportToken', t);
      if (u) localStorage.setItem('reportUser', u);
    }, token, user);
  }

  // Prepare staged preview data (will be injected via window.__stagePhotos)
  let staged = [];
  try {
    const imgPath = require('path').resolve(__dirname, 'test.png');
    const b64 = fs.readFileSync(imgPath).toString('base64');
    const dataUrl = `data:image/png;base64,${b64}`;
    staged = [{ id: `p_seed_${Date.now()}`, fileName: 'test.png', preview: dataUrl, size: 0 }];
    // only set the inspection step so the Photos pane can mount; do not write stagedPhotos to localStorage
    await page.evaluate(() => { localStorage.setItem('inspectionStep', '12'); });
    console.log('Prepared staged previews (will inject via window.__stagePhotos) and set inspectionStep');
  } catch (se) {
    console.warn('Failed to seed stagedPhotos', se.message);
  }

  // Navigate to PSI form
  await page.goto(previewUrl + '/dashboard/pre-shipment', { waitUntil: 'networkidle2', timeout: 20000 });

  // Diagnostic dump: list file inputs and a short HTML snapshot
  const diagnostics = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type=file]')).map(i => ({ id: i.id || null, name: i.name || null, outerHTML: i.outerHTML.slice(0,200) }));
    const htmlSnippet = document.body ? document.body.innerHTML.slice(0,2000) : '';
    return { inputs, htmlSnippet };
  });
  fs.writeFileSync(require('path').resolve(__dirname, 'e2e_diagnostics.json'), JSON.stringify(diagnostics, null, 2));
  
  // Click the Photos step in the top nav to mount the Photos component
  try {
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const photosBtn = btns.find(b => b.textContent && b.textContent.includes('Photos'));
      if (photosBtn) { photosBtn.click(); return true; }
      return false;
    });
    if (clicked) {
      console.log('Clicked Photos nav button');
      await page.waitForTimeout(500);
    } else {
      console.warn('Photos nav button not found');
    }
  } catch (err) {
    console.warn('Error clicking Photos nav button', err.message);
  }

    // If the Photos component exposes a programmatic staging API, use it to inject previews (more reliable in headless)
    try {
      if (staged && staged.length > 0) {
        const injected = await page.evaluate(async (s) => {
          if (window.__stagePhotos && typeof window.__stagePhotos === 'function') {
            try { window.__stagePhotos(s); return true; } catch (e) { return false; }
          }
          return false;
        }, staged);
        if (injected) console.log('Injected staged previews via window.__stagePhotos');
      }
    } catch (ie) {
      console.warn('Failed to inject staged previews via __stagePhotos', ie.message);
    }

  // Wait for Photos input to appear
  try {
    await page.waitForSelector('#photoFileInput', { timeout: 20000 });
    console.log('Photo input present');
  } catch (err) {
    console.warn('Photo input not found within timeout; diagnostics saved to e2e_diagnostics.json');
  }

  // Attempt file upload if input exists
  const input = await page.$('#photoFileInput');
  if (input) {
    // Make the hidden input visible in case the environment blocks uploads to display:none inputs
    try {
      await page.evaluate(() => {
        const input = document.querySelector('#photoFileInput');
        if (input) {
          input.style.display = 'block';
          input.style.visibility = 'visible';
          input.style.width = '1px';
          input.style.height = '1px';
          input.style.opacity = '1';
        }
      });
    } catch (ve) {
      console.warn('Failed to unhide file input', ve.message);
    }

    await input.uploadFile(require('path').resolve(__dirname, 'test.png'));
    console.log('Uploaded test.png to file input');

    // Some frameworks don't receive the native change event from uploadFile — dispatch one.
    try {
      await page.evaluate(() => {
        const input = document.querySelector('#photoFileInput');
        if (input) input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } catch (ee) {
      console.warn('Failed to dispatch change event', ee.message);
    }

    // Wait for staged preview image to appear (longer timeout)
    try {
      await page.waitForFunction(() => document.querySelectorAll('img[src^="data:image"]').length > 0, { timeout: 10000 });
      console.log('Staged preview detected');
    } catch (e) {
      console.warn('Staged preview not detected');
      // Capture Photos pane HTML and a screenshot for debugging
      try {
        const photosPaneHTML = await page.evaluate(() => {
          const inputEl = document.querySelector('#photoFileInput');
          if (!inputEl) return null;
          const container = inputEl.closest('div') || inputEl.parentElement;
          return container ? container.outerHTML : null;
        });
        if (photosPaneHTML) {
          fs.writeFileSync(require('path').resolve(__dirname, 'e2e_photos_pane.html'), photosPaneHTML);
          console.log('Wrote e2e_photos_pane.html');
        } else {
          console.warn('Photos pane HTML not found to dump');
        }
      } catch (xx) {
        console.warn('Failed to capture Photos pane HTML', xx.message);
      }
      try {
        await page.screenshot({ path: require('path').resolve(__dirname, 'e2e_photos_debug.png'), fullPage: true });
        console.log('Wrote e2e_photos_debug.png');
      } catch (sx) {
        console.warn('Failed to take screenshot', sx.message);
      }
    }
  } else {
    console.warn('Skipping upload; file input not present');
  }

  // Upload test image
  const urls = Array.from(seenUrls);
  const matched = urls.filter(u => /PhotoStagingPanel|PhotoGroupsDisplay|DefectPhotosPanel|WorkmanshipDefects|Photos/.test(u));

  console.log('Chunk-network matches:', matched);

  // Save result
  fs.writeFileSync(require('path').resolve(__dirname, 'e2e_result.json'), JSON.stringify({ matched, urls: urls.slice(0,200) }, null, 2));

  // Save console logs and page errors
  fs.writeFileSync(require('path').resolve(__dirname, 'e2e_console_logs.json'), JSON.stringify({ console: consoleLogs, errors: pageErrors }, null, 2));

  await browser.close();
  console.log('Done — diagnostics and results saved');
})();