import { Module } from '@nestjs/common';
import { ChatGateway } from './chat-gateway';
import { SuggestionsModule } from '../suggestions/suggestions.module';

@Module({
  imports: [SuggestionsModule],
  providers: [ChatGateway],
})
export class ChatModule {}
