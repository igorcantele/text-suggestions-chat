import { Injectable, Logger } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import {
  insertInCacheFn,
  SuggestionNode,
  UPDATE_CHAIN_QUEUE,
} from './suggestions';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LRUCache } from '../helpers';
import { Suggestion } from './entities/suggestion.entity';

const CACHE_SIZE = 5000;

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);
  // LRU cache of the Markov chain
  private readonly suggestionsAdjList = new LRUCache<SuggestionNode>(
    CACHE_SIZE,
    insertInCacheFn,
  );

  constructor(
    @InjectQueue(UPDATE_CHAIN_QUEUE) private readonly updateChainQueue: Queue,
  ) {}

  async getAll(): Promise<Suggestion[]> {
    // query limit = CACHE_SIZE orderby probability DESC
    return [];
  }

  async insertSuggestion(createSuggestionDto: CreateSuggestionDto) {
    return createSuggestionDto;
  }

  async updateSuggestion(createSuggestionDto: CreateSuggestionDto) {
    return createSuggestionDto;
  }

  async func(msg: string) {
    const splittedMsg = msg.split(' ');
    for (const word in splittedMsg) {
    }
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

  async initCache() {
    const suggs = await this.getAll();
    for (const sugg of suggs) {
      const newNode = {
        suggs: [sugg],
      };
      this.suggestionsAdjList.put(sugg.key, newNode);
    }
  }
}
