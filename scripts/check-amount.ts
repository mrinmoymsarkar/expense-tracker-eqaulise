import { evaluateAmount } from '../src/lib/amount-expression';

const cases: [string, number | null][] = [
  ['250', 250],
  ['40 + 50 * 2', 140],
  ['(40 + 50) * 2', 180],
  ['1,200 - 150', 1050],
  ['0.1 + 0.2', 0.3],
  ['100 / 3', 33.33],
  ['10 / 0', null],
  ['-5 + 10', 5],
  ['40 +', null],
  ['(40 + 50', null],
];

let failed = 0;
for (const [input, want] of cases) {
  const got = evaluateAmount(input);
  if (got !== want) failed++;
  console.log(got === want ? 'ok  ' : 'FAIL', input, '->', got);
}
console.log(failed ? failed + ' failed' : 'all ' + cases.length + ' pass');
