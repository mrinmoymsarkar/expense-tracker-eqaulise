const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

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

// Chosen ranking, set from the measured result. Prefix until the measurement says otherwise.
export const suggestNames = suggestPrefix;
