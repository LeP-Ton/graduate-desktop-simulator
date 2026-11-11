import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // 游戏不使用路径路由，相对资源地址同时适配 Pages 项目子目录与离线打包。
  base: "./",
});
