"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { courseModules } from "../course-data";

const STORAGE_KEY = "evalcraft-progress";

export default function LearnPage() {
  const [activeId, setActiveId] = useState(courseModules[0].id);
  const [done, setDone] = useState<string[]>([]);
  const [openCheck, setOpenCheck] = useState<number | null>(null);
  const active = useMemo(() => courseModules.find((item) => item.id === activeId) || courseModules[0], [activeId]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) setDone(saved);
  }, []);

  const toggleDone = () => {
    const next = done.includes(active.id) ? done.filter((id) => id !== active.id) : [...done, active.id];
    setDone(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("evalcraft-progress"));
  };

  const select = (id: string) => {
    setActiveId(id);
    setOpenCheck(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="app-page">
      <SiteHeader current="/learn" />
      <section className="course-hero">
        <div>
          <p className="section-kicker">完整学习路径 · 约 17 小时</p>
          <h1>学到能做，<br />做到能讲。</h1>
          <p>十个模块围绕同一个作品持续生长。新增的黑盒评测与自动化评分，专门把业务经验接到 Transformer 之后的真实系统。</p>
        </div>
        <div className="progress-wheel" style={{ "--progress": `${done.length / courseModules.length * 360}deg` } as React.CSSProperties}>
          <div><strong>{done.length}</strong><span>/ {courseModules.length}</span><small>已完成</small></div>
        </div>
      </section>

      <section className="course-layout">
        <aside className="course-sidebar">
          <div className="sidebar-title"><span>课程地图</span><b>{Math.round(done.length / courseModules.length * 100)}%</b></div>
          {courseModules.map((item) => (
            <button key={item.id} onClick={() => select(item.id)} className={`${active.id === item.id ? "active" : ""} ${done.includes(item.id) ? "done" : ""}`}>
              <span>{done.includes(item.id) ? "✓" : item.number}</span><div><small>{item.track} · {item.time}</small><b>{item.title}</b></div>
            </button>
          ))}
          <a href="/workbench" className="sidebar-cta">打开评测工作台 →</a>
        </aside>

        <article className="lesson">
          <div className="lesson-header">
            <div><span>{active.track} / MODULE {active.number}</span><h2>{active.title}</h2><p>{active.subtitle}</p></div>
            <button onClick={toggleDone} className={done.includes(active.id) ? "complete-button done" : "complete-button"}>{done.includes(active.id) ? "✓ 已完成" : "标记完成"}</button>
          </div>

          <div className="objective-box"><span>本节目标</span><p>{active.objective}</p></div>

          <section className="lesson-section">
            <div className="lesson-section-title"><span>01</span><h3>核心认知</h3></div>
            <div className="concept-grid">
              {active.concepts.map((concept, index) => <div className="concept-card" key={concept.title}><small>{String(index + 1).padStart(2, "0")}</small><h4>{concept.title}</h4><p>{concept.body}</p>{concept.example && <code>{concept.example}</code>}</div>)}
            </div>
          </section>

          <section className="lesson-section">
            <div className="lesson-section-title"><span>02</span><h3>动手任务</h3></div>
            <ol className="practice-list">{active.practice.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol>
          </section>

          <section className="lesson-section">
            <div className="lesson-section-title"><span>03</span><h3>检查理解</h3></div>
            <div className="knowledge-checks">
              {active.checks.map((item, index) => <div key={item.question} className={openCheck === index ? "open" : ""}><button onClick={() => setOpenCheck(openCheck === index ? null : index)}><span>Q{index + 1}</span><b>{item.question}</b><i>{openCheck === index ? "−" : "+"}</i></button>{openCheck === index && <p>{item.answer}</p>}</div>)}
            </div>
          </section>

          <section className="lesson-output"><span>本节必须留下的证据</span><strong>{active.deliverable}</strong></section>

          <section className="lesson-sources"><span>一手资料</span>{active.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</section>

          <div className="lesson-nav">
            {courseModules.findIndex((item) => item.id === active.id) > 0 ? <button onClick={() => select(courseModules[courseModules.findIndex((item) => item.id === active.id) - 1].id)}>← 上一模块</button> : <span />}
            {courseModules.findIndex((item) => item.id === active.id) < courseModules.length - 1 ? <button onClick={() => select(courseModules[courseModules.findIndex((item) => item.id === active.id) + 1].id)}>下一模块 →</button> : <a href="/interview">进入面试训练 →</a>}
          </div>
        </article>
      </section>
    </main>
  );
}
