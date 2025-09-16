import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GameService } from './game.service';

import type {
  PlayerMessageDto,
  Product,
  GameSession,
  CustomerResponse,
  SalesResult,
} from '../types/game.types';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('random-product')
  async generateRandomProduct(): Promise<Product> {
    try {
      return await this.gameService.generateRandomProduct();
    } catch {
      throw new HttpException(
        'Failed to generate random product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('start')
  async startGame(@Body() product: Product): Promise<GameSession> {
    try {
      return await this.gameService.startGame(product);
    } catch {
      throw new HttpException(
        'Failed to start game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:sessionId')
  getGameSession(@Param('sessionId') sessionId: string): GameSession {
    const session = this.gameService.getGameSession(sessionId);
    if (!session) {
      throw new HttpException('Game session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }

  @Post('message')
  async sendMessage(
    @Body() playerMessageDto: PlayerMessageDto,
  ): Promise<CustomerResponse> {
    try {
      return await this.gameService.processPlayerMessage(
        playerMessageDto.sessionId,
        playerMessageDto.message,
      );
    } catch {
      throw new HttpException(
        'Failed to process your message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('end/:sessionId')
  endGame(@Param('sessionId') sessionId: string): SalesResult {
    try {
      return this.gameService.endGame(sessionId);
    } catch {
      throw new HttpException(
        'Failed to end game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test')
  test(): Promise<string> {
    return this.gameService.test();
  }
}
