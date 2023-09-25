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
import { Repository, UpdateResult } from 'typeorm';

const CACHE_SIZE = 15000;
const CONTEXT = 4;
const LIMIT_SUGGESTIONS = 3;

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  private readonly suggestionsAdjList = new LRUCache<SuggestionNodeElem>(
    CACHE_SIZE,
    insertInCacheFn,
    true,
  );

  constructor(
    @InjectQueue(UPDATE_CHAIN_QUEUE) private readonly updateChainQueue: Queue,
    @InjectRepository(Suggestion) private repo: Repository<Suggestion>,
  ) {}

  /*
   * This function saves data with a context and progressively incresing it.
   * e.g.
   * "Hello I need context"
   * will save the following key-value suggestions:
   *  Hello -> I
   *  Hello I -> need
   *  I -> need
   *  Hello I need -> context
   *  I need -> context
   *  need -> context
   *
   * TODO: Implement `like` query by adding in the cache the work character by character.
   *  e.g.
   * "Hello I need context"
   * H -> I
   * He -> I
   * Hel -> I
   * Hell -> I
   * Hello -> I
   * ...
   *
   */
  async processMessage(msg: string) {
    this.logger.debug(`Processing message: ${msg}`);
    const splittedMsg = msg.toLowerCase().split(' ');
    const suggestions: Suggestion[] = [];
    const visited = {};

    /*
     * Given context add element to the cache and to the suggestions list
     */
    const processContext = (context: string[], sugg: string) => {
      const key = context.join(' ');
      // Adding data to the cache
      const newNode: SuggestionNodeElem = {
        sugg,
        freq: 1,
      };
      this.suggestionsAdjList.put(key, newNode);

      // Pushing data to be inserted in db
      const newSuggestion = Object.assign(new Suggestion(), {
        key,
        ...newNode,
      });
      suggestions.push(newSuggestion);
    };
    /*
     * Rercursively process all contexts in the message
     */
    const processSubMsg = (
      i: number,
      ctx: string[],
      visited: Record<string, string>,
    ) => {
      ctx.push(splittedMsg[i - 1]);
      ctx =
        ctx.length > CONTEXT
          ? ctx.slice(ctx.length - CONTEXT, ctx.length)
          : ctx;
      if (i >= splittedMsg.length || ctx.join(' ') in visited) return;
      const sugg = splittedMsg[i];
      processContext(ctx, sugg);
      visited[ctx.join(' ')] = sugg;
      processSubMsg(i + 1, [], visited);
      processSubMsg(i + 1, ctx, visited);
      ctx.pop();
    };
    processSubMsg(1, [], visited);
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
          // TODO: Implement `like` query
          key,
        },
        order: {
          freq: {
            direction: 'DESC',
          },
        },
      });

    let suggestions: string[] = [];
    for (const word of wordSplitted) {
      if (suggestions.length > LIMIT_SUGGESTIONS) break;
      context.push(word);
      const searchKey = context.join(' ');
      this.logger.debug(`search key: ${searchKey}`);
      const inCache = this.suggestionsAdjList
        .get(searchKey)
        ?.map((suggestion) => suggestion.sugg);

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
    const updated: UpdateResult = await this.repo
      .createQueryBuilder("Update Suggestion's frequency")
      .update(Suggestion)
      .where({
        key: suggestion.key,
        sugg: suggestion.sugg,
      })
      .set({ freq: () => 'freq + 1' })
      .execute();
    this.logger.debug(JSON.stringify(updated));
    if (updated.affected == 0) {
      this.logger.debug(
        `Saving suggestion ${suggestion.sugg} for ${suggestion.key}.`,
      );
      return await this.repo.save(suggestion);
    }
    this.logger.debug(
      `Updating suggestion ${suggestion.sugg} for ${suggestion.key}.`,
    );
  }
}
