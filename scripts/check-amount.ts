import { deepStrictEqual, strictEqual } from 'node:assert';
import { evaluateAmount } from '../src/lib/amount-expression';
import { computeSplits } from '../src/lib/balances';

const cases: [string, number | null][] = [
  ['250', 250],
  ['40 + 50 * 2', 140],
  ['(40 + 50) * 2', 180],
  ['1,200 - 150', 1050],
  ['0.1 + 0.2', 0.3],
  ['100 / 3', 33.33],
  ['10 / 0', null],
  ['-5 + 10', 5],
  ['2(3)', null],
  ['1 / (1 / 0)', null],
  ['1 2', null],
  ['40 +', null],
  ['(40 + 50', null],
];

for (const [input, expected] of cases) {
  strictEqual(evaluateAmount(input), expected, input);
}
console.log(`All ${cases.length} amount checks passed`);

const splitCases: [string, Record<string, number>][] = [
  ['15 + 10', { a: 12.5, b: 12.5 }],
  ['100 / 3', { a: 16.67, b: 16.66 }],
  ['1 / 50', { a: 0.01, b: 0.01, c: 0, d: 0 }],
];

for (const [input, expected] of splitCases) {
  const total = evaluateAmount(input);
  if (total === null) throw new Error(`Invalid split test amount: ${input}`);
  deepStrictEqual(computeSplits('equal', total, Object.keys(expected)), expected, input);
}
console.log(`All ${splitCases.length} equal-split checks passed`);
