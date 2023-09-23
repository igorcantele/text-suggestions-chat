import { Module } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { BullModule } from '@nestjs/bull';
import { UPDATE_CHAIN_QUEUE } from './suggestions';
import { UpdateChainConsumer } from './update_chain_consumer';
import { Suggestion } from './entities/suggestion.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suggestion]),
    BullModule.registerQueue({
      name: UPDATE_CHAIN_QUEUE,
    }),
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, UpdateChainConsumer],
  exports: [SuggestionsService],
})
export class SuggestionsModule {}
