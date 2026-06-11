import type { SplitMethod, SplitMap, SettlementTransaction } from './types';

export interface ExpenseForBalance {
  paidBy: string;
  splits: Record<string, number>;
}

export interface SettlementForBalance {
  fromUid: string;
  toUid: string;
  amount: number;
}

export function computeNetBalances(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[],
  memberUids: string[]
): Record<string, number> {
  const balance: Record<string, number> = {};
  for (const uid of memberUids) {
    balance[uid] = 0;
  }

  for (const expense of expenses) {
    const { paidBy, splits } = expense;
    for (const [uid, amount] of Object.entries(splits)) {
      if (uid === paidBy) continue;
      balance[paidBy] = (balance[paidBy] ?? 0) + amount;
      balance[uid] = (balance[uid] ?? 0) - amount;
    }
  }

  for (const settlement of settlements) {
    balance[settlement.fromUid] = (balance[settlement.fromUid] ?? 0) + settlement.amount;
    balance[settlement.toUid] = (balance[settlement.toUid] ?? 0) - settlement.amount;
  }

  for (const uid of Object.keys(balance)) {
    balance[uid] = Math.round(balance[uid] * 100) / 100;
  }

  return balance;
}

export function simplifyDebts(netBalances: Record<string, number>): SettlementTransaction[] {
  const result: SettlementTransaction[] = [];

  const creditors: { uid: string; amount: number }[] = [];
  const debtors: { uid: string; amount: number }[] = [];

  for (const [uid, amount] of Object.entries(netBalances)) {
    if (amount > 0.01) {
      creditors.push({ uid, amount });
    } else if (amount < -0.01) {
      debtors.push({ uid, amount: -amount });
    }
  }

  // Sort descending so we always match largest first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const transfer = Math.min(creditor.amount, debtor.amount);

    if (transfer > 0.01) {
      result.push({
        fromUid: debtor.uid,
        toUid: creditor.uid,
        amount: Math.round(transfer * 100) / 100,
      });
    }

    creditor.amount -= transfer;
    debtor.amount -= transfer;

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return result;
}

export function getUserBalance(
  uid: string,
  netBalances: Record<string, number>,
  plan: SettlementTransaction[]
): { youOwe: number; youAreOwed: number } {
  let youOwe = 0;
  let youAreOwed = 0;

  for (const txn of plan) {
    if (txn.fromUid === uid) {
      youOwe += txn.amount;
    }
    if (txn.toUid === uid) {
      youAreOwed += txn.amount;
    }
  }

  return {
    youOwe: Math.round(youOwe * 100) / 100,
    youAreOwed: Math.round(youAreOwed * 100) / 100,
  };
}

export function computeSplits(
  method: SplitMethod,
  total: number,
  memberUids: string[],
  overrides?: Record<string, number>
): SplitMap {
  const n = memberUids.length;
  if (n === 0) return {};

  if (method === 'equal') {
    const base = Math.round((total / n) * 100) / 100;
    const result: SplitMap = {};
    let assigned = 0;
    for (let i = 1; i < n; i++) {
      result[memberUids[i]] = base;
      assigned += base;
    }
    // First member absorbs rounding remainder
    result[memberUids[0]] = Math.round((total - assigned) * 100) / 100;
    return result;
  }

  if (method === 'exact') {
    const result: SplitMap = {};
    for (const uid of memberUids) {
      result[uid] = overrides?.[uid] ?? 0;
    }
    return result;
  }

  // percentage
  const result: SplitMap = {};
  let assigned = 0;
  for (let i = 1; i < n; i++) {
    const pct = overrides?.[memberUids[i]] ?? 0;
    const amount = Math.round((total * pct) / 100 * 100) / 100;
    result[memberUids[i]] = amount;
    assigned += amount;
  }
  result[memberUids[0]] = Math.round((total - assigned) * 100) / 100;
  return result;
}
