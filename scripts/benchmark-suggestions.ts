import { readFileSync } from 'node:fs';
import { getRecentNames, suggestPrefix, suggestFuzzy } from '../src/lib/name-suggestions';

// Usage: npx tsx scripts/benchmark-suggestions.ts equalize-expenses.csv
const parseLine = (line: string) =>
  [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"'));

const rows = readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1).map(parseLine);
const expenses = rows
  .map((r) => {
    const [d, m, y] = r[0].split('-');
    return { description: r[1], date: new Date(`${y}-${m}-${d}`) };
  })
  .filter((e) => e.description.trim())
  .sort((a, b) => a.date.getTime() - b.date.getTime());

const options = { prefix: suggestPrefix, fuzzy: suggestFuzzy };
const queries: Record<string, (name: string) => string | null> = {
  'first 2 letters': (n) => (n.length > 2 ? n.slice(0, 2) : null),
  'first 3 letters': (n) => (n.length > 3 ? n.slice(0, 3) : null),
  'skipped a letter': (n) => (n.length > 4 ? n[0] + n.slice(2, 5) : null),
};

const stats: Record<string, Record<string, { hit: number; total: number; shown: number }>> = {};
for (const opt of Object.keys(options)) {
  stats[opt] = {};
  for (const q of Object.keys(queries)) stats[opt][q] = { hit: 0, total: 0, shown: 0 };
}

expenses.forEach((e, i) => {
  const names = getRecentNames(expenses.slice(0, i));
  if (!names.some((n) => n.toLowerCase() === e.description.trim().toLowerCase())) return; // first use: nothing to suggest
  for (const [qName, makeQuery] of Object.entries(queries)) {
    const typed = makeQuery(e.description.trim());
    if (!typed) continue;
    for (const [opt, fn] of Object.entries(options)) {
      const list = fn(names, typed);
      const s = stats[opt][qName];
      s.total++;
      s.shown += list.length;
      if (list.some((n) => n.toLowerCase() === e.description.trim().toLowerCase())) s.hit++;
    }
  }
});

for (const opt of Object.keys(options)) {
  console.log(opt);
  for (const [q, s] of Object.entries(stats[opt])) {
    console.log(`  ${q.padEnd(18)} hit ${s.hit}/${s.total} = ${((100 * s.hit) / s.total).toFixed(1)}%, avg shown ${(s.shown / s.total).toFixed(2)}`);
  }
}
const overall = (o: string) => {
  const v = Object.values(stats[o]);
  return (100 * v.reduce((a, s) => a + s.hit, 0)) / v.reduce((a, s) => a + s.total, 0);
};
const gap = overall('fuzzy') - overall('prefix');
console.log(`Overall: prefix ${overall('prefix').toFixed(1)}%, fuzzy ${overall('fuzzy').toFixed(1)}%, gap ${gap.toFixed(1)} points`);
console.log(gap >= 3 ? 'Winner: fuzzy' : 'Winner: prefix (fuzzy did not beat it by 3 points)');
