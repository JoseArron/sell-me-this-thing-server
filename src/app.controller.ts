import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GeminiService } from './gemini/gemini.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('generate')
  async generateText(): Promise<string> {
    const prompt = 'tell me something cool';
    return this.geminiService.generateText(prompt);
  }
}
