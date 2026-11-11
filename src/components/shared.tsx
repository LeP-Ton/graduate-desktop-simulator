import { avatarUrl, iconUrl } from "../period";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookMarked,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Coffee,
  Cpu,
  FilePenLine,
  Files,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Monitor,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { Action, AppId, GameState } from "../game/types";
export interface AppProps {
  state: GameState;
  dispatch: (action: Action) => void;
  open: (app: AppId) => void;
  isActive?: boolean;
}
export const APPS: {
  id: AppId;
  name: string;
  subtitle: string;
  icon: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  color: string;
}[] = [
  {
    id: "home",
    name: "研究工作台",
    subtitle: "你的科研，从这里开始",
    icon: LayoutDashboard,
    color: "teal",
  },
  {
    id: "chat",
    name: "QQ 2012 · 课题组",
    subtitle: "保持联系，共同探索",
    icon: MessageCircle,
    color: "green",
  },
  {
    id: "search",
    name: "学术搜索 · IE9",
    subtitle: "每个好问题，都有来处",
    icon: Search,
    color: "blue",
  },
  {
    id: "library",
    name: "文献管理 · Zotero 3",
    subtitle: "整理知识，连接想法",
    icon: BookMarked,
    color: "orange",
  },
  {
    id: "ide",
    name: "Vim 7.3 代码编辑器",
    subtitle: "把假设写成代码",
    icon: Code2,
    color: "sky",
  },
  {
    id: "terminal",
    name: "PuTTY 实验终端",
    subtitle: "让数据回答问题",
    icon: Terminal,
    color: "dark",
  },
  {
    id: "gpu",
    name: "服务器管理器",
    subtitle: "让每一份算力都有价值",
    icon: Cpu,
    color: "purple",
  },
  {
    id: "analysis",
    name: "数据分析",
    subtitle: "在结果中寻找因果",
    icon: BarChart3,
    color: "blue",
  },
  {
    id: "writer",
    name: "Word 2010 论文编辑器",
    subtitle: "让你的发现被看见",
    icon: FilePenLine,
    color: "indigo",
  },
  {
    id: "calendar",
    name: "研究日历",
    subtitle: "给重要的事情留出时间",
    icon: CalendarDays,
    color: "coral",
  },
  {
    id: "mail",
    name: "校园邮箱 · Outlook 2010",
    subtitle: "消息，也可能是机会",
    icon: Mail,
    color: "blue",
  },
  {
    id: "files",
    name: "文件管理",
    subtitle: "每一次探索都有记录",
    icon: Files,
    color: "sand",
  },
  {
    id: "academic",
    name: "培养系统",
    subtitle: "定义自己的成长",
    icon: GraduationCap,
    color: "teal",
  },
  {
    id: "ai",
    name: "科研工具箱",
    subtitle: "一起思考，独立判断",
    icon: Sparkles,
    color: "purple",
  },
  {
    id: "life",
    name: "校园生活",
    subtitle: "科研之外，也有生活",
    icon: Coffee,
    color: "orange",
  },
  {
    id: "settings",
    name: "控制面板",
    subtitle: "保存这段旅程",
    icon: Settings2,
    color: "slate",
  },
];
export function AppIcon({
  id,
  size = 23,
  bare = false,
}: {
  id: AppId;
  size?: number;
  bare?: boolean;
}) {
  return (
    <span className={bare ? "bare-icon period-icon" : "app-icon period-icon"}>
      <img
        src={iconUrl(id, size)}
        width={size}
        height={size}
        alt=""
        draggable={false}
      />
    </span>
  );
}

export function Button({
  children,
  onClick,
  secondary = false,
  small = false,
  disabled = false,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  small?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      className={`button ${secondary ? "secondary" : ""} ${small ? "small" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function Pill({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
export function Meter({
  value,
  color,
  label,
}: {
  value: number;
  color?: string;
  label?: string;
}) {
  return (
    <div className="meter-wrap">
      {label && (
        <div className="meter-label">
          <span>{label}</span>
          <b>
            {Math.round(value)}
            <small>/100</small>
          </b>
        </div>
      )}
      <div className="meter">
        <i
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
export function Empty({
  icon: Icon = FlaskConical,
  title,
  text,
  action,
}: {
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-symbol">
        <Icon size={30} strokeWidth={1.2} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function PageHead({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}
export function Hint({ children }: { children: ReactNode }) {
  return (
    <div className="hint">
      <CircleHelp size={16} />
      <span>{children}</span>
    </div>
  );
}
export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h3>{children}</h3>
      {right}
    </div>
  );
}
export { Activity, ArrowRight, Bell, Check, ChevronRight, Monitor, X };

export function PeriodAvatar({ value }: { value: string }) {
  return (
    <img
      className="period-avatar"
      src={avatarUrl(value)}
      alt=""
      draggable={false}
    />
  );
}
