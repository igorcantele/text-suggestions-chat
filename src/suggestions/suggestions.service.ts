import { Injectable } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UPDATE_CHAIN_QUEUE } from './suggestions';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectQueue(UPDATE_CHAIN_QUEUE) private readonly updateChainQueue: Queue,
  ) {}

  async createNode(createSuggestionDto: CreateSuggestionDto) {
    return createSuggestionDto;
  }

  async findSuggesionts(word: string) {
    return word;
  }

  async updateChain(user: string, msg: string) {
    await this.updateChainQueue.add({});
  }
}
