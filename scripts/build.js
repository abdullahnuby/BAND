import { mkdir, readFile, readdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { Script } from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sourceDir = resolve(root, 'src');
const outDir = resolve(root, 'dist');
const jsFiles = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (item.isDirectory()) await walk(path);
    else if (item.isFile() && path.endsWith('.js')) jsFiles.push(path);
  }
}
await walk(sourceDir);
await walk(resolve(root, 'api'));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Syntax error: ${relative(root, file)}\n`);
    process.exit(1);
  }
}
const html = await readFile(resolve(root, 'public/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
for (const match of scripts) {
  const code = match[1].trim();
  if (!code) continue;
  const openingTag = match[0].slice(0, match[0].indexOf('>'));
  if (/\btype\s*=\s*["']module["']/i.test(openingTag)) {
    const result = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: code, encoding: 'utf8' });
    if (result.status !== 0) { process.stderr.write(result.stderr || result.stdout || 'Invalid inline module script\n'); process.exit(1); }
  } else {
    try { new Script(code, { filename: 'public/index.html:inline-script' }); }
    catch (error) { console.error(error); process.exit(1); }
  }
}
await mkdir(outDir, { recursive: true });
await copyFile(resolve(root, 'public/index.html'), resolve(outDir, 'index.html'));
await copyFile(resolve(root, 'public/favicon.svg'), resolve(outDir, 'favicon.svg'));
await copyFile(resolve(root, 'public/band-logo.svg'), resolve(outDir, 'band-logo.svg'));
await copyFile(resolve(root, 'src/shared/quantity-rules.js'), resolve(outDir, 'quantity-rules.js'));
await copyFile(resolve(root, 'src/shared/material-rules.js'), resolve(outDir, 'material-rules.js'));
await copyFile(resolve(root, 'src/shared/workflow-routes.js'), resolve(outDir, 'workflow-routes.js'));
console.log(`BAND build passed: ${jsFiles.length} server/API JS files + ${scripts.length} HTML script blocks checked.`);
