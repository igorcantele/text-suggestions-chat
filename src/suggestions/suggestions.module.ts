import { Module } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { BullModule } from '@nestjs/bull';
import { UPDATE_CHAIN_QUEUE } from './suggestions';

@Module({
  imports: [
    BullModule.registerQueue({
      name: UPDATE_CHAIN_QUEUE,
    }),
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
