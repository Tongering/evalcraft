"use client";

import { useEffect, useState } from "react";

const links = [
  ["/", "总览"],
  ["/learn", "课程"],
  ["/paper", "论文精读"],
  ["/workbench", "工作台"],
  ["/interview", "面试训练"],
  ["/setup", "实验环境"],
];

export function SiteHeader({ current }: { current: string }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const value = JSON.parse(localStorage.getItem("evalcraft-progress") || "[]");
    setDone(Array.isArray(value) ? value.length : 0);
    const update = () => {
      const next = JSON.parse(localStorage.getItem("evalcraft-progress") || "[]");
      setDone(Array.isArray(next) ? next.length : 0);
    };
    window.addEventListener("evalcraft-progress", update);
    return () => window.removeEventListener("evalcraft-progress", update);
  }, []);
  return (
    <header className="app-header">
      <a href="/" className="brand"><span>∆</span> EVALCRAFT</a>
      <nav aria-label="主导航">
        {links.map(([href, label]) => <a key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</a>)}
      </nav>
      <a className="header-progress" href="/learn"><i style={{ width: `${done / 10 * 100}%` }} /><span>{done}/10</span></a>
    </header>
  );
}
