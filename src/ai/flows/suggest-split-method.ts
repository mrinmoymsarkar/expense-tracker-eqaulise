'use server';

/**
 * @fileOverview AI agent to suggest an appropriate split method for an expense.
 *
 * - suggestSplitMethod - A function that suggests a split method for an expense.
 * - SuggestSplitMethodInput - The input type for the suggestSplitMethod function.
 * - SuggestSplitMethodOutput - The return type for the suggestSplitMethod function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSplitMethodInputSchema = z.object({
  description: z.string().describe('A description of the expense.'),
  numPeople: z.number().describe('The number of people involved in the expense.'),
});
export type SuggestSplitMethodInput = z.infer<typeof SuggestSplitMethodInputSchema>;

const SuggestSplitMethodOutputSchema = z.object({
  method: z.string().describe('The suggested split method for the expense.'),
  reasoning: z.string().describe('The reasoning behind the suggested split method.'),
});
export type SuggestSplitMethodOutput = z.infer<typeof SuggestSplitMethodOutputSchema>;

export async function suggestSplitMethod(input: SuggestSplitMethodInput): Promise<SuggestSplitMethodOutput> {
  return suggestSplitMethodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSplitMethodPrompt',
  input: {schema: SuggestSplitMethodInputSchema},
  output: {schema: SuggestSplitMethodOutputSchema},
  prompt: `You are an expert in suggesting fair split methods for expenses.

  Given the following expense description and number of people involved, suggest an appropriate split method and explain your reasoning.

  Description: {{{description}}}
  Number of people: {{{numPeople}}}

  Consider split methods such as:
  - Equal split
  - Split by percentage
  - Split by exact amounts
  - Split by shares

  Return the suggested method and reasoning in a JSON format.
  Make sure the method and reasoning are suitable for the Indian market.
`,
});

const suggestSplitMethodFlow = ai.defineFlow(
  {
    name: 'suggestSplitMethodFlow',
    inputSchema: SuggestSplitMethodInputSchema,
    outputSchema: SuggestSplitMethodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
