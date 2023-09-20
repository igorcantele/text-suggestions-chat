import { Suggestion } from './entities/suggestion.entity';
import { binarySearch } from '../helpers';

export const UPDATE_CHAIN_QUEUE = 'update-chain-queue';

export type SuggestionNodeElem = Omit<Suggestion, 'key'>;

export const insertInCacheFn = (
  prevVals: SuggestionNodeElem[],
  newVal: SuggestionNodeElem,
): [SuggestionNodeElem[], number] => {
  const foundIdx = prevVals.findIndex((node) => (node.sugg = newVal.sugg));
  const increment: number = foundIdx !== -1 ? 0 : 1;

  if (foundIdx !== -1) {
    prevVals[foundIdx].freq++;

    // Setting a pointer to find the most left element with freq < than the current increased freq
    let curr = foundIdx;
    while (prevVals[curr - 1].freq < prevVals[curr].freq) {
      curr--;
    }
    // Switching elements in the array
    const tmp = prevVals[curr + 1];
    prevVals[curr + 1] = prevVals[foundIdx];
    prevVals[foundIdx] = tmp;
  } else {
    // If the element has freq 1 can be added at the end of the array
    prevVals.push(newVal);
  }

  return [prevVals, increment];
};
