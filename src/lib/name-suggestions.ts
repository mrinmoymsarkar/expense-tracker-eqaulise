/**
 * Name suggestions for the "What was this for?" field.
 * Pure functions, no React. Two ranking options are kept so the
 * benchmark in scripts/benchmark-suggestions.ts stays reproducible.
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
    if (!seen || time > seen.time) latest.set(key, { name: e.description.trim(), time });
  }
  return [...latest.values()].sort((a, b) => b.time - a.time).map((v) => v.name);
}

// Option A: names that start with what was typed, newest first.
export function suggestPrefix(names: string[], typed: string, limit = 4): string[] {
  const q = normalise(typed);
  if (!q) return [];
  return names.filter((n) => normalise(n).startsWith(q) && normalise(n) !== q).slice(0, limit);
}

// True when the letters of q appear in n in order, e.g. "zpt" in "zepto".
const isSubsequence = (q: string, n: string) => {
  let i = 0;
  for (const ch of n) if (ch === q[i]) i++;
  return i === q.length;
};

// Option B: starts-with first, then contains, then in-order letters.
export function suggestFuzzy(names: string[], typed: string, limit = 4): string[] {
  const q = normalise(typed);
  if (!q) return [];
  const groups: string[][] = [[], [], []];
  for (const name of names) {
    const n = normalise(name);
    if (n === q) continue;
    if (n.startsWith(q)) groups[0].push(name);
    else if (n.includes(q)) groups[1].push(name);
    else if (isSubsequence(q, n)) groups[2].push(name);
  }
  return groups.flat().slice(0, limit);
}

// Default is prefix until the benchmark is run on a real export.
// If the script says "Winner: fuzzy", change this line to suggestFuzzy.
export const suggestNames = suggestPrefix;
