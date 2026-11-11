import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// 只从 Vite 产物制作公开试玩包，源码、开发记录与玩家存档不进入部署分支。
const root = process.cwd();
const dist = path.join(root, 'dist');
const output = path.join(root, 'artifacts', 'pages');
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
if (!html.includes('./assets/')) throw new Error('请先使用相对 base 执行 npm run build。');
await mkdir(path.dirname(output), { recursive: true });
await rm(output, { recursive: true, force: true });
await cp(dist, output, { recursive: true });
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'README.md'), '# 研究生桌面模拟器 · 在线试玩\n\n此分支保存 GitHub Pages 所需的网页构建产物，源码位于 main 分支。\n\n在线试玩：https://lep-ton.github.io/graduate-desktop-simulator/\n\n玩家进度保存在各自浏览器本地，可在游戏内导入和导出存档。\n');
console.log(output);
