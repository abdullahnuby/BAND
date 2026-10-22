import { cp, mkdir, rm, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'dist');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await copyFile(resolve(root, 'index.html'), resolve(out, 'index.html'));
await cp(resolve(root, 'public'), out, { recursive: true });
console.log(`BAND static build ready: ${out}`);
