import { Injectable, Logger } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UPDATE_CHAIN_QUEUE } from './suggestions';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

const CACHE_SIZE = 5000;

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectQueue(UPDATE_CHAIN_QUEUE) private readonly updateChainQueue: Queue,
  ) {}
  private readonly logger = new Logger(SuggestionsService.name);
  // LRU cache of the Markov chain
  private readonly suggestionsAdjList = {
    word: {
      p: 0.5,
      sugg: 'ciao',
    },
  };

  async getAll() {
    // query limit = CACHE_SIZE orderby probability DESC
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
    this.logger.log('adding to queues');
    await this.updateChainQueue.add({
      user,
      msg,
    });
  }
}
