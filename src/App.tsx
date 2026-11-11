import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import {
  ArrowRight,
  Bell,
  Check,
  CircleHelp,
  FastForward,
  Maximize2,
  Minus,
  Pause,
  Play,
  Search,
  Wifi,
  X,
} from "lucide-react";
import { assetUrl, avatarUrl, GAME_TITLE } from "./period";
import { Home } from "./components/Home";
import { Literature } from "./components/Literature";
import { Analysis, GPU, IDE, TerminalApp } from "./components/Research";
import { Writer } from "./components/Writer";
import { Calendar, Chat, Mail } from "./components/Social";
import { Academic, AI, Files, Life, Settings } from "./components/OtherApps";
import { DEFAULT_PROFILE, Onboarding } from "./components/Onboarding";
import { APPS, AppIcon, Button } from "./components/shared";
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
    y: 55 + index * 22,
    width: Math.min(id === "chat" ? 860 : 1060, w - 190),
    height: Math.min(690, h - 95),
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
      defaultWindow("chat", 0),
    ]),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [launcher, setLauncher] = useState(false),
    [notifications, setNotifications] = useState(false),
    [query, setQuery] = useState(""),
    [toast, setToast] = useState(""),
    [help, setHelp] = useState(false),
    [wallpaper, setWallpaper] = useState(false),
    [context, setContext] = useState<{ x: number; y: number } | null>(null);
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
    setQuery("");
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
        setQuery("");
        setNotifications(false);
        setHelp(false);
        setContext(null);
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
                    0,
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
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
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
    setWindows([defaultWindow("chat", 0)]);
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
  const pinned: AppId[] = ["files", "search", "chat", "writer", "terminal"];
  const taskApps = [
    ...pinned,
    ...windows.map((w) => w.id).filter((id) => !pinned.includes(id)),
  ];
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
    <div
      className={`desktop windows-seven ${wallpaper ? "wallpaper-dusk" : ""}`}
      onContextMenu={(e) => {
        if (
          (e.target as HTMLElement).closest(
            ".app-window,.win-taskbar,.setup2012-overlay,.start-menu",
          )
        )
          return;
        e.preventDefault();
        setContext({
          x: Math.min(e.clientX, window.innerWidth - 210),
          y: Math.min(e.clientY, window.innerHeight - 200),
        });
      }}
    >
      <div
        className="wallpaper"
        style={{ backgroundImage: `url("${assetUrl("win7-harmony.jpg")}")` }}
        onClick={() => {
          setContext(null);
          setLauncher(false);
          setQuery("");
        }}
      />
      <nav className="desktop-shortcuts" aria-label="桌面快捷方式">
        {(
          [
            "files",
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
            "academic",
            "ai",
            "settings",
          ] as AppId[]
        ).map((id) => (
          <button
            key={id}
            onClick={() => open(id)}
            className="desktop-shortcut"
            title={APPS.find((a) => a.id === id)!.name}
          >
            <span className="shortcut-icon">
              <AppIcon id={id} size={48} />
              <img
                className="shortcut-overlay"
                src={assetUrl("icons/shortcut-16.png")}
                alt=""
              />
              {id === "chat" && unread > 0 && <b>{unread}</b>}
            </span>
            <span>{APPS.find((a) => a.id === id)!.name.split(" · ")[0]}</span>
          </button>
        ))}
      </nav>
      <aside className="win-sticky-note" aria-label="科研生活便笺">
        <header>
          <span>＋</span>
          <b>2012，科研新起点。</b>
          <button title="打开研究工作台" onClick={() => open("home")}>
            ↗
          </button>
        </header>
        <p>
          {state.profile.name}，欢迎回到实验室。
          <br />
          研一 · 第 {date.week} 周 · 第 {date.day} 天
        </p>
        <dl>
          <dt>精力</dt>
          <dd>{Math.round(state.stats.energy)} / 100</dd>
          <dt>机时额度</dt>
          <dd>{state.stats.compute.toFixed(1)} h</dd>
          <dt>生活费</dt>
          <dd>¥{Math.round(state.stats.money)}</dd>
        </dl>
        <footer>
          <button onClick={() => open("calendar")}>查看日程</button>
          <button
            onClick={() => dispatch({ type: "life", kind: "sleep" })}
            disabled={state.ended}
          >
            休息 8 小时
          </button>
        </footer>
      </aside>
      <aside className="win-clock-gadget">
        <div className="analog-clock">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ transform: `rotate(${i * 30}deg)` }} />
          ))}
          <span
            className="hour-hand"
            style={{ transform: `rotate(${(state.hour % 12) * 30}deg)` }}
          />
          <span
            className="minute-hand"
            style={{ transform: `rotate(${(state.hour % 1) * 360}deg)` }}
          />
          <b />
        </div>
        <span>
          {date.clock}　{date.weekday}
        </span>
      </aside>
      <div className="window-layer">
        {windows.map((w) => (
          <section
            role="region"
            aria-label={APPS.find((a) => a.id === w.id)!.name}
            key={w.id}
            data-app={w.id}
            className={`app-window ${w.maximized ? "maximized" : ""} ${w.minimized ? "minimized" : ""} ${active === w.id ? "focused" : ""}`}
            style={
              {
                left: w.x,
                top: w.y,
                width: w.width,
                height: w.height,
                zIndex: w.z,
                "--win-x": `${w.x}px`,
                "--win-y": `${w.y}px`,
                "--win-width": `${w.width}px`,
                "--win-height": `${w.height}px`,
              } as CSSProperties
            }
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
              <AppIcon id={w.id} bare size={16} />
              <div className="window-title">
                <b>{APPS.find((a) => a.id === w.id)!.name}</b>
              </div>
              <div className="window-controls">
                <button
                  title="最小化窗口"
                  onClick={() =>
                    setWindows((ws) =>
                      ws.map((x) =>
                        x.id === w.id ? { ...x, minimized: true } : x,
                      ),
                    )
                  }
                >
                  <Minus size={13} />
                </button>
                <button
                  title="最大化窗口"
                  onClick={() =>
                    setWindows((ws) =>
                      ws.map((x) =>
                        x.id === w.id ? { ...x, maximized: !x.maximized } : x,
                      ),
                    )
                  }
                >
                  <Maximize2 size={11} />
                </button>
                <button
                  className="window-close"
                  title={`关闭${APPS.find((a) => a.id === w.id)!.name}`}
                  onClick={() =>
                    setWindows((ws) => ws.filter((x) => x.id !== w.id))
                  }
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="window-content">{appContent(w.id)}</div>
            <div className="window-statusbar">
              <span>{MENTORS[state.profile.mentor].lab}</span>
              <span>
                {date.weekday} {date.clock} · 第 {date.day} 天
              </span>
            </div>
            {!w.maximized && (
              <div
                className="resize-grip"
                role="separator"
                aria-label="调整窗口大小"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const node = e.currentTarget,
                    sx = e.clientX,
                    sy = e.clientY;
                  node.setPointerCapture(e.pointerId);
                  const move = (event: PointerEvent) =>
                    setWindows((ws) =>
                      ws.map((x) =>
                        x.id === w.id
                          ? {
                              ...x,
                              width: Math.max(
                                610,
                                Math.min(
                                  window.innerWidth - w.x,
                                  w.width + event.clientX - sx,
                                ),
                              ),
                              height: Math.max(
                                350,
                                Math.min(
                                  window.innerHeight - w.y - 44,
                                  w.height + event.clientY - sy,
                                ),
                              ),
                            }
                          : x,
                      ),
                    );
                  const end = () => {
                    node.removeEventListener("pointermove", move);
                    node.removeEventListener("pointerup", end);
                    node.removeEventListener("pointercancel", end);
                  };
                  node.addEventListener("pointermove", move);
                  node.addEventListener("pointerup", end);
                  node.addEventListener("pointercancel", end);
                }}
              />
            )}
          </section>
        ))}
      </div>
      <div className="win-watermark">
        {GAME_TITLE}
        <small>计算机学院 · 四周科研生活</small>
      </div>
      <footer className="win-taskbar">
        <button
          className={`start-orb ${launcher ? "start-open" : ""}`}
          style={{
            backgroundImage: `url("${assetUrl("icons/start-orb.png")}")`,
          }}
          aria-label="打开开始菜单"
          title="开始"
          onClick={() => {
            setQuery("");
            setLauncher((v) => !v);
          }}
        />
        <nav className="taskbar-apps" aria-label="任务栏应用">
          {taskApps.map((id) => (
            <button
              key={id}
              data-app={id}
              className={`taskbar-app ${windows.some((w) => w.id === id) ? "running" : ""} ${active === id ? "active" : ""}`}
              title={APPS.find((a) => a.id === id)!.name}
              onClick={() => {
                const w = windows.find((w) => w.id === id);
                if (w && active === id && !w.minimized)
                  setWindows((ws) =>
                    ws.map((w) =>
                      w.id === id ? { ...w, minimized: true } : w,
                    ),
                  );
                else open(id);
              }}
            >
              <AppIcon id={id} size={32} />
              {id === "chat" && unread > 0 && (
                <b className="task-unread">{unread}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="time-controller">
          <span className={`time-indicator ${playing ? "playing" : ""}`} />
          <span>
            第 <b>{date.day}</b> / 28 天
          </span>
          <button
            title={playing ? "暂停时间" : "自动推进时间"}
            onClick={() => setPlaying((v) => !v)}
            disabled={state.ended}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
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
            onClick={() => dispatch({ type: "advance", hours: 1 })}
            disabled={state.ended}
          >
            <FastForward size={14} />
          </button>
        </div>
        <div className="system-tray">
          <button
            title="打开通知中心"
            onClick={() => setNotifications((v) => !v)}
          >
            <Bell size={15} />
            {state.notices.length > 0 && <i />}
          </button>
          <button
            title="中文输入法"
            onClick={() => showToast("中文（简体）— 微软拼音输入法")}
          >
            CH
          </button>
          <button
            title="校园网连接"
            onClick={() =>
              showToast("本地连接：校园网；本游戏不连接真实校园账号。")
            }
          >
            <Wifi size={16} />
          </button>
          <button title="使用帮助" onClick={() => setHelp(true)}>
            <CircleHelp size={15} />
          </button>
          <button className="taskbar-clock" onClick={() => open("calendar")}>
            <b>{date.clock}</b>
            <span>
              2012/{date.month}/{date.date.split("月")[1].replace("日", "")}
            </span>
          </button>
        </div>
        <button
          className="show-desktop"
          aria-label="显示桌面"
          title="显示桌面"
          onClick={() =>
            setWindows((ws) =>
              ws.map((w) => ({
                ...w,
                minimized: ws.some((x) => !x.minimized),
              })),
            )
          }
        />
      </footer>
      {launcher && (
        <>
          <div className="menu-dismiss" onClick={() => setLauncher(false)} />
          <section className="start-menu" aria-label="开始菜单">
            <div className="start-apps">
              <div className="start-program-list">
                {APPS.filter((a) =>
                  `${a.name}${a.subtitle}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                ).map((a) => (
                  <button key={a.id} data-app={a.id} onClick={() => open(a.id)}>
                    <AppIcon id={a.id} size={32} />
                    <span>
                      {a.name}
                      <small>{a.subtitle}</small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="start-all-programs">所有程序　▶</div>
              <div className="start-search">
                <input
                  aria-label="搜索程序和文件"
                  placeholder="搜索程序和文件"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <Search size={15} />
              </div>
            </div>
            <div className="start-right">
              <div className="start-user-avatar">
                <img
                  className="period-avatar"
                  src={avatarUrl(state.profile.avatar)}
                  alt=""
                />
              </div>
              <b>{state.profile.name}</b>
              {(
                [
                  { id: "files", name: "文档" },
                  { id: "library", name: "研究资料" },
                  { id: "home", name: "研究工作台" },
                  { id: "academic", name: "计算机学院" },
                  { id: "calendar", name: "日程与课程" },
                  { id: "settings", name: "控制面板" },
                ] as { id: AppId; name: string }[]
              ).map((a) => (
                <button key={a.id} data-app={a.id} onClick={() => open(a.id)}>
                  {a.name}
                </button>
              ))}
              <hr />
              <button
                onClick={() => {
                  setLauncher(false);
                  setQuery("");
                  setHelp(true);
                }}
              >
                帮助和支持
              </button>
              <button
                onClick={() => {
                  setLauncher(false);
                  setQuery("");
                  setPlaying(false);
                  setSetup(true);
                }}
              >
                新建研究生档案
              </button>
              <div className="start-shutdown">
                <button
                  disabled={state.ended}
                  onClick={() => {
                    setLauncher(false);
                    setQuery("");
                    dispatch({ type: "life", kind: "sleep" });
                  }}
                >
                  休眠 8 小时
                </button>
                <button
                  title="保存游戏进度"
                  onClick={() => {
                    try {
                      saveGame(state, true);
                      showToast("游戏进度已保存。");
                    } catch {
                      showToast("保存失败，请到控制面板导出备份。");
                    }
                    setLauncher(false);
                    setQuery("");
                  }}
                >
                  ▶
                </button>
              </div>
            </div>
          </section>
        </>
      )}
      {context && (
        <>
          <div className="context-dismiss" onClick={() => setContext(null)} />
          <div
            className="win-context-menu"
            style={{ left: context.x, top: context.y }}
          >
            <button
              onClick={() => {
                setWindows((ws) => ws.map((w) => ({ ...w, minimized: true })));
                setContext(null);
              }}
            >
              显示桌面
            </button>
            <button
              onClick={() => {
                showToast("桌面已刷新，游戏进度已保留。");
                setContext(null);
              }}
            >
              刷新
            </button>
            <hr />
            <button
              onClick={() => {
                open("files");
                setContext(null);
              }}
            >
              打开计算机
            </button>
            <button
              onClick={() => {
                setWallpaper((v) => !v);
                setContext(null);
              }}
            >
              切换桌面配色
            </button>
          </div>
        </>
      )}
      {notifications && (
        <aside className="notification-center">
          <div>
            <h3>系统通知</h3>
            <button
              className="icon-button"
              onClick={() => setNotifications(false)}
            >
              <X size={17} />
            </button>
          </div>
          {state.notices.length ? (
            state.notices.map((n) => (
              <article key={n.id}>
                <AppIcon id={n.app} size={20} />
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
                      第 {gameDate(n.hour).day} 天 {gameDate(n.hour).clock}
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
            <p>暂时没有新通知。</p>
          )}
        </aside>
      )}
      {toast && started && !setup && (
        <div role="status" className="toast">
          <Check size={16} />
          <p>{toast}</p>
          <button title="关闭提示" onClick={() => setToast("")}>
            <X size={13} />
          </button>
        </div>
      )}
      {help && (
        <div className="help-shade" onClick={() => setHelp(false)}>
          <div className="help-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="help-close icon-button"
              title="关闭帮助"
              onClick={() => setHelp(false)}
            >
              <X size={18} />
            </button>
            <h2>{GAME_TITLE}</h2>
            <p>
              从一台 Windows 7
              电脑开始你的科研生活。时间默认暂停，阅读、实验与交流会消耗游戏时间。
            </p>
            <div>
              <span>01</span>
              <p>
                <b>操作桌面</b>
                从开始菜单或快捷方式打开程序；任务栏切换窗口；拖动标题栏移动，右下角调整大小，双击标题栏最大化。
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <b>开展科研</b>
                检索和精读论文，确定课题，编写与测试实验代码。训练和数据处理在后台运行，期间可切换软件或休息。
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <b>验证证据</b>
                检查基线、随机种子和测试集。第三方代码与导入文献需要核验，科研工具不会替你证明结论。
              </p>
            </div>
            <div>
              <span>04</span>
              <p>
                <b>保存进度</b>
                进度自动保存在本机；控制面板可保存快照、导入或导出存档。休眠推进
                8 小时，后台实验会继续。
              </p>
            </div>
            <Button
              onClick={() => {
                setHelp(false);
                open("search");
              }}
            >
              开始检索文献
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
      <span className="sr-only">本期总时长 {END_HOUR} 小时</span>
    </div>
  );
}
