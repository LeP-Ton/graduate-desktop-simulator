import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { DIRECTIONS, MENTORS } from "../game/data";
import type { Direction, Mentor, Profile } from "../game/types";
import { Button } from "./shared";
import { assetUrl, avatarUrl, GAME_TITLE } from "../period";

export const DEFAULT_PROFILE: Profile = {
  name: "林知夏",
  gender: "不透露",
  avatar: "🌱",
  direction: "agent",
  mentor: "rigorous",
  abilities: { coding: 4, insight: 5, writing: 3 },
};

const STEPS = ["创建研究生档案", "选择方向与初始能力", "加入导师课题组"];
const periodIcon = (file: string) => assetUrl(`icons/${file}`);

export function Onboarding({
  onStart,
  onClose,
}: {
  onStart: (p: Profile) => void;
  onClose?: () => void;
}) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [step, setStep] = useState(0);
  const total = Object.values(profile.abilities).reduce((a, b) => a + b, 0);

  return (
    <div className="setup2012-overlay">
      <section
        className="setup2012-window"
        role="dialog"
        aria-modal="true"
        aria-label="新建研究生档案"
      >
        <header className="setup2012-caption">
          <img src={periodIcon("computer-16.png")} alt="" draggable={false} />
          <span>{GAME_TITLE}</span>
          {onClose && (
            <button onClick={onClose} aria-label="关闭入学登记" title="关闭">
              <X size={15} />
            </button>
          )}
        </header>
        <div className="setup2012-shell">
          <aside className="setup2012-sidebar">
            <img
              className="setup2012-computer"
              src={periodIcon("computer-64.png")}
              alt=""
              draggable={false}
            />
            <h1>
              设置您的
              <br />
              科研生活
            </h1>
            <p>
              2012 年秋季入学
              <br />
              计算机学院 · 研究生工作站
            </p>
            <ol>
              {STEPS.map((label, index) => (
                <li
                  key={label}
                  className={
                    index === step ? "current" : index < step ? "complete" : ""
                  }
                >
                  <span>{index < step ? <Check size={11} /> : index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
            <div className="setup2012-version">
              <b>Windows 7</b>
              <span>{GAME_TITLE}</span>
            </div>
          </aside>
          <div className="setup2012-main">
            <div className="setup2012-stage">
              <div className="setup2012-stage-heading">
                <span>研究生入学登记向导</span>
                <small>步骤 {step + 1} / 3</small>
              </div>
              {step === 0 ? (
                <>
                  <h2>请设置您的研究生档案</h2>
                  <p className="setup2012-description">
                    欢迎入学。在登录科研桌面前，请填写姓名并选择一个头像。
                  </p>
                  <div className="setup2012-form-row">
                    <label className="setup2012-field">
                      <span>您的姓名</span>
                      <input
                        value={profile.name}
                        maxLength={12}
                        onChange={(event) =>
                          setProfile({ ...profile, name: event.target.value })
                        }
                        placeholder="输入姓名"
                        autoFocus
                      />
                    </label>
                    <label className="setup2012-field setup2012-gender">
                      <span>性别</span>
                      <select
                        value={profile.gender}
                        onChange={(event) =>
                          setProfile({ ...profile, gender: event.target.value })
                        }
                      >
                        {["不透露", "女", "男", "非二元"].map((gender) => (
                          <option key={gender}>{gender}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <fieldset className="setup2012-avatar-field">
                    <legend>选择用户头像</legend>
                    <div className="setup2012-avatars">
                      {["🌱", "🧑‍💻", "👩‍🚀", "🐈", "🦊", "🌻"].map((avatar) => (
                        <button
                          type="button"
                          aria-label={`头像${avatar}`}
                          aria-pressed={profile.avatar === avatar}
                          className={
                            profile.avatar === avatar ? "selected" : ""
                          }
                          key={avatar}
                          onClick={() => setProfile({ ...profile, avatar })}
                        >
                          <img
                            src={avatarUrl(avatar)}
                            alt=""
                            draggable={false}
                          />
                        </button>
                      ))}
                    </div>
                    <p>头像与性别不会改变科研能力或发展机会。</p>
                  </fieldset>
                  <div className="setup2012-info">
                    <img
                      src={periodIcon("documents-32.png")}
                      alt=""
                      draggable={false}
                    />
                    <div>
                      <b>从入组后的第一个月开始</b>
                      <p>
                        阅读文献、编写实验、参加组会，也为生活留些时间。这里没有预设的人生目标。
                      </p>
                    </div>
                  </div>
                </>
              ) : step === 1 ? (
                <>
                  <h2>请选择研究方向，并分配初始能力</h2>
                  <p className="setup2012-description">
                    方向决定您最初接触的文献与课题，能力点决定擅长的工作方式。
                  </p>
                  <div className="setup2012-directions" aria-label="研究方向">
                    {Object.entries(DIRECTIONS).map(([id, direction]) => (
                      <button
                        type="button"
                        key={id}
                        className={`setup2012-choice ${profile.direction === id ? "selected" : ""}`}
                        aria-pressed={profile.direction === id}
                        onClick={() =>
                          setProfile({ ...profile, direction: id as Direction })
                        }
                      >
                        <span className="setup2012-radio">
                          {profile.direction === id && <i />}
                        </span>
                        <span>
                          <b>{direction.name}</b>
                          <small>{direction.description}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <fieldset className="setup2012-abilities">
                    <legend>初始能力</legend>
                    <p>
                      可分配 <b>{12 - total}</b> 点，共 12 点；每项至少 1
                      点，最多 8 点。
                    </p>
                    {(
                      [
                        { id: "coding", name: "编程实现" },
                        { id: "insight", name: "研究洞察" },
                        { id: "writing", name: "学术表达" },
                      ] as const
                    ).map((ability) => (
                      <div className="setup2012-ability-row" key={ability.id}>
                        <span>{ability.name}</span>
                        <div
                          className="setup2012-ability-meter"
                          aria-hidden="true"
                        >
                          {Array.from({ length: 8 }, (_, index) => (
                            <i
                              key={index}
                              className={
                                index < profile.abilities[ability.id]
                                  ? "filled"
                                  : ""
                              }
                            />
                          ))}
                        </div>
                        <div className="setup2012-stepper">
                          <button
                            aria-label={`减少${ability.name}`}
                            disabled={profile.abilities[ability.id] <= 1}
                            onClick={() =>
                              setProfile({
                                ...profile,
                                abilities: {
                                  ...profile.abilities,
                                  [ability.id]:
                                    profile.abilities[ability.id] - 1,
                                },
                              })
                            }
                          >
                            −
                          </button>
                          <b>{profile.abilities[ability.id]}</b>
                          <button
                            aria-label={`增加${ability.name}`}
                            disabled={
                              total >= 12 || profile.abilities[ability.id] >= 8
                            }
                            onClick={() =>
                              setProfile({
                                ...profile,
                                abilities: {
                                  ...profile.abilities,
                                  [ability.id]:
                                    profile.abilities[ability.id] + 1,
                                },
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </fieldset>
                </>
              ) : (
                <>
                  <h2>请选择导师及所属课题组</h2>
                  <p className="setup2012-description">
                    导师的指导方式、可用资源与日常安排各不相同，请选择适合自己的科研环境。
                  </p>
                  <div className="setup2012-mentors" aria-label="导师与课题组">
                    {Object.entries(MENTORS).map(([id, mentor]) => (
                      <button
                        type="button"
                        className={`setup2012-choice setup2012-mentor ${profile.mentor === id ? "selected" : ""}`}
                        aria-pressed={profile.mentor === id}
                        key={id}
                        onClick={() =>
                          setProfile({ ...profile, mentor: id as Mentor })
                        }
                      >
                        <span className="setup2012-radio">
                          {profile.mentor === id && <i />}
                        </span>
                        <span>
                          <b>
                            {mentor.name}
                            <em>{mentor.style}</em>
                          </b>
                          <small>{mentor.description}</small>
                          <i>
                            {mentor.lab} · 初始算力 {mentor.quota} GPUh
                          </i>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="setup2012-info setup2012-ready">
                    <img
                      src={periodIcon("folder-32.png")}
                      alt=""
                      draggable={false}
                    />
                    <div>
                      <b>
                        {profile.name.trim() || "新同学"}
                        ，您的科研桌面已准备就绪
                      </b>
                      <p>
                        点击下方按钮进入 2012
                        年秋季。游戏进度将自动保存在此计算机上。
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <footer className="setup2012-footer">
              {onClose ? (
                <button className="setup2012-return" onClick={onClose}>
                  返回桌面
                </button>
              ) : (
                <span>进度保存在此计算机上</span>
              )}
              <div>
                <Button
                  secondary
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={13} />
                  上一步
                </Button>
                <Button
                  disabled={!profile.name.trim()}
                  onClick={() =>
                    step < 2
                      ? setStep(step + 1)
                      : onStart({ ...profile, name: profile.name.trim() })
                  }
                >
                  {step < 2 ? "继续" : "开启我的研究生生活"}
                  <ArrowRight size={13} />
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}
