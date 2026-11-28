import { ok, strictEqual } from 'node:assert';
import { evaluateAmount } from '../src/lib/amount-expression';
import { computeSplits } from '../src/lib/balances';

for (let n = 1; n <= 20; n++) {
  strictEqual(evaluateAmount(`40 + ${n} * 2`), 40 + n * 2);
  strictEqual(evaluateAmount(`(40 + ${n}) * 2`), (40 + n) * 2);
}
strictEqual(evaluateAmount('1,200 - 150'), 1050);
strictEqual(evaluateAmount('0.1 + 0.2'), 0.3);
strictEqual(evaluateAmount('100 / 3'), 33.33);
strictEqual(evaluateAmount('-5 + 10'), 5);
for (const input of ['10 / 0', '2(3)', '1 / (1 / 0)', '1 2', '40 +', '(40 + 50']) {
  strictEqual(evaluateAmount(input), null, input);
}

for (let paise = 1; paise <= 100; paise++) {
  const total = evaluateAmount(`${paise} / 100`);
  strictEqual(total, paise / 100);
  for (let count = 1; count <= 8; count++) {
    const members = Array.from({ length: count }, (_, i) => String(i));
    const split = computeSplits('equal', total, members);
    const shares = members.map(id => Math.round(split[id] * 100));
    const context = `${paise} paise among ${count} members`;
    strictEqual(shares.reduce((sum, share) => sum + share, 0), paise, context);
    ok(Math.min(...shares) >= 0 && Math.max(...shares) - Math.min(...shares) <= 1, context);
    ok(shares.every((share, i) => split[members[i]] === share / 100 && (!i || share <= shares[i - 1])), context);
  }
}
console.log('Calculator and equal-split checks passed');
