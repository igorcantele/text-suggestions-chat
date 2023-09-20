import { Process, Processor } from '@nestjs/bull';
import { UPDATE_CHAIN_QUEUE } from './suggestions';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SuggestionsService } from './suggestions.service';

export interface UpdateChainQueue {
  user: string;
  message: string;
}

@Processor(UPDATE_CHAIN_QUEUE)
export class UpdateChainConsumer {
  private readonly logger = new Logger(UpdateChainConsumer.name);

  constructor(private suggestionsService: SuggestionsService) {}

  @Process()
  async updateChainQueue(job: Job<UpdateChainQueue>) {
    this.logger.log(`Updating queue | ${job.id}`);
    await this.suggestionsService.processMessage(job.data.message);
    this.logger.log(`Operation completed |  ${job.id}`);
  }
}
