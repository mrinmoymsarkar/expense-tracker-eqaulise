/**
 * Name suggestions for the "What was this for?" field.
 * Pure functions, no React, so the logic is easy to read and test.
 */

const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Unique past expense names, most recently used first.
 * "zepto" and "Zepto " count as the same name; the latest spelling wins.
 */
export function getRecentNames(
  expenses: { description: string; date: Date | string }[]
): string[] {
  const latest = new Map<string, { name: string; time: number }>();
  for (const e of expenses) {
    const key = normalise(e.description);
    if (!key) continue;
    const time = new Date(e.date).getTime();
    const seen = latest.get(key);
    if (!seen || time > seen.time) {
      latest.set(key, { name: e.description.trim(), time });
    }
  }
  return [...latest.values()].sort((a, b) => b.time - a.time).map((v) => v.name);
}

/**
 * Suggestions for what the user has typed so far.
 * Names that start with the text come first, then names that contain it.
 * Input order (recency) is kept inside each group.
 */
export function suggestNames(names: string[], typed: string, limit = 4): string[] {
  const q = normalise(typed);
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of names) {
    const n = normalise(name);
    if (n === q) continue; // already typed in full
    if (n.startsWith(q)) starts.push(name);
    else if (n.includes(q)) contains.push(name);
  }
  return [...starts, ...contains].slice(0, limit);
}
