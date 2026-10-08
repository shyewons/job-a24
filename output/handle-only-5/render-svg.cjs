const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/zxaq3/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async () => {
  const source = path.join(__dirname, 'ribbon-tab.svg');
  const png = path.join(__dirname, 'ribbon-tab-preview.png');
  const output = await sharp(fs.readFileSync(source), { density: 192 }).png().toFile(png);
  console.log(JSON.stringify({output:png,width:output.width,height:output.height}));
})().catch(error => { console.error(error); process.exit(1); });
