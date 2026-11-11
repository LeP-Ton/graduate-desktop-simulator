import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  ArrowRight,
  BatteryFull,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  FastForward,
  GraduationCap,
  Grid2X2,
  Leaf,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Search,
  Volume2,
  Wifi,
  X,
} from "lucide-react";
import { Home } from "./components/Home";
import { Literature } from "./components/Literature";
import { Analysis, GPU, IDE, TerminalApp } from "./components/Research";
import { Writer } from "./components/Writer";
import { Calendar, Chat, Mail } from "./components/Social";
import { Academic, AI, Files, Life, Settings } from "./components/OtherApps";
import { DEFAULT_PROFILE, Onboarding } from "./components/Onboarding";
import { APPS, AppIcon, Button, Meter, Pill } from "./components/shared";
import { createGame, reduceGame } from "./game/engine";
import { END_HOUR, MENTORS, gameDate } from "./game/data";
import { loadGame, saveGame } from "./game/storage";
import type { Action, AppId, GameState, Profile } from "./game/types";

interface WindowState {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}
function defaultWindow(id: AppId, index: number): WindowState {
  const w = window.innerWidth,
    h = window.innerHeight;
  return {
    id,
    x: Math.max(20, Math.min(140 + index * 24, w - 800)),
    y: 64 + index * 22,
    width: Math.min(id === "chat" ? 940 : 1060, w - 190),
    height: Math.min(760, h - 178),
    z: index + 1,
    minimized: false,
    maximized: false,
  };
}
const INITIAL_SAVE = loadGame();
export default function App() {
  const [state, setState] = useState<GameState>(
      INITIAL_SAVE || createGame(DEFAULT_PROFILE),
    ),
    [started, setStarted] = useState(!!INITIAL_SAVE),
    [setup, setSetup] = useState(!INITIAL_SAVE);
  const [windows, setWindows] = useState<WindowState[]>([
      defaultWindow("home", 0),
    ]),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [launcher, setLauncher] = useState(false),
    [notifications, setNotifications] = useState(false),
    [query, setQuery] = useState(""),
    [toast, setToast] = useState(""),
    [help, setHelp] = useState(false),
    [wallpaper, setWallpaper] = useState(false);
  const zRef = useRef(2),
    toastRef = useRef<ReturnType<typeof setTimeout> | null>(null),
    savedError = useRef(false),
    drag = useRef<{
      id: AppId;
      startX: number;
      startY: number;
      x: number;
      y: number;
      target: HTMLElement;
    } | null>(null);
  const showToast = useCallback((text: string) => {
    if (!text) return;
    setToast(text);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 5500);
  }, []);
  const dispatch = useCallback(
    (action: Action) => setState((s) => reduceGame(s, action)),
    [],
  );
  const open = useCallback((id: AppId) => {
    setWindows((ws) => {
      const found = ws.find((w) => w.id === id);
      return found
        ? ws.map((w) =>
            w.id === id ? { ...w, minimized: false, z: ++zRef.current } : w,
          )
        : [
            ...ws,
            {
              ...defaultWindow(id, ws.filter((w) => !w.minimized).length % 4),
              z: ++zRef.current,
            },
          ];
    });
    setLauncher(false);
  }, []);
  useEffect(() => {
    if (state.lastNotice) showToast(state.lastNotice);
  }, [state.lastNotice, showToast]);
  useEffect(() => {
    if (started) {
      try {
        saveGame(state);
        savedError.current = false;
      } catch {
        if (!savedError.current) {
          showToast("浏览器本地存储不可用，请在存档与设置中导出备份。");
          savedError.current = true;
        }
      }
    }
  }, [state, started, showToast]);
  useEffect(() => {
    if (!playing || !started || setup || state.ended) return;
    const timer = setInterval(
      () => dispatch({ type: "advance", hours: 0.25 * speed }),
      2000,
    );
    return () => clearInterval(timer);
  }, [playing, started, setup, state.ended, speed, dispatch]);
  useEffect(() => {
    if (state.ended) {
      setPlaying(false);
      if (started) open("academic");
    }
  }, [state.ended, started, open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setLauncher((v) => !v);
      }
      if (e.key === "Escape") {
        setLauncher(false);
        setNotifications(false);
        setHelp(false);
      }
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        setWindows((ws) => {
          const visible = ws
            .filter((w) => !w.minimized)
            .sort((a, b) => a.z - b.z);
          const first = visible[0];
          return first
            ? ws.map((w) =>
                w.id === first.id ? { ...w, z: ++zRef.current } : w,
              )
            : ws;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (d)
        setWindows((ws) =>
          ws.map((w) =>
            w.id === d.id
              ? {
                  ...w,
                  x: Math.max(
                    0,
                    Math.min(
                      window.innerWidth - 200,
                      d.x + e.clientX - d.startX,
                    ),
                  ),
                  y: Math.max(
                    37,
                    Math.min(
                      window.innerHeight - 150,
                      d.y + e.clientY - d.startY,
                    ),
                  ),
                }
              : w,
          ),
        );
    };
    const up = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  function onDrag(e: ReactPointerEvent<HTMLDivElement>, w: WindowState) {
    if (
      (e.target as HTMLElement).closest("button") ||
      w.maximized ||
      window.innerWidth < 760
    )
      return;
    drag.current = {
      id: w.id,
      startX: e.clientX,
      startY: e.clientY,
      x: w.x,
      y: w.y,
      target: e.currentTarget,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function start(profile: Profile) {
    const fresh = createGame(profile);
    setState(fresh);
    setStarted(true);
    setSetup(false);
    setPlaying(false);
    setWindows([defaultWindow("home", 0)]);
    showToast(`欢迎入组，${profile.name}。你的科研生活从今天开始。`);
  }
  function load(s: GameState) {
    setState(s);
    setStarted(true);
    setPlaying(false);
    setSetup(false);
  }
  const date = gameDate(state.hour),
    unread = state.messages.filter((m) => !m.read && !m.player).length,
    active = windows
      .filter((w) => !w.minimized)
      .sort((a, b) => b.z - a.z)[0]?.id;
  const props = { state, dispatch, open };
  function appContent(id: AppId): ReactNode {
    switch (id) {
      case "home":
        return <Home {...props} />;
      case "search":
        return <Literature {...props} />;
      case "library":
        return <Literature {...props} library />;
      case "ide":
        return <IDE {...props} />;
      case "terminal":
        return <TerminalApp {...props} />;
      case "gpu":
        return <GPU {...props} />;
      case "analysis":
        return <Analysis {...props} />;
      case "writer":
        return <Writer {...props} />;
      case "chat":
        return <Chat {...props} isActive={active === id && !setup} />;
      case "calendar":
        return <Calendar {...props} />;
      case "mail":
        return <Mail {...props} isActive={active === id && !setup} />;
      case "files":
        return <Files {...props} />;
      case "academic":
        return <Academic {...props} />;
      case "ai":
        return <AI {...props} />;
      case "life":
        return <Life {...props} />;
      case "settings":
        return (
          <Settings
            {...props}
            onLoad={load}
            onNew={() => {
              setSetup(true);
              setPlaying(false);
            }}
            toast={showToast}
          />
        );
    }
  }
  return (
    <div className={`desktop ${wallpaper ? "wallpaper-dusk" : ""}`}>
      <div className="wallpaper" aria-hidden="true">
        <div className="wallpaper-glow" />
        <div className="landscape landscape-back" />
        <div className="landscape landscape-mid" />
        <div className="landscape landscape-front" />
        <div className="wallpaper-grid" />
        <div className="wallpaper-lines">
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} style={{ "--line": i } as CSSProperties} />
          ))}
        </div>
      </div>
      <header className="system-bar">
        <div className="system-left">
          <button
            className="system-brand"
            onClick={() => setLauncher((v) => !v)}
          >
            <GraduationCap size={20} strokeWidth={1.6} />
            <b>GradOS</b>
            <ChevronDown size={11} />
          </button>
          <span className="system-divider" />
          <span className="active-app-name">
            {APPS.find((a) => a.id === active)?.name || "桌面"}
          </span>
          <button className="topbar-link" onClick={() => open("files")}>
            文件
          </button>
          <button className="topbar-link" onClick={() => setHelp(true)}>
            帮助
          </button>
        </div>
        <button className="system-date" onClick={() => open("calendar")}>
          {date.month}月{date.date.split("月")[1]} {date.weekday}
          <span>{date.clock}</span>
        </button>
        <div className="system-right">
          <span className="auto-saved">
            <Check size={12} />
            {started
              ? savedError.current
                ? "本地存储不可用"
                : "已自动保存"
              : "待建立档案"}
          </span>
          <button title="切换壁纸" onClick={() => setWallpaper((v) => !v)}>
            <Moon size={14} />
          </button>
          <button
            title="打开通知中心"
            className="bell-button"
            onClick={() => setNotifications((v) => !v)}
          >
            <Bell size={15} />
            {state.notices.length > 0 && <i />}
          </button>
          <span className="system-divider" />
          <Wifi size={15} />
          <Volume2 size={15} />
          <BatteryFull size={19} />
          <button
            className="system-avatar"
            title="我的培养档案"
            onClick={() => open("academic")}
          >
            {state.profile.avatar}
          </button>
        </div>
      </header>
      <div className="desktop-shortcuts">
        {(
          [
            "home",
            "chat",
            "search",
            "library",
            "ide",
            "terminal",
            "gpu",
            "writer",
          ] as AppId[]
        ).map((id) => (
          <button
            key={id}
            onClick={() => open(id)}
            className="desktop-shortcut"
          >
            <span className="shortcut-icon">
              <AppIcon id={id} size={27} />
              {id === "chat" && unread > 0 && <b>{unread}</b>}
            </span>
            <span>{APPS.find((a) => a.id === id)!.name}</span>
          </button>
        ))}
        <button className="desktop-shortcut" onClick={() => open("files")}>
          <span className="shortcut-folder">
            <FolderArt />
          </span>
          <span>研究工作空间</span>
        </button>
      </div>
      <div className="desktop-widgets">
        <div className="desktop-clock">
          <span>
            {date.weekday}，{date.month}月{date.date.split("月")[1]}
          </span>
          <b>{date.clock}</b>
          <div>
            <i />
            研一 · 第 {date.week} 周
          </div>
        </div>
        <div className="desktop-quote">
          <span>保持好奇。</span>
          <p>
            未知的，
            <br />
            值得一次认真探索。
          </p>
          <i>你的研究生生活，由你定义。</i>
        </div>
        <button className="desktop-status" onClick={() => open("life")}>
          <span>
            <Leaf size={15} />
            今日状态
            <ChevronDown size={12} />
          </span>
          <div>
            <b>
              {Math.round(state.stats.energy)}
              <small>精力</small>
            </b>
            <b>
              {Math.round(state.stats.mood)}
              <small>心情</small>
            </b>
          </div>
          <Meter value={state.stats.energy} />
          <p>
            {state.stats.energy > 40
              ? "状态不错，慢慢来。"
              : "今天辛苦了，休息一下。"}
          </p>
        </button>
      </div>
      <div className="window-layer">
        {windows.map((w) => (
          <section
            role="region"
            aria-label={APPS.find((a) => a.id === w.id)!.name}
            key={w.id}
            className={`app-window ${w.maximized ? "maximized" : ""} ${w.minimized ? "minimized" : ""} ${active === w.id ? "focused" : ""}`}
            style={{
              left: w.x,
              top: w.y,
              width: w.width,
              height: w.height,
              zIndex: w.z,
            }}
            onPointerDown={() => {
              if (active !== w.id)
                setWindows((ws) =>
                  ws.map((x) =>
                    x.id === w.id ? { ...x, z: ++zRef.current } : x,
                  ),
                );
            }}
          >
            <div
              className="window-titlebar"
              onPointerDown={(e) => onDrag(e, w)}
              onDoubleClick={() =>
                setWindows((ws) =>
                  ws.map((x) =>
                    x.id === w.id ? { ...x, maximized: !x.maximized } : x,
                  ),
                )
              }
            >
              <div className="traffic-lights">
                <button
                  className="close"
                  title={`关闭${APPS.find((a) => a.id === w.id)!.name}`}
                  onClick={() =>
                    setWindows((ws) => ws.filter((x) => x.id !== w.id))
                  }
                >
                  <X size={9} />
                </button>
                <button
                  className="minimize"
                  title="最小化窗口"
                  onClick={() =>
                    setWindows((ws) =>
                      ws.map((x) =>
                        x.id === w.id ? { ...x, minimized: true } : x,
                      ),
                    )
                  }
                >
                  <Minimize2 size={8} />
                </button>
                <button
                  className="maximize"
                  title="最大化窗口"
                  onClick={() =>
                    setWindows((ws) =>
                      ws.map((x) =>
                        x.id === w.id ? { ...x, maximized: !x.maximized } : x,
                      ),
                    )
                  }
                >
                  <Maximize2 size={8} />
                </button>
              </div>
              <div className="window-title">
                <AppIcon id={w.id} bare size={14} />
                <b>{APPS.find((a) => a.id === w.id)!.name}</b>
                <span>— {APPS.find((a) => a.id === w.id)!.subtitle}</span>
              </div>
              <span className="window-brand">GradOS</span>
            </div>
            <div className="window-content">{appContent(w.id)}</div>
            <div className="window-statusbar">
              <span>
                <i className="online-dot" />
                {MENTORS[state.profile.mentor].lab}
              </span>
              <span>
                {date.weekday} {date.clock} · 第 {date.day} 天
              </span>
            </div>
          </section>
        ))}
      </div>
      <div className="desktop-bottom-label">
        <span>研究生桌面模拟器</span>
        <small>GRADUATE DESKTOP SIMULATOR</small>
      </div>
      <div className="time-controller">
        <span className={`time-indicator ${playing ? "playing" : ""}`} />
        <span>
          第 <b>{date.day}</b> / 28 天
        </span>
        <span className="time-divider" />
        <button
          title={playing ? "暂停时间" : "自动推进时间"}
          onClick={() => setPlaying((v) => !v)}
          disabled={state.ended}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <select
          aria-label="时间推进速度"
          value={speed}
          onChange={(e) => setSpeed(+e.target.value)}
        >
          <option value={1}>1×</option>
          <option value={4}>4×</option>
          <option value={12}>12×</option>
        </select>
        <button
          title="推进一小时"
          disabled={state.ended}
          onClick={() => dispatch({ type: "advance", hours: 1 })}
        >
          <FastForward size={15} />
        </button>
        <span className="time-divider" />
        <button
          title="睡觉八小时，恢复精力"
          disabled={state.ended}
          onClick={() => dispatch({ type: "life", kind: "sleep" })}
        >
          <Moon size={14} />
        </button>
        <span className="time-state">
          {state.ended
            ? "周期完成"
            : playing
              ? "时间流动中"
              : "自由安排 · 已暂停"}
        </span>
      </div>
      <nav className="dock" aria-label="应用程序坞">
        <button
          className={`dock-button launcher-button ${launcher ? "active" : ""}`}
          title="全部应用（⌘K）"
          onClick={() => setLauncher((v) => !v)}
        >
          <span className="dock-launcher">
            <Grid2X2 size={23} />
          </span>
          <span className="dock-tooltip">全部应用</span>
        </button>
        <span className="dock-divider" />
        {(
          [
            "home",
            "chat",
            "search",
            "library",
            "ide",
            "terminal",
            "gpu",
            "analysis",
            "writer",
            "calendar",
            "mail",
            "files",
            "ai",
          ] as AppId[]
        ).map((id) => (
          <button
            className={`dock-button ${active === id ? "active" : ""}`}
            title={APPS.find((a) => a.id === id)!.name}
            key={id}
            onClick={() => {
              const win = windows.find((w) => w.id === id);
              if (win && active === id && !win.minimized)
                setWindows((ws) =>
                  ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
                );
              else open(id);
            }}
          >
            <AppIcon id={id} size={23} />
            {id === "chat" && unread > 0 && (
              <b className="dock-badge">{unread}</b>
            )}
            {id === "mail" && state.mails.some((m) => !m.read) && (
              <b className="dock-badge">
                {state.mails.filter((m) => !m.read).length}
              </b>
            )}
            <span className="dock-tooltip">
              {APPS.find((a) => a.id === id)!.name}
            </span>
            {windows.some((w) => w.id === id) && <i className="dock-running" />}
          </button>
        ))}
        <span className="dock-divider" />
        <button
          className="dock-button"
          title="校园生活"
          onClick={() => open("life")}
        >
          <AppIcon id="life" size={23} />
          <span className="dock-tooltip">校园生活</span>
        </button>
        <button
          className="dock-button"
          title="存档与设置"
          onClick={() => open("settings")}
        >
          <AppIcon id="settings" size={23} />
          <span className="dock-tooltip">存档与设置</span>
        </button>
      </nav>
      {launcher && (
        <div className="launcher-shade" onClick={() => setLauncher(false)}>
          <div className="app-launcher" onClick={(e) => e.stopPropagation()}>
            <div className="launcher-search">
              <Search size={19} />
              <input
                aria-label="搜索应用"
                placeholder="搜索你的科研工具…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <kbd>ESC</kbd>
            </div>
            <span className="eyebrow">你的科研工具箱</span>
            <div>
              {APPS.filter((a) => `${a.name}${a.subtitle}`.includes(query)).map(
                (a) => (
                  <button key={a.id} onClick={() => open(a.id)}>
                    <AppIcon id={a.id} size={29} />
                    <b>{a.name}</b>
                    <small>{a.subtitle}</small>
                  </button>
                ),
              )}
            </div>
            <footer>
              <Command size={12} />K 快速启动<span>Alt + Tab 切换窗口</span>
            </footer>
          </div>
        </div>
      )}
      {notifications && (
        <aside className="notification-center">
          <div>
            <h3>通知中心</h3>
            <button
              className="icon-button"
              onClick={() => setNotifications(false)}
            >
              <X size={17} />
            </button>
          </div>
          <span className="eyebrow">
            {date.month}月{date.date.split("月")[1]}，{date.weekday}
          </span>
          {state.notices.length ? (
            state.notices.map((n) => (
              <article key={n.id}>
                <AppIcon id={n.app} size={17} />
                <button
                  onClick={() => {
                    open(n.app);
                    dispatch({ type: "dismiss", id: n.id });
                    setNotifications(false);
                  }}
                >
                  <b>
                    {n.title}
                    <small>
                      第{gameDate(n.hour).day}天 {gameDate(n.hour).clock}
                    </small>
                  </b>
                  <p>{n.text}</p>
                </button>
                <button
                  className="notice-close"
                  title="清除此通知"
                  onClick={() => dispatch({ type: "dismiss", id: n.id })}
                >
                  <X size={12} />
                </button>
              </article>
            ))
          ) : (
            <p className="no-notifications">暂时没有新通知，享受片刻安静。</p>
          )}
        </aside>
      )}
      {toast && started && !setup && (
        <div role="status" className="toast">
          <span>
            <Check size={15} />
          </span>
          <p>{toast}</p>
          <button title="关闭提示" onClick={() => setToast("")}>
            <X size={13} />
          </button>
        </div>
      )}
      {help && (
        <div className="help-shade" onClick={() => setHelp(false)}>
          <div className="help-card" onClick={(e) => e.stopPropagation()}>
            <span className="help-logo">
              <GraduationCap size={27} />
            </span>
            <button
              className="help-close icon-button"
              title="关闭帮助"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
            <Pill>桌面使用指南</Pill>
            <h2>你的桌面，你的节奏。</h2>
            <p>
              时间默认暂停。阅读、编程、交流等操作会推进时间；底部播放键也能让时间自动流动。
            </p>
            <div>
              <span>01</span>
              <p>
                <b>窗口随你切换</b>
                点击程序坞打开软件，拖动标题栏移动，双击最大化。黄色按钮最小化。
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <b>训练在后台继续</b>任务提交到 GPU
                队列后，可以写论文、回消息或睡一觉。不同服务器可同时运行。
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <b>失败也提供线索</b>
                在数据分析中查看曲线与诊断。先匹配基线，再做复现和泛化实验。
              </p>
            </div>
            <div>
              <span>04</span>
              <p>
                <b>记得休息，也记得保存</b>月亮按钮睡眠 8
                小时。进度自动存于本浏览器，也可手动保存与导出。
              </p>
            </div>
            <Button
              onClick={() => {
                setHelp(false);
                open("search");
              }}
            >
              从一篇文献开始
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
      {setup && (
        <Onboarding
          onStart={start}
          onClose={started ? () => setSetup(false) : undefined}
        />
      )}
      <button
        className="desktop-help"
        title="使用帮助"
        onClick={() => setHelp(true)}
      >
        <CircleHelp size={19} />
      </button>
      <span className="desktop-version">GradOS 1.0 · 本地科研模式</span>
      <div className="mobile-home-button">
        <button onClick={() => setLauncher(true)}>
          <Grid2X2 size={20} />
        </button>
        <button onClick={() => open("home")}>
          <GraduationCap size={21} />
        </button>
        <button onClick={() => dispatch({ type: "life", kind: "sleep" })}>
          <Moon size={19} />
        </button>
        <span>
          {date.clock} · 第{date.day}天
        </span>
      </div>
      <span className="sr-only">本期总时长 {END_HOUR} 小时</span>
    </div>
  );
}
function FolderArt() {
  return (
    <svg width="51" height="45" viewBox="0 0 58 50">
      <path
        d="M4 10a5 5 0 0 1 5-5h12l6 6h22a5 5 0 0 1 5 5v25a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"
        fill="#d7ae66"
      />
      <path
        d="M4 18a5 5 0 0 1 5-5h40a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"
        fill="#f3cd85"
      />
      <path d="M5 19h48" stroke="#ffe6b3" />
    </svg>
  );
}
