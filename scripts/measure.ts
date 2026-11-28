import { readFileSync } from 'fs';
import { suggestPrefix, suggestFuzzy } from '../src/lib/name-suggestions';

const names = [
  ...new Set(
    readFileSync('equalize-expenses.csv', 'utf8')
      .split('\r\n')
      .slice(1)
      .map((l) =>
        l
          .split(',')[1]
          .toLowerCase()
      )
  )
];
const big = [
  ...Array.from({ length: 5000 }, (_, i) => (i * 7919).toString(36)),
  ...names
];
const cases = names.flatMap((x) => [
  [x.slice(0, 3), x],
  [x[0] + x.slice(2), x]
]);

const run = (fn: typeof suggestPrefix) => {
  let hits = 0;
  let shown = 0;
  const times: number[] = [];
  for (const [typed, answer] of cases) {
    const start = performance.now();
    const list = fn(big, typed);
    times.push(performance.now() - start);
    shown += list.length;
    if (list[0] === answer) hits++;
  }
  times.sort((a, b) => a - b);
  return [
    Math.round((hits / cases.length) * 100),
    +(shown / cases.length).toFixed(2),
    +times[Math.floor(times.length * 0.95)].toFixed(2)
  ];
};

console.log(cases.length, 'cases: first-place %, average list, p95 ms');
console.log('prefix', run(suggestPrefix));
console.log('fuzzy', run(suggestFuzzy));
