import { Injectable, Logger } from '@nestjs/common';
import {
  insertInCacheFn,
  SuggestionNodeElem,
  UPDATE_CHAIN_QUEUE,
} from './suggestions';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LRUCache } from '../helpers';
import { Suggestion } from './entities/suggestion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const CACHE_SIZE = 15000;
const CONTEXT = 4;

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly suggestionsAdjList = new LRUCache<SuggestionNodeElem>(
    CACHE_SIZE,
    insertInCacheFn,
  );

  constructor(
    @InjectQueue(UPDATE_CHAIN_QUEUE) private readonly updateChainQueue: Queue,
    @InjectRepository(Suggestion) private repo: Repository<Suggestion>,
  ) {}

  private async insertSuggestion(suggestion: Suggestion) {
    const existingSugg = await this.repo.findOneBy({
      key: suggestion.key,
      sugg: suggestion.sugg,
    });
    if (existingSugg)
      suggestion = Object.assign(suggestion, {
        ...existingSugg,
        freq: existingSugg.freq + 1,
      });
    const res = await this.repo.save(suggestion);
    return res;
  }

  /*
   * This function saves data with a context and progressively reducing it.
   * e.g.
   * "Hello I need context"
   * will save the following key-value suggestions:
   *  Hello -> I
   *  Hello I -> need
   *  Hello I need -> context
   */
  async processMessage(msg: string) {
    const splittedMsg = msg.split(' ');
    const suggestions: Suggestion[] = [];
    for (let i = CONTEXT; i < splittedMsg.length - 1; i++) {
      const context = [];

      for (const [j, word] of splittedMsg.slice(i - CONTEXT, i).entries()) {
        context.push(word);
        const key = context.join(' ');

        // Adding data to the cache
        const newNode: SuggestionNodeElem = {
          sugg: splittedMsg[i + j],
          freq: 1,
        };
        this.suggestionsAdjList.put(key, newNode);

        // Pushing data to be inserted in db
        const newSuggestion = Object.assign(new Suggestion(), {
          key,
          ...newNode,
        });
        suggestions.push(newSuggestion);
      }
    }

    await Promise.all(suggestions.map((sugg) => this.insertSuggestion(sugg)));
  }

  async findSuggesions(word: string) {
    return word;
  }

  async updateChain(user: string, msg: string) {
    this.logger.log('adding to queue');
    await this.updateChainQueue.add({
      user,
      msg,
    });
  }
}
