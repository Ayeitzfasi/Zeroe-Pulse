// Post-build script to fix extension structure
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const sidepanelDir = path.join(distDir, 'sidepanel');

// Ensure sidepanel directory exists
if (!fs.existsSync(sidepanelDir)) {
  fs.mkdirSync(sidepanelDir, { recursive: true });
}

// Move HTML from src/sidepanel to sidepanel
const srcHtml = path.join(distDir, 'src', 'sidepanel', 'index.html');
const destHtml = path.join(sidepanelDir, 'index.html');
if (fs.existsSync(srcHtml)) {
  let html = fs.readFileSync(srcHtml, 'utf8');

  // Fix paths to be relative within sidepanel folder
  html = html.replace(/src="\/sidepanel\.js"/g, 'src="./sidepanel.js"');
  html = html.replace(/href="\/assets\/sidepanel\.css"/g, 'href="./sidepanel.css"');

  fs.writeFileSync(destHtml, html);
  console.log('Fixed and moved index.html');
}

// Move JS to sidepanel folder
const srcJs = path.join(distDir, 'sidepanel.js');
const destJs = path.join(sidepanelDir, 'sidepanel.js');
if (fs.existsSync(srcJs)) {
  fs.renameSync(srcJs, destJs);
  console.log('Moved sidepanel.js');
}

// Move CSS to sidepanel folder
const srcCss = path.join(distDir, 'assets', 'sidepanel.css');
const destCss = path.join(sidepanelDir, 'sidepanel.css');
if (fs.existsSync(srcCss)) {
  fs.renameSync(srcCss, destCss);
  console.log('Moved sidepanel.css');
}

// Clean up empty directories
const srcDir = path.join(distDir, 'src');
const assetsDir = path.join(distDir, 'assets');

function removeEmptyDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

removeEmptyDir(srcDir);
removeEmptyDir(assetsDir);

console.log('Build fixed successfully!');
