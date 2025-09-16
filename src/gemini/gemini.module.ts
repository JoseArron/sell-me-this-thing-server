import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [GeminiService],
  imports: [ConfigModule.forRoot()],
  exports: [GeminiService],
})
export class GeminiModule {}
