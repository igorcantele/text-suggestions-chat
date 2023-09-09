import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CreateChatDto } from './create-chat.dto';
import { SuggestionsService } from '../suggestions/suggestions.service';

enum EventType {
  NewMessage = 'new_message',
}

@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() chat: CreateChatDto) {
    this.suggestionsService.updateChain(chat.user, chat.msg);
    this.server.emit('onNewMessage', {
      type: EventType.NewMessage,
      msg: chat.msg,
      user: chat.user,
    });
  }
}
