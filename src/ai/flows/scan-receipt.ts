
'use server';
/**
 * @fileOverview AI agent to scan and parse expense receipts.
 *
 * - scanReceipt - A function that handles the receipt scanning process.
 * - ScanReceiptInput - The input type for the scanReceipt function.
 * - ScanReceiptOutput - The return type for the scanReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { categories } from '@/lib/data';

const ScanReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanReceiptInput = z.infer<typeof ScanReceiptInputSchema>;

const ScanReceiptOutputSchema = z.object({
  description: z.string().describe("A brief description of the expense from the receipt (e.g., store name)."),
  amount: z.number().describe("The total amount of the expense from the receipt."),
  category: z.string().describe("The suggested category for the expense."),
});
export type ScanReceiptOutput = z.infer<typeof ScanReceiptOutputSchema>;

export async function scanReceipt(input: ScanReceiptInput): Promise<ScanReceiptOutput> {
  return scanReceiptFlow(input);
}

const categoryList = categories.map(c => c.value).join(', ');

const prompt = ai.definePrompt({
  name: 'scanReceiptPrompt',
  input: {schema: ScanReceiptInputSchema},
  output: {schema: ScanReceiptOutputSchema},
  prompt: `You are an expert receipt scanner for an expense splitting app. Analyze the provided receipt image.

  Extract the following information:
  1.  **Description**: A brief, clear description of the purchase. This is often the name of the store or vendor.
  2.  **Amount**: The final total amount of the bill. Look for "Total", "Grand Total", or a similar field.
  3.  **Category**: Based on the items or store name, suggest the most relevant category from this list: ${categoryList}.

  Return the extracted information in the specified JSON format.

  Receipt Image: {{media url=receiptDataUri}}`,
});

const scanReceiptFlow = ai.defineFlow(
  {
    name: 'scanReceiptFlow',
    inputSchema: ScanReceiptInputSchema,
    outputSchema: ScanReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
