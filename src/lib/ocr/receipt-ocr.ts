export interface LocalScanResult {
  description: string;
  amount: number | null;
  category: string;
}

export async function scanReceiptLocal(dataUri: string): Promise<LocalScanResult> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(dataUri);
    const text = data.text;

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const lower = text.toLowerCase();

    // amount: first pass — lines with total/balance keywords
    let amount: number | null = null;
    const totalLineRe = /(grand\s*)?total|amount\s*(due|payable)|net\s*am(oun)?t|balance\s*due/i;
    const numRe = /([0-9][0-9,]*(?:\.[0-9]{1,2})?)/g;

    for (const line of lines) {
      if (totalLineRe.test(line)) {
        const matches = Array.from(line.matchAll(numRe));
        if (matches.length > 0) {
          const last = matches[matches.length - 1][1];
          const parsed = parseFloat(last.replace(/,/g, ''));
          if (!isNaN(parsed)) {
            amount = parsed;
            break;
          }
        }
      }
    }

    // second pass fallback — largest number < 1,000,000 in whole text
    if (amount === null) {
      let largest = -Infinity;
      for (const m of text.matchAll(numRe)) {
        const v = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(v) && v < 1_000_000 && v > largest) {
          largest = v;
        }
      }
      if (largest > -Infinity) amount = largest;
    }

    // description: first line with ≥3 alphabetic chars, not a receipt/invoice/tax keyword
    const skipRe = /receipt|invoice|tax|gst|bill/i;
    const alphaRe = /[a-zA-Z]/g;
    let description = '';
    for (const line of lines) {
      const alphaCount = (line.match(alphaRe) ?? []).length;
      if (alphaCount >= 3 && !skipRe.test(line)) {
        description = line.slice(0, 40);
        break;
      }
    }

    // category
    let category = 'Food';
    if (/restaurant|cafe|hotel|food|swiggy|zomato|dine/.test(lower)) {
      category = 'Food';
    } else if (/uber|ola|petrol|fuel|diesel|parking|toll|metro/.test(lower)) {
      category = 'Transport';
    } else if (/pharmacy|chemist|medical|hospital|clinic/.test(lower)) {
      category = 'Health';
    } else if (/grocery|mart|supermarket|store|bazaar/.test(lower)) {
      category = 'Shopping';
    } else if (/movie|cinema|pvr/.test(lower)) {
      category = 'Entertainment';
    }

    return { description, amount, category };
  } finally {
    await worker.terminate();
  }
}
