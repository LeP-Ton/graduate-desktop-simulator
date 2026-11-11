import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Code2,
  Feather,
  FlaskConical,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { DIRECTIONS, MENTORS } from "../game/data";
import type { Direction, Mentor, Profile } from "../game/types";
import { Button } from "./shared";
export const DEFAULT_PROFILE: Profile = {
  name: "林知夏",
  gender: "不透露",
  avatar: "🌱",
  direction: "agent",
  mentor: "rigorous",
  abilities: { coding: 4, insight: 5, writing: 3 },
};
export function Onboarding({
  onStart,
  onClose,
}: {
  onStart: (p: Profile) => void;
  onClose?: () => void;
}) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE),
    [step, setStep] = useState(0);
  const total = Object.values(profile.abilities).reduce((a, b) => a + b, 0);
  return (
    <div className="onboarding-shade">
      <div className="onboarding" role="dialog" aria-label="新建研究生档案">
        <div className="onboarding-story">
          <div className="onboarding-brand">
            <GraduationCap size={26} />
            <b>
              GradOS<span>研究生桌面模拟器</span>
            </b>
          </div>
          <div className="story-orbit">
            <div />
            <span>✳</span>
            <i />
            <em />
          </div>
          <span className="eyebrow">新的篇章</span>
          <h1>
            从一个问题开始，
            <br />
            探索你的
            <br />
            <i>无限可能。</i>
          </h1>
          <p>
            一次实验，一次发现。
            <br />
            在这张桌面上，写下属于你的研究生故事。
          </p>
          <div className="story-foot">
            <span>计算机与人工智能学院</span>
            <span>2026 · 秋</span>
          </div>
        </div>
        <div className="onboarding-form">
          <div className="setup-top">
            <span>
              入学登记 <b>0{step + 1} / 03</b>
            </span>
            {onClose && (
              <button className="text-button" onClick={onClose}>
                返回桌面
              </button>
            )}
          </div>
          <div className="setup-progress">
            {[0, 1, 2].map((i) => (
              <i key={i} className={i <= step ? "active" : ""} />
            ))}
          </div>
          {step === 0 ? (
            <>
              <span className="eyebrow">你好，新同学</span>
              <h2>先认识一下你。</h2>
              <p>这里没有预设的人生目标，你可以慢慢找到自己的答案。</p>
              <label className="field">
                <span>你的名字</span>
                <input
                  value={profile.name}
                  maxLength={12}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  placeholder="怎么称呼你？"
                  autoFocus
                />
              </label>
              <div className="field">
                <span>选择头像</span>
                <div className="avatar-options">
                  {["🌱", "🧑‍💻", "👩‍🚀", "🐈", "🦊", "🌻"].map((avatar) => (
                    <button
                      aria-label={`头像${avatar}`}
                      className={profile.avatar === avatar ? "selected" : ""}
                      key={avatar}
                      onClick={() => setProfile({ ...profile, avatar })}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                <span>
                  性别 <small>不影响科研能力与机会</small>
                </span>
                <select
                  value={profile.gender}
                  onChange={(e) =>
                    setProfile({ ...profile, gender: e.target.value })
                  }
                >
                  {["不透露", "女", "男", "非二元"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <div className="welcome-note">
                <Sparkles size={17} />
                <span>四周，十二种科研工具，还有值得期待的相遇。</span>
              </div>
            </>
          ) : step === 1 ? (
            <>
              <span className="eyebrow">保持好奇</span>
              <h2>什么问题让你心动？</h2>
              <p>选择你的研究方向。不同方向都有值得探索的问题。</p>
              <div className="direction-options">
                {Object.entries(DIRECTIONS).map(([id, d]) => (
                  <button
                    key={id}
                    className={`direction-option ${profile.direction === id ? "selected" : ""}`}
                    onClick={() =>
                      setProfile({ ...profile, direction: id as Direction })
                    }
                  >
                    <span className="option-symbol">
                      {id === "agent" ? (
                        <Sparkles />
                      ) : id === "ml" ? (
                        <BrainCircuit />
                      ) : (
                        <Code2 />
                      )}
                    </span>
                    <span>
                      <b>{d.name}</b>
                      <small>{d.description}</small>
                    </span>
                    {profile.direction === id ? (
                      <Check size={19} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                ))}
              </div>
              <div className="ability-title">
                <b>初始能力</b>
                <small>可分配 {12 - total} 点</small>
              </div>
              {(
                [
                  { id: "coding", name: "编程实现", icon: Code2 },
                  { id: "insight", name: "研究洞察", icon: FlaskConical },
                  { id: "writing", name: "学术表达", icon: Feather },
                ] as const
              ).map((a) => (
                <div className="ability" key={a.id}>
                  <span>
                    <a.icon size={16} />
                    {a.name}
                  </span>
                  <div>
                    <button
                      aria-label={`减少${a.name}`}
                      disabled={profile.abilities[a.id] <= 1}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          abilities: {
                            ...profile.abilities,
                            [a.id]: profile.abilities[a.id] - 1,
                          },
                        })
                      }
                    >
                      −
                    </button>
                    <b>{profile.abilities[a.id]}</b>
                    <button
                      aria-label={`增加${a.name}`}
                      disabled={total >= 12 || profile.abilities[a.id] >= 8}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          abilities: {
                            ...profile.abilities,
                            [a.id]: profile.abilities[a.id] + 1,
                          },
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <span className="eyebrow">新的同行者</span>
              <h2>找到适合你的课题组。</h2>
              <p>导师的风格会影响指导、资源与日常节奏，没有唯一最优选。</p>
              <div className="mentor-options">
                {Object.entries(MENTORS).map(([id, m]) => (
                  <button
                    className={`mentor-option ${profile.mentor === id ? "selected" : ""}`}
                    key={id}
                    onClick={() =>
                      setProfile({ ...profile, mentor: id as Mentor })
                    }
                  >
                    <span
                      className="mentor-avatar"
                      style={{ background: m.color }}
                    >
                      {m.name[0]}
                    </span>
                    <span>
                      <b>
                        {m.name}
                        <em>{m.style}</em>
                      </b>
                      <small>{m.description}</small>
                      <i>
                        {m.lab} · {m.quota} GPUh
                      </i>
                    </span>
                    {profile.mentor === id && <Check size={18} />}
                  </button>
                ))}
              </div>
              <div className="welcome-note">
                <GraduationCap size={19} />
                <span>
                  你将从研一的第一个周一开始。先好好生活，再慢慢探索。
                </span>
              </div>
            </>
          )}
          <div className="setup-bottom">
            <button
              className="text-button"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={15} /> 上一步
            </button>
            <Button
              disabled={!profile.name.trim()}
              onClick={() =>
                step < 2
                  ? setStep(step + 1)
                  : onStart({ ...profile, name: profile.name.trim() })
              }
            >
              {step < 2 ? "继续" : "开启我的研究生生活"}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
