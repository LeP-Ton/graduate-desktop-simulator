# 研究生桌面模拟器

## 项目定位
中文网页桌面科研模拟游戏，首版为可连续游玩四周的研究生生活。采用 React + TypeScript + Vite，浏览器本地存档，无外部模型或 GPU 依赖。

## 目录与架构
- `src/game/`：类型、配置、可复现随机数、时间与事件引擎、实验与审稿规则、存档校验。核心规则不放在 UI 中。
- `src/components/`：桌面窗口、科研软件和新建身份界面。
- `src/styles.css`：中文桌面界面与响应式样式。
- `tests/`：游戏规则与四周闭环验证。
- `.agentdocs/index.md`：需求导航；需求 README 为恢复上下文的首要入口。
- `TODO.md`：实现状态与扩展边界。

## 开发与验证
- `npm install` 安装依赖，`npm run dev` 启动本地开发。
- `npm run build` 执行 TypeScript 检查并构建，`npm test` 验证引擎。
- `npm run package:pages` 生成 `artifacts/pages/`；源码位于 main，构建产物发布到同仓库 gh-pages 分支根目录，使用 GitHub Pages 托管。
- 在线试玩地址：`https://lep-ton.github.io/graduate-desktop-simulator/`。Vite 使用相对 base，保持项目子目录下的资源可用。
- 模拟时间以小时表示，最小推进步长 0.25 小时；四周上限 672 小时。动作推进和自动推进使用同一时间函数。
- 所有随机行为使用存档中的种子；禁止在核心规则中使用 `Math.random()`。
- 时间推进时处理后台队列、NPC 日程、组会和审稿，不依赖界面打开状态。
- 存档包含版本号并校验输入，运行时不访问真实大模型 API。

## 协作规范
回复、文档和新增代码注释使用中文。聊天回复使用递增 `会话-N：` 前缀。优先说明结果、验证与未验证项。
实际代码改动归入明确需求，维护需求 README、阶段记录与 TODO；Git 负责精确历史。没有提交时写明尚未提交。
时间采用 Asia/Shanghai。优先使用 `rg` 定向检索，不全量扫描历史需求文档。
