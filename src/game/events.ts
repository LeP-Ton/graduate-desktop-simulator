import { VENUES } from "./data";
import { message, notify, once, uid } from "./mutations";
import type { GameState } from "./types";

export function tickEvents(s: GameState) {
  for (const event of s.calendar) {
    if (
      !event.done &&
      !event.missed &&
      s.hour >= event.start - 2 &&
      s.hour < event.start + event.duration
    )
      once(s, `remind-${event.id}`, () =>
        notify(
          s,
          "日历提醒",
          `${event.title} 即将开始，请安排好当前工作。`,
          "calendar",
        ),
      );
    if (!event.done && !event.missed && s.hour > event.start + event.duration) {
      event.missed = true;
      if (event.type === "meeting") {
        s.stats.trust -= s.profile.mentor === "rigorous" ? 10 : 5;
        message(
          s,
          "mentor",
          "刚才组会没有看到你。下次请提前安排，实在冲突也要及时沟通。科研合作需要可靠的沟通。",
        );
      }
    }
  }
  for (const sub of s.submissions)
    if (sub.status === "review" && s.hour >= sub.dueAt) {
      // 投稿时冻结质量与证据快照，审稿不能被等待期间的修改悄悄提高。
      const review = sub.decision;
      sub.status = review.status;
      sub.feedback = review.feedback;
      sub.score = review.score;
      const label = {
        accept: "Accept · 接收",
        minor: "Minor Revision · 小修",
        major: "Major Revision · 大修",
        reject: "Reject · 拒稿",
      }[review.status];
      s.mails.unshift({
        id: uid(s, "mail"),
        from: `${VENUES.find((v) => v.id === sub.venue)!.short} 编辑部`,
        subject: `审稿结果：${label}`,
        text: `论文评分：${sub.score}/100。\n\n${sub.feedback.join("\n\n")}\n\n请在论文编辑器查看评审、补充实验并提交逐点回复。`,
        hour: s.hour,
        read: false,
        kind: "review",
      });
      if (sub.status === "accept") {
        s.stats.reputation += 10;
        s.stats.trust += 8;
      }
      notify(s, "论文评审已返回", label, "writer");
    }
}
