export function isDateBefore(a: string | null | undefined, b: string): boolean {
  if (!a) return true;
  return a < b; // YYYY-MM-DD 문자열 비교로 충분
}

export function periodStart(period: string): string {
  const { start } = (() => {
    const now = new Date();
    const p = (period || "11mo").trim().toLowerCase();
    if (p.endsWith("mo")) {
      const months = Number(p.slice(0, -2) || 11);
      const d = new Date(now);
      d.setMonth(d.getMonth() - months);
      return { start: d };
    }
    if (p.endsWith("y")) {
      const years = Number(p.slice(0, -1) || 1);
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - years);
      return { start: d };
    }
    if (p.endsWith("d")) {
      const days = Number(p.slice(0, -1) || 30);
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return { start: d };
    }
    const d = new Date(now);
    d.setMonth(d.getMonth() - 11);
    return { start: d };
  })();
  return start.toISOString().slice(0, 10);
}
