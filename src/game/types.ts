export type Direction = "ml" | "agent" | "systems";
export type Mentor = "rigorous" | "free" | "resource";
export type AppId =
  | "home"
  | "chat"
  | "search"
  | "library"
  | "ide"
  | "terminal"
  | "gpu"
  | "analysis"
  | "writer"
  | "calendar"
  | "mail"
  | "files"
  | "academic"
  | "ai"
  | "life"
  | "settings";
export interface Profile {
  name: string;
  gender: string;
  avatar: string;
  direction: Direction;
  mentor: Mentor;
  abilities: { coding: number; insight: number; writing: number };
}
export interface Stats {
  energy: number;
  stress: number;
  mood: number;
  health: number;
  money: number;
  compute: number;
  skill: number;
  engineering: number;
  trust: number;
  reputation: number;
  social: number;
}
export interface Literature {
  id: string;
  title: string;
  authors: string;
  year: number;
  field: Direction;
  abstract: string;
  method: string;
  result: string;
  limitation: string;
  insight: string;
  citations: number;
  related: string[];
  tag: string;
}
export interface Topic {
  id: string;
  direction: Direction;
  title: string;
  question: string;
  hypothesis: string;
  method: string;
  risk: number;
  novelty: number;
  cost: number;
  difficulty: number;
  competition: number;
  cycle: string;
  kind: string;
  sources: string[];
}
export interface ExperimentConfig {
  name: string;
  model: "compact" | "balanced" | "large";
  dataset: "raw" | "clean" | "shift";
  method: "baseline" | "adaptive" | "verified";
  learningRate: number;
  epochs: number;
  batch: number;
  server: "rtx" | "a100";
  seed: number;
}
export interface ExperimentResult {
  score: number;
  baseline: number;
  generalization: number;
  reproducibility: number;
  cost: number;
  trainLoss: number[];
  valLoss: number[];
  diagnosis: string[];
  evidence: string[];
  novelty: number;
}
export interface TrainingTask {
  id: string;
  topicId: string;
  config: ExperimentConfig;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  progress: number;
  duration: number;
  spent: number;
  submittedAt: number;
  startedAt?: number;
  finishedAt?: number;
  priority: number;
  codeQuality: number;
  aiRisk: boolean;
  result?: ExperimentResult;
  logs: string[];
}
export interface Message {
  id: string;
  from: string;
  text: string;
  hour: number;
  read: boolean;
  player?: boolean;
}
export interface NpcState {
  id: string;
  relationship: number;
  progress: number;
  status: string;
  task: string;
}
export interface CalendarEvent {
  id: string;
  title: string;
  start: number;
  duration: number;
  type: "meeting" | "course" | "deadline" | "interview" | "task";
  done: boolean;
  missed: boolean;
}
export interface Mail {
  id: string;
  from: string;
  subject: string;
  text: string;
  hour: number;
  read: boolean;
  kind: "school" | "review" | "career" | "conference";
}
export type Section =
  | "title"
  | "abstract"
  | "intro"
  | "related"
  | "method"
  | "experiments"
  | "conclusion";
export interface Manuscript {
  sections: Record<Section, string>;
  effort: Record<Section, number>;
  references: string[];
  figures: string[];
  response: string;
}
export interface Submission {
  id: string;
  venue: string;
  status: "review" | "reject" | "major" | "minor" | "accept";
  round: number;
  dueAt: number;
  submittedAt: number;
  score: number;
  feedback: string[];
  responded: boolean;
  decision: {
    status: "reject" | "major" | "minor" | "accept";
    score: number;
    feedback: string[];
  };
}
export interface AIIssue {
  id: string;
  kind: "code" | "citation" | "claim";
  text: string;
  resolved: boolean;
}
export interface Notice {
  id: string;
  title: string;
  text: string;
  app: AppId;
  hour: number;
}
export interface GameState {
  version: 1;
  era?: 2012;
  profile: Profile;
  hour: number;
  rng: number;
  stats: Stats;
  topicId: string | null;
  read: string[];
  saved: string[];
  codeQuality: number;
  tasks: TrainingTask[];
  analyzed: string[];
  manuscript: Manuscript;
  submissions: Submission[];
  messages: Message[];
  npcs: NpcState[];
  calendar: CalendarEvent[];
  mails: Mail[];
  aiIssues: AIIssue[];
  flags: string[];
  notices: Notice[];
  history: { hour: number; text: string }[];
  ended: boolean;
  lastNotice: string;
}
export type Action =
  | { type: "advance"; hours: number; rest?: boolean }
  | { type: "read"; id: string }
  | { type: "savePaper"; id: string }
  | { type: "cite"; id: string }
  | { type: "topic"; id: string }
  | { type: "code"; mode: "write" | "test" | "ai" }
  | { type: "experiment"; config: ExperimentConfig }
  | { type: "cancel"; id: string }
  | { type: "priority"; id: string }
  | { type: "analyze"; id: string }
  | { type: "figure"; id: string }
  | { type: "editSection"; section: Section; text: string }
  | { type: "writeSection"; section: Section }
  | { type: "submit"; venue: string }
  | { type: "respond"; text: string }
  | {
      type: "reply";
      npc: string;
      choice: "progress" | "help" | "collaborate" | "resource" | "calendar";
      text?: string;
    }
  | { type: "readMessages"; npc: string }
  | { type: "readMail"; id: string }
  | { type: "attend"; id: string }
  | { type: "addEvent"; title: string; start: number }
  | {
      type: "life";
      kind:
        | "sleep"
        | "exercise"
        | "meal"
        | "social"
        | "intern"
        | "ta"
        | "leisure";
    }
  | { type: "ai"; kind: "summary" | "idea" | "analysis" | "polish" }
  | { type: "verifyAI"; id: string }
  | { type: "dismiss"; id: string };
