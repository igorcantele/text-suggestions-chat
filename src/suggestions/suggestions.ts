import { Suggestion } from './entities/suggestion.entity';

export const UPDATE_CHAIN_QUEUE = 'update-chain-queue';

export interface SuggestionNode {
  suggs: Omit<Suggestion, 'key'>[];
}

export const insertInCacheFn = (
  prevVals: SuggestionNode[],
  newVal: SuggestionNode,
) => {
  return prevVals;
};
