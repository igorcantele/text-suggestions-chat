import { Controller, Get, Param } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get(':word')
  async findSuggesionts(@Param('word') word: string) {
    return this.suggestionsService.findSuggesionts(word);
  }
}
