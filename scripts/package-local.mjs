import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// 将 Vite 的本地资源内联，便于离线双击试玩；正式源码和常规构建仍保留模块结构。
const root = process.cwd();
const dist = path.join(root, 'dist');
let html = await readFile(path.join(dist, 'index.html'), 'utf8');
const script = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/);
if (!script || !style) throw new Error('未找到完整构建产物，请先执行 npm run build。');
const js = await readFile(path.join(dist, script[1].replace(/^\//, '')), 'utf8');
const css = await readFile(path.join(dist, style[1].replace(/^\//, '')), 'utf8');
html = html.replace(script[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(style[0], () => `<style>${css}</style>`);
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const target = path.join(root, 'artifacts', 'GradOS-即点即玩.html');
await writeFile(target, html);
console.log(target);
