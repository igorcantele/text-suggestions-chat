import { Process, Processor } from '@nestjs/bull';
import { UPDATE_CHAIN_QUEUE } from './suggestions';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

export interface UpdateChainQueue {
  user: string;
  message: string;
}

@Processor(UPDATE_CHAIN_QUEUE)
export class UpdateChainConsumer {
  private readonly logger = new Logger(UpdateChainConsumer.name);

  @Process()
  async updateChainQueue(job: Job<UpdateChainQueue>) {
    this.logger.log(`Updating queue | ${job.id}`);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 3000));
    this.logger.log(`Operation completed |  ${job.id}`);
  }
}
