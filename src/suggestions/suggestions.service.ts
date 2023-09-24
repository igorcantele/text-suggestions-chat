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
const LIMIT_SUGGESTIONS = 3;

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
    this.logger.debug(`Processing message: ${msg}`);
    const splittedMsg = msg.toLowerCase().split(' ');
    const suggestions: Suggestion[] = [];
    const contextLength = Math.min(CONTEXT, splittedMsg.length - 1);

    for (let i = contextLength; i < splittedMsg.length; i++) {
      const context = [];
      const sliceStart = i - CONTEXT;

      for (const [j, word] of splittedMsg.slice(sliceStart, i).entries()) {
        context.push(word);
        const key = context.join(' ');

        // Adding data to the cache
        const newNode: SuggestionNodeElem = {
          sugg: splittedMsg[sliceStart + j + 1],
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
    this.logger.debug(`Suggestions: ${JSON.stringify(suggestions)}`);

    await Promise.all(suggestions.map((sugg) => this.insertSuggestion(sugg)));
  }

  async findSuggesions(input: string) {
    const wordSplitted = input.toLowerCase().split(' ');
    const context = [];
    const query = async (key: string) =>
      this.repo.find({
        select: {
          sugg: true,
        },
        where: {
          key,
        },
        order: {
          freq: {
            direction: 'DESC',
          },
        },
      });

    let suggestions = [];
    for (const word of wordSplitted) {
      if (suggestions.length > LIMIT_SUGGESTIONS) break;
      context.push(word);
      const searchKey = context.join(' ');
      this.logger.debug(`search key: ${searchKey}`);
      const inCache = this.suggestionsAdjList
        .get(searchKey)
        .map((suggestion) => suggestion.sugg);

      this.logger.debug(`FOUND IN CACHE: ${JSON.stringify(inCache)}`);
      if (!inCache) {
        const suggs = await query(searchKey);
        this.logger.debug(`FOUND IN DB: ${JSON.stringify(suggs)}`);
        if (suggs)
          suggestions = [
            ...suggestions,
            ...suggs.map((suggestion) => suggestion.sugg),
          ];
        continue;
      }
      suggestions = [...suggestions, ...inCache];
    }

    return suggestions;
  }

  async updateChain(user: string, msg: string) {
    this.logger.log('adding to queue');
    await this.updateChainQueue.add({
      user,
      msg,
    });
  }

  private async insertSuggestion(suggestion: Suggestion) {
    const existingSugg = await this.repo.findOneBy({
      key: suggestion.key,
      sugg: suggestion.sugg,
    });
    if (existingSugg) {
      suggestion = Object.assign(suggestion, {
        ...existingSugg,
        freq: existingSugg.freq + 1,
      });
      this.logger.debug(
        `Updating suggestion ${suggestion.sugg} for ${suggestion.key}. New freq: ${suggestion.freq}`,
      );
    }
    return await this.repo.save(suggestion);
  }
}
