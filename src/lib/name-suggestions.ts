const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

const ranker = (max: number) => (names: string[], typed: string) => {
  const q = normalise(typed);
  const score = (name: string) => {
    const n = normalise(name);
    if (n === q) return 9;
    if (n.startsWith(q)) return 0;
    if (n.includes(q)) return 1;
    let i = 0;
    for (const c of n) if (c === q[i]) i++;
    return i === q.length ? 2 : 9;
  };
  return q
    ? names.filter((n) => score(n) <= max).sort((a, b) => score(a) - score(b)).slice(0, 4)
    : [];
};

export const suggestPrefix = ranker(0);
export const suggestFuzzy = ranker(2);

export const suggestNames = suggestFuzzy;
