export const evaluateAmount = (text: string): number | null => {
  const s = text.replace(/[₹,\s]/g, '');
  if (!/^[\d.+\-*/()]+$/.test(s)) return null;
  let i = 0;
  const atom = (): number => {
    if (s[i] === '-') {
      i++;
      return -atom();
    }
    if (s[i] === '(') {
      i++;
      const inner = sum();
      if (s[i++] !== ')') throw new Error('missing bracket');
      return inner;
    }
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (!m) throw new Error('number expected');
    i += m[0].length;
    return Number(m[0]);
  };
  const product = (): number => {
    let v = atom();
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++];
      const r = atom();
      if (op === '/' && r === 0) throw new Error('divide by zero');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const sum = (): number => {
    let v = product();
    while (s[i] === '+' || s[i] === '-') {
      v = s[i++] === '+' ? v + product() : v - product();
    }
    return v;
  };
  try {
    const v = sum();
    return i === s.length && Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  } catch {
    return null;
  }
};
