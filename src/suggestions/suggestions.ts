import { Suggestion } from './entities/suggestion.entity';

export const UPDATE_CHAIN_QUEUE = 'update-chain-queue';

export type SuggestionNodeElem = Omit<Suggestion, 'key'>;

export const insertInCacheFn = (
  prevVals: SuggestionNodeElem[],
  newVal: SuggestionNodeElem,
): [SuggestionNodeElem[], number] => {
  const foundElem = prevVals.find((node) => (node.sugg = newVal.sugg));
  const increment: number = foundElem ? 0 : 1;

  if (foundElem) {
    foundElem.freq++;
  } else {
    prevVals.push(newVal);
  }

  return [prevVals, increment];
};
