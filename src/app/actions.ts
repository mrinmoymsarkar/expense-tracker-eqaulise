
"use server";

import { revalidatePath } from "next/cache";
import { suggestSplitMethod, SuggestSplitMethodInput } from "@/ai/flows/suggest-split-method";
import { scanReceipt, ScanReceiptInput, ScanReceiptOutput } from "@/ai/flows/scan-receipt";

export async function getSplitSuggestion(
  input: SuggestSplitMethodInput
): Promise<{ method?: string; reasoning?: string; error?: string }> {
  try {
    const result = await suggestSplitMethod(input);
    revalidatePath("/");
    return result;
  } catch (e) {
    console.error(e);
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return {
      error: `Failed to get suggestion: ${error}`,
    };
  }
}

export async function processReceipt(
  input: ScanReceiptInput
): Promise<{ data?: ScanReceiptOutput; error?: string }> {
  try {
    const result = await scanReceipt(input);
    return { data: result };
  } catch (e) {
    console.error(e);
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return {
      error: `Failed to scan receipt: ${error}`,
    };
  }
}
