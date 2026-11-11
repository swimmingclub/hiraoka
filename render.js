// Renders <videoDir>/index.html frame by frame.
// Usage: node render.js <videoDir> <outDir> <durationSec> [t1 t2 ...]
// With extra args, only the given timestamps (seconds) are captured as previews.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FPS = 30, WORKERS = 4;
const [dir, out, durArg, ...rest] = process.argv.slice(2);
const DUR = Number(durArg);
const stills = rest.map(Number);
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await page.goto('file://' + path.resolve(dir, 'index.html'));
    await page.evaluate(async t => { seek(t); await document.fonts.ready; }, DUR - 0.1);
    await page.waitForTimeout(500);
    await page.evaluate(() => document.fonts.ready);
    return page;
  };
  const shot = async (page, t, file) => {
    await page.evaluate(t => seek(t), t);
    await page.screenshot({ path: path.join(out, file) });
  };
  if (stills.length) {
    const page = await open();
    for (const t of stills) await shot(page, t, `still_${t}.png`);
  } else {
    const total = FPS * DUR;
    let next = 0;
    await Promise.all([...Array(WORKERS)].map(async () => {
      const page = await open();
      while (next < total) {
        const f = next++;
        await shot(page, f / FPS, `f${String(f).padStart(4, '0')}.png`);
      }
    }));
  }
  await browser.close();
})();
