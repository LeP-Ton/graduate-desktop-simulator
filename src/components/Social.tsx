import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarPlus,
  ChevronRight,
  Mail as MailIcon,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import { MENTORS, NPCS, gameDate } from "../game/data";
import { Button, Empty, Hint, Meter, PageHead, Pill } from "./shared";
import type { AppProps } from "./shared";
export function Chat({ state: s, dispatch, isActive = true }: AppProps) {
  const [contact, setContact] = useState("mentor"),
    [text, setText] = useState(""),
    [showProfile, setShowProfile] = useState(false);
  const npc = NPCS.find((n) => n.id === contact)!,
    person = s.npcs.find((n) => n.id === contact)!,
    name = contact === "mentor" ? MENTORS[s.profile.mentor].name : npc.name;
  useEffect(() => {
    if (isActive && s.messages.some((m) => m.from === contact && !m.read))
      dispatch({ type: "readMessages", npc: contact });
  }, [contact, s.messages.length, dispatch, isActive]);
  const msgs = s.messages.filter((m) => m.from === contact);
  return (
    <div className="chat-layout">
      <aside className="chat-contacts">
        <div>
          <h3>课题组通讯</h3>
          <span>
            <i className="online-dot" />
            实验室里，故事正在发生
          </span>
        </div>
        {NPCS.map((n) => {
          const unread = s.messages.filter(
              (m) => m.from === n.id && !m.read,
            ).length,
            last = s.messages.filter((m) => m.from === n.id).at(-1);
          return (
            <button
              key={n.id}
              className={contact === n.id ? "active" : ""}
              onClick={() => setContact(n.id)}
            >
              <span className="contact-avatar" style={{ background: n.color }}>
                {n.id === "mentor"
                  ? MENTORS[s.profile.mentor].name[0]
                  : n.avatar}
              </span>
              <div>
                <b>
                  {n.id === "mentor" ? MENTORS[s.profile.mentor].name : n.name}
                  <small>{n.role}</small>
                </b>
                <p>{last?.text || "还没有消息，打个招呼吧。"}</p>
              </div>
              {unread > 0 && <em>{unread}</em>}
            </button>
          );
        })}
        <div className="chat-group-note">
          <Users size={15} />
          <span>
            每个人都有自己的研究日程
            <br />
            时间推进时，课题组也会成长
          </span>
        </div>
      </aside>
      <main className="chat-main">
        <header>
          <div>
            <h3>
              {name}
              <Pill tone="slate">{npc.role}</Pill>
            </h3>
            <p>
              {person.status} · {npc.schedule} · 关系{" "}
              {Math.round(person.relationship)}
            </p>
          </div>
          <button
            className="text-button"
            onClick={() => setShowProfile((v) => !v)}
          >
            {showProfile ? "收起档案" : "角色档案"}
          </button>
        </header>
        {showProfile && (
          <div className="npc-profile">
            <div>
              <b>{npc.personality}</b>
              <p>
                {npc.direction} · {npc.schedule}
              </p>
              <span>当前任务：{person.task}</span>
            </div>
            <Meter value={npc.abilities.coding} label="编程实现" />
            <Meter value={npc.abilities.insight} label="研究洞察" />
            <Meter value={person.progress} label="自主研究进度" />
          </div>
        )}
        <div className="chat-messages">
          <div className="chat-date">
            {gameDate(s.hour).date} · {MENTORS[s.profile.mentor].lab}
          </div>
          {msgs.length ? (
            msgs.map((m) => (
              <div className={`message ${m.player ? "own" : ""}`} key={m.id}>
                <span
                  className="bubble-avatar"
                  style={{ background: m.player ? "#d5e7de" : npc.color }}
                >
                  {m.player ? s.profile.avatar : name[0]}
                </span>
                <div>
                  <small>
                    {m.player ? s.profile.name : name} · 第
                    {gameDate(m.hour).day}天 {gameDate(m.hour).clock}
                  </small>
                  <p>{m.text}</p>
                </div>
              </div>
            ))
          ) : (
            <Empty
              icon={MessageCircle}
              title="从一句问候开始"
              text={`${npc.personality} · 当前正在${person.task}`}
            />
          )}
        </div>
        <div className="chat-composer">
          <div className="quick-replies">
            {(
              [
                { id: "progress", text: "汇报进展" },
                { id: "help", text: "请教实验" },
                { id: "collaborate", text: "讨论合作" },
                { id: "resource", text: "申请算力" },
                { id: "calendar", text: "约定日程" },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  dispatch({ type: "reply", npc: contact, choice: c.id })
                }
              >
                {c.text}
              </button>
            ))}
          </div>
          <div className="chat-input">
            <input
              aria-label="聊天消息"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  dispatch({
                    type: "reply",
                    npc: contact,
                    choice: "progress",
                    text,
                  });
                  setText("");
                }
              }}
              placeholder="写下你的进展或问题…"
              maxLength={500}
            />
            <button
              disabled={!text.trim()}
              aria-label="发送消息"
              onClick={() => {
                dispatch({
                  type: "reply",
                  npc: contact,
                  choice: "progress",
                  text,
                });
                setText("");
              }}
            >
              <Send size={16} />
            </button>
          </div>
          <small>每次认真交流消耗 0.5 小时，合作会带来实际帮助。</small>
        </div>
      </main>
    </div>
  );
}
export function Calendar({ state: s, dispatch }: AppProps) {
  const current = gameDate(s.hour),
    [week, setWeek] = useState(current.week),
    [day, setDay] = useState(Math.floor(s.hour / 24)),
    [title, setTitle] = useState(""),
    [hour, setHour] = useState(16);
  const events = s.calendar
    .filter((e) => Math.floor(e.start / 168) + 1 === week)
    .sort((a, b) => a.start - b.start);
  return (
    <div className="page">
      <PageHead
        eyebrow="给重要的事留些时间"
        title="给重要的事，留些时间。"
        text={`2026 秋季学期 · 今天是第 ${current.day} 天，${current.weekday}`}
        action={<Pill>第 {current.week} / 4 周</Pill>}
      />
      <div className="week-tabs">
        {[1, 2, 3, 4].map((w) => (
          <button
            key={w}
            className={week === w ? "active" : ""}
            onClick={() => {
              setWeek(w);
              setDay((w - 1) * 7);
            }}
          >
            第 {w} 周
            <small>
              {w === 1
                ? "进入课题组"
                : w === 2
                  ? "探索与验证"
                  : w === 3
                    ? "积累证据"
                    : "写作与回顾"}
            </small>
          </button>
        ))}
      </div>
      <div className="calendar-days">
        {Array.from({ length: 7 }, (_, i) => {
          const d = (week - 1) * 7 + i,
            date = gameDate(d * 24),
            count = s.calendar.filter(
              (e) => Math.floor(e.start / 24) === d,
            ).length;
          return (
            <button
              key={d}
              className={`${day === d ? "selected" : ""} ${d === Math.floor(s.hour / 24) ? "today" : ""}`}
              onClick={() => setDay(d)}
            >
              <span>{date.weekday.replace("星期", "周")}</span>
              <b>{Number(date.date.match(/\d+日/)?.[0].replace("日", ""))}</b>
              <small>{count ? "●" : " "}</small>
            </button>
          );
        })}
      </div>
      <div className="calendar-events">
        {events.filter((e) => Math.floor(e.start / 24) === day).length ? (
          events
            .filter((e) => Math.floor(e.start / 24) === day)
            .map((e) => (
              <div
                className={`calendar-event ${e.done ? "done" : ""}`}
                key={e.id}
              >
                <div className="event-time">
                  <b>{gameDate(e.start).clock}</b>
                  <small>{e.duration} 小时</small>
                </div>
                <i className={e.type} />
                <div>
                  <h3>{e.title}</h3>
                  <p>
                    {e.type === "meeting"
                      ? "导师会根据选题、文献与实验记录评价汇报。"
                      : e.type === "course"
                        ? "课程会提升科研基础能力。"
                        : e.type === "interview"
                          ? "了解职业机会，积累工程与沟通经验。"
                          : "记得带上问题与真实记录。"}
                  </p>
                  <Pill tone={e.missed ? "orange" : "slate"}>
                    {e.done
                      ? "已完成"
                      : e.missed
                        ? "已错过"
                        : e.start > s.hour
                          ? "待开始"
                          : "进行中"}
                  </Pill>
                </div>
                {!e.done && !e.missed && (
                  <div className="event-actions">
                    <Button
                      small
                      disabled={s.hour < e.start - 2}
                      onClick={() => dispatch({ type: "attend", id: e.id })}
                    >
                      参加 · {e.duration}h
                    </Button>
                    {s.hour < e.start - 2 && (
                      <button
                        className="text-button"
                        onClick={() =>
                          dispatch({ type: "advance", hours: e.start - s.hour })
                        }
                      >
                        推进到开始
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="calendar-free">
            <span>🌤</span>
            <h3>这一天，留一点自由。</h3>
            <p>还没有安排，做研究、读文献，或者好好生活。</p>
          </div>
        )}
      </div>
      <div className="add-event">
        <CalendarPlus size={20} />
        <div>
          <b>记录一个新的安排</b>
          <span>第 {day + 1} 天</span>
        </div>
        <input
          aria-label="日程标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="和师兄讨论 / 复现实验…"
        />
        <select
          aria-label="日程时间"
          value={hour}
          onChange={(e) => setHour(+e.target.value)}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <Button
          small
          onClick={() => {
            dispatch({ type: "addEvent", title, start: day * 24 + hour });
            setTitle("");
          }}
        >
          添加
        </Button>
      </div>
      <Hint>
        组会是固定安排，错过会影响导师信任。推进到活动会消耗中间的时间和精力；也可以先休息，再按自己的节奏前往。
      </Hint>
    </div>
  );
}
export function Mail({ state: s, dispatch, open, isActive = true }: AppProps) {
  const [selected, setSelected] = useState(s.mails[0]?.id || ""),
    [filter, setFilter] = useState("all");
  const mails = [...s.mails]
      .filter((m) => filter === "all" || m.kind === filter)
      .sort((a, b) => b.hour - a.hour),
    mail = s.mails.find((m) => m.id === selected) || mails[0];
  useEffect(() => {
    if (isActive && mail && !mail.read)
      dispatch({ type: "readMail", id: mail.id });
  }, [mail?.id, dispatch, isActive]);
  return (
    <div className="mail-layout">
      <aside>
        <h3>
          <MailIcon size={19} />
          校园邮箱
        </h3>
        {[
          { id: "all", text: "全部邮件" },
          { id: "review", text: "论文评审" },
          { id: "career", text: "职业机会" },
          { id: "school", text: "学校通知" },
          { id: "conference", text: "学术会议" },
        ].map((c) => (
          <button
            className={filter === c.id ? "active" : ""}
            onClick={() => {
              setFilter(c.id);
              const m = s.mails.find((m) => c.id === "all" || m.kind === c.id);
              setSelected(m?.id || "");
            }}
            key={c.id}
          >
            {c.text}
            <span>
              {s.mails.filter(
                (m) => (c.id === "all" || m.kind === c.id) && !m.read,
              ).length || ""}
            </span>
          </button>
        ))}
        <p>
          {s.profile.name}
          <br />
          @student.grados.edu
        </p>
      </aside>
      <div className="mail-list">
        {mails.map((m) => (
          <button
            key={m.id}
            className={`${mail?.id === m.id ? "active" : ""} ${!m.read ? "unread" : ""}`}
            onClick={() => setSelected(m.id)}
          >
            <span>
              {m.from}
              <small>{gameDate(m.hour).date}</small>
            </span>
            <b>{m.subject}</b>
            <p>{m.text.slice(0, 70)}</p>
          </button>
        ))}
      </div>
      <main className="mail-body">
        {mail ? (
          <>
            <Pill tone="slate">
              {mail.kind === "review"
                ? "同行评审"
                : mail.kind === "career"
                  ? "职业机会"
                  : mail.kind === "conference"
                    ? "学术会议"
                    : "学校通知"}
            </Pill>
            <h2>{mail.subject}</h2>
            <div className="mail-sender">
              <span>{mail.from[0]}</span>
              <div>
                <b>{mail.from}</b>
                <small>
                  发送给 {s.profile.name} · {gameDate(mail.hour).date}{" "}
                  {gameDate(mail.hour).clock}
                </small>
              </div>
            </div>
            <div className="mail-text">
              {mail.text.split("\n").map((text, i) => (
                <p key={i}>{text || "\u00A0"}</p>
              ))}
            </div>
            <Button
              secondary
              onClick={() =>
                open(
                  mail.kind === "review"
                    ? "writer"
                    : mail.kind === "career"
                      ? "calendar"
                      : mail.kind === "conference"
                        ? "writer"
                        : "academic",
                )
              }
            >
              {mail.kind === "review"
                ? "查看评审与修改"
                : mail.kind === "career"
                  ? "查看交流日程"
                  : mail.kind === "conference"
                    ? "前往论文编辑器"
                    : "查看培养档案"}
              <ChevronRight size={14} />
            </Button>
          </>
        ) : (
          <Empty
            icon={MailIcon}
            title="这里暂时很安静"
            text="新的通知、评审与机会将随时间到来。"
          />
        )}
      </main>
    </div>
  );
}
