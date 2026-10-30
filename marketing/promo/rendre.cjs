const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = __dirname, fps = 30, total = +process.argv[2] || 25, out = path.join(dir, 'frames');
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(dir, 'video.html')); await p.waitForTimeout(1500);
  const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
  const n = Math.round(total * fps);
  for (let f = 0; f < n; f++) {
    const t = f / fps;
    if (only && !only.some((x) => Math.abs(x - t) < 1e-6)) continue;
    await p.evaluate((t) => window.render(t), t);
    await p.screenshot({ path: path.join(out, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
