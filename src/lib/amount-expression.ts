import { isConstantNode, isOperatorNode, isParenthesisNode, parse, type MathNode } from 'mathjs/number';

function amountValue(node: MathNode): number {
  if (isConstantNode(node)) return Number(node.value);
  if (isParenthesisNode(node)) return amountValue(node.content);
  if (!isOperatorNode(node) || node.implicit) return NaN;

  const [left, right] = node.args.map(amountValue);
  switch (node.fn) {
    case 'unaryMinus': return -left;
    case 'add': return left + right;
    case 'subtract': return left - right;
    case 'multiply': return left * right;
    case 'divide': return right === 0 ? NaN : left / right;
    default: return NaN;
  }
}

export function evaluateAmount(text: string): number | null {
  const expression = text.replace(/[₹,]/g, '').trim();
  if (!/^[\d.\s+*/()-]+$/.test(expression)) return null;
  try {
    const paise = Math.round(amountValue(parse(expression)) * 100);
    return Number.isFinite(paise) ? paise / 100 : null;
  } catch {
    return null;
  }
}
