'use server';

/**
 * @fileOverview Expands ride search results by suggesting similar pickup locations or alternative destinations.
 *
 * - expandRideSearchResults - A function that expands ride search results.
 * - ExpandRideSearchResultsInput - The input type for the expandRideSearchResults function.
 * - ExpandRideSearchResultsOutput - The return type for the expandRideSearchResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandRideSearchResultsInputSchema = z.object({
  pickupLocation: z.string().describe('The user specified pickup location.'),
  destination: z.string().describe('The user specified destination.'),
  rideType: z.string().describe('The type of ride the user is looking for.'),
});
export type ExpandRideSearchResultsInput = z.infer<
  typeof ExpandRideSearchResultsInputSchema
>;

const ExpandRideSearchResultsOutputSchema = z.object({
  suggestedPickupLocations: z
    .array(z.string())
    .describe(
      'An array of suggested pickup locations similar to the original pickup location.'
    ),
  alternativeDestinations: z
    .array(z.string())
    .describe(
      'An array of alternative destinations that satisfy the user intent.'
    ),
});
export type ExpandRideSearchResultsOutput = z.infer<
  typeof ExpandRideSearchResultsOutputSchema
>;

export async function expandRideSearchResults(
  input: ExpandRideSearchResultsInput
): Promise<ExpandRideSearchResultsOutput> {
  return expandRideSearchResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expandRideSearchResultsPrompt',
  input: {schema: ExpandRideSearchResultsInputSchema},
  output: {schema: ExpandRideSearchResultsOutputSchema},
  prompt: `You are a ride search assistant. A user has provided a pickup location of {{{pickupLocation}}}, a destination of {{{destination}}}, and is looking for a ride of type {{{rideType}}}.

Suggest alternative pickup locations that are near the specified pickup location.
Suggest alternative destinations that would also satisfy the user's intent, even if they are not exactly the same as the specified destination.

Return your output as a json object.`,
});

const expandRideSearchResultsFlow = ai.defineFlow(
  {
    name: 'expandRideSearchResultsFlow',
    inputSchema: ExpandRideSearchResultsInputSchema,
    outputSchema: ExpandRideSearchResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
