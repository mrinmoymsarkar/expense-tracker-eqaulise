const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

// 0 starts with, 1 contains, 2 letters in order, 9 no match or already typed in full.
const score = (name: string, q: string) => {
  const n = normalise(name);
  if (n === q) return 9;
  if (n.startsWith(q)) return 0;
  if (n.includes(q)) return 1;
  let i = 0;
  for (const c of n) if (c === q[i]) i++;
  return i === q.length ? 2 : 9;
};

// Shows up to 4 names whose score is at most max, best score first.
const ranker = (max: number) => (names: string[], typed: string) => {
  const q = normalise(typed);
  return q ? names.filter((n) => score(n, q) <= max).sort((a, b) => score(a, q) - score(b, q)).slice(0, 4) : [];
};

export const suggestPrefix = ranker(0);
export const suggestFuzzy = ranker(2);

// Chosen ranking, set from the measured result.
export const suggestNames = suggestPrefix;
