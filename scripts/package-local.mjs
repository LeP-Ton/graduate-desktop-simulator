import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

// 将 Vite 的本地资源内联，便于离线双击试玩；正式源码和常规构建仍保留模块结构。
const root = process.cwd();
const dist = path.join(root, "dist");
let html = await readFile(path.join(dist, "index.html"), "utf8");
const script = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/);
if (!script || !style)
  throw new Error("未找到完整构建产物，请先执行 npm run build。");
const js = await readFile(
  path.join(dist, script[1].replace(/^\//, "")),
  "utf8",
);
const css = await readFile(
  path.join(dist, style[1].replace(/^\//, "")),
  "utf8",
);
// 原始系统图片一起内联，双击离线文件时不依赖旁边的图片目录。
const images = {};
async function collectImages(directory, prefix = "") {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    const key = `${prefix}${item.name}`;
    if (item.isDirectory()) await collectImages(file, `${key}/`);
    else if (/\.(png|jpe?g)$/i.test(item.name)) {
      const type = item.name.endsWith(".png") ? "image/png" : "image/jpeg";
      images[key] =
        `data:${type};base64,${(await readFile(file)).toString("base64")}`;
    }
  }
}
await collectImages(path.join(dist, "period-assets"));
html = html.replace(
  script[0],
  () =>
    `<script>window.__PERIOD_ASSETS__=${JSON.stringify(images)};</script><script type="module">${js.replace(/<\/script/gi, "<\\/script")}</script>`,
);
html = html.replace(style[0], () => `<style>${css}</style>`);
await mkdir(path.join(root, "artifacts"), { recursive: true });
const target = path.join(
  root,
  "artifacts",
  "研究生桌面模拟器2012-即点即玩.html",
);
await writeFile(target, html);
// 保留旧交付链接的文件名，内容同步更新到2012版。
await writeFile(path.join(root, "artifacts", "GradOS-即点即玩.html"), html);
console.log(target);
