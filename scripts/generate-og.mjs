import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const logo = readFileSync(join(root, 'public/tracksy-mark-green.png')).toString('base64');
const logoSrc = `data:image/png;base64,${logo}`;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,800;1,800&display=swap');
  body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #070a0f;
    font-family: 'Inter', system-ui, sans-serif;
    position: relative;
  }
  .glow-tl {
    position: absolute;
    top: -160px; left: -160px;
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(29,185,84,0.22) 0%, rgba(29,185,84,0.05) 50%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
  .glow-br {
    position: absolute;
    bottom: -200px; right: -100px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(29,185,84,0.09) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 100px;
  }
  .logo {
    height: 120px;
    width: auto;
    margin-bottom: 48px;
    display: block;
    align-self: flex-start;
  }
  .headline {
    font-size: 72px;
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
    letter-spacing: -2.5px;
    white-space: nowrap;
    margin-bottom: 0;
  }
  .headline .smart {
    color: #5af5a0;
    font-style: italic;
  }
  .pills {
    display: flex;
    gap: 14px;
  }
  .pill {
    padding: 10px 22px;
    border: 1.5px solid rgba(29,185,84,0.45);
    border-radius: 100px;
    color: rgba(90,245,160,0.85);
    font-size: 17px;
    font-weight: 400;
    letter-spacing: 2px;
    background: rgba(29,185,84,0.08);
  }
  .url {
    position: absolute;
    bottom: 44px;
    right: 100px;
    color: rgba(255,255,255,0.28);
    font-size: 18px;
    font-weight: 400;
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>
  <div class="glow-tl"></div>
  <div class="glow-br"></div>
  <div class="content">
    <img class="logo" src="${logoSrc}" alt="Tracksy"/>
    <div class="headline">Sort your playlists</div>
    <div class="headline" style="margin-bottom:48px">
      the <span class="smart">smart</span> way.
    </div>
    <div class="pills">
      <div class="pill">BPM</div>
      <div class="pill">ENERGY</div>
      <div class="pill">POPULARITY</div>
    </div>
  </div>
  <div class="url">tracksy-rho.vercel.app</div>
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });

const png = await page.screenshot({ type: 'png' });
await browser.close();

const outPath = join(root, 'public/tracksy-og.png');
writeFileSync(outPath, png);
console.log(`Written ${(png.byteLength / 1024).toFixed(1)} KB → ${outPath}`);
