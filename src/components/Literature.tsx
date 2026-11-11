import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  FileText,
  Lightbulb,
  Quote,
  Search as SearchIcon,
} from "lucide-react";
import { DIRECTIONS, PAPERS } from "../game/data";
import type { Direction } from "../game/types";
import { Button, Empty, Hint, PageHead, Pill, SectionTitle } from "./shared";
import type { AppProps } from "./shared";
export function Literature({
  state: s,
  dispatch,
  open,
  library = false,
}: AppProps & { library?: boolean }) {
  const [query, setQuery] = useState(""),
    [field, setField] = useState<Direction | "all">("all"),
    [filter, setFilter] = useState<"all" | "saved" | "read" | "cited">("all"),
    [selected, setSelected] = useState<string | null>(null);
  const paper = PAPERS.find((p) => p.id === selected);
  const papers = PAPERS.filter(
    (p) =>
      (field === "all" || p.field === field) &&
      (filter === "all" ||
        (filter === "saved" && s.saved.includes(p.id)) ||
        (filter === "read" && s.read.includes(p.id)) ||
        (filter === "cited" && s.manuscript.references.includes(p.id))) &&
      `${p.title}${p.abstract}${p.tag}${p.authors}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (paper)
    return (
      <div className="page paper-detail">
        <button className="back-link" onClick={() => setSelected(null)}>
          <ArrowLeft size={15} />
          返回{library ? "知识库" : "搜索结果"}
        </button>
        <div className="paper-tags">
          <Pill>{DIRECTIONS[paper.field].short}</Pill>
          <Pill tone="slate">{paper.year}</Pill>
          {s.read.includes(paper.id) && (
            <Pill>
              <Check size={12} />
              已阅读
            </Pill>
          )}
        </div>
        <h1>{paper.title}</h1>
        <p className="paper-authors">
          {paper.authors} <span>·</span> {paper.citations} 次引用 <span>·</span>{" "}
          游戏内虚构文献
        </p>
        <div className="paper-actions">
          <Button
            onClick={() => dispatch({ type: "read", id: paper.id })}
            disabled={s.read.includes(paper.id)}
          >
            {s.read.includes(paper.id) ? (
              <>
                <Check size={15} />
                已完成精读
              </>
            ) : (
              <>
                精读并记录洞察 · 1h
                <ArrowRight size={14} />
              </>
            )}
          </Button>
          <Button
            secondary
            onClick={() => dispatch({ type: "savePaper", id: paper.id })}
          >
            <Bookmark
              size={14}
              fill={s.saved.includes(paper.id) ? "currentColor" : "none"}
            />
            {s.saved.includes(paper.id) ? "已收藏" : "加入知识库"}
          </Button>
          <Button
            secondary
            onClick={() => dispatch({ type: "cite", id: paper.id })}
          >
            <Quote size={14} />
            {s.manuscript.references.includes(paper.id)
              ? "取消引用"
              : "引用到论文"}
          </Button>
        </div>
        <section className="paper-section">
          <span>摘要与研究问题</span>
          <h3>摘要</h3>
          <p>{paper.abstract}</p>
        </section>
        <div className="paper-two">
          <section>
            <span>01 / 研究方法</span>
            <h3>他们怎么做？</h3>
            <p>{paper.method}</p>
          </section>
          <section>
            <span>02 / 主要发现</span>
            <h3>得到了什么？</h3>
            <p>{paper.result}</p>
          </section>
        </div>
        {s.read.includes(paper.id) ? (
          <>
            <div className="insight-box">
              <Lightbulb size={21} />
              <div>
                <h3>留给你的研究空间</h3>
                <p>{paper.limitation}</p>
                <strong>研究洞察</strong>
                <p>{paper.insight}</p>
              </div>
            </div>
            <SectionTitle>连接到下一篇</SectionTitle>
            {paper.related.map((id) => (
              <button
                className="related-paper"
                key={id}
                onClick={() => setSelected(id)}
              >
                <FileText size={16} />
                {PAPERS.find((p) => p.id === id)!.title}
                <ChevronRight size={15} />
              </button>
            ))}
            <Button secondary onClick={() => open("home")}>
              用文献启发你的研究问题
              <ArrowRight size={14} />
            </Button>
          </>
        ) : (
          <Hint>
            精读后将解锁研究局限、可改进方向与相关论文。摘要不能替代完整阅读。
          </Hint>
        )}
      </div>
    );
  return (
    <div className="page">
      <PageHead
        eyebrow={library ? "你的文献知识库" : "探索学术世界"}
        title={library ? "让知识，彼此连接。" : "每个好问题，都有来处。"}
        text={
          library
            ? `${s.read.length} 篇已读 · ${s.saved.length} 篇收藏 · ${s.manuscript.references.length} 篇引用`
            : "探索方法、理解局限，再找到值得研究的问题。"
        }
      />
      <div className="search-box">
        <SearchIcon size={18} />
        <input
          aria-label="搜索论文"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索论文标题、关键词、作者…"
        />
        <kbd>↵</kbd>
      </div>
      <div className="filter-row">
        <div className="tabs">
          {(["all", "agent", "ml", "systems"] as const).map((id) => (
            <button
              key={id}
              className={field === id ? "active" : ""}
              onClick={() => setField(id)}
            >
              {id === "all" ? "全部方向" : DIRECTIONS[id].short}
            </button>
          ))}
        </div>
        <select
          aria-label="文献筛选"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">全部文献</option>
          <option value="saved">已收藏</option>
          <option value="read">已阅读</option>
          <option value="cited">已引用</option>
        </select>
      </div>
      <div className="results-count">
        找到 {papers.length} 篇研究文献 <span>本地学术库 · 虚构内容</span>
      </div>
      <div className="paper-list">
        {papers.map((p) => (
          <article key={p.id}>
            <div
              className="paper-list-main"
              onClick={() => setSelected(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelected(p.id)}
            >
              <div className="paper-list-meta">
                <Pill tone="slate">{p.tag}</Pill>
                <span>
                  {p.year} · {p.citations} 次引用
                </span>
                {s.read.includes(p.id) && (
                  <span className="read-mark">
                    <Check size={12} />
                    已读
                  </span>
                )}
              </div>
              <h3>{p.title}</h3>
              <span className="authors">{p.authors}</span>
              <p>{p.abstract}</p>
              <button className="paper-open">
                查看论文
                <ArrowRight size={13} />
              </button>
            </div>
            <button
              className={`bookmark-button ${s.saved.includes(p.id) ? "saved" : ""}`}
              title={s.saved.includes(p.id) ? "取消收藏" : "收藏文献"}
              onClick={() => dispatch({ type: "savePaper", id: p.id })}
            >
              <Bookmark
                size={19}
                fill={s.saved.includes(p.id) ? "currentColor" : "none"}
              />
            </button>
          </article>
        ))}
      </div>
      {!papers.length && (
        <Empty
          title="暂时没有匹配的文献"
          text="试试其他关键词，或切换文献分类。"
        />
      )}
    </div>
  );
}
