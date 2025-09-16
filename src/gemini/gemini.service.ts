import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Schema } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateText(
    prompt: string,
    modelName = 'gemini-2.5-flash',
  ): Promise<string> {
    const response = await this.client.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 0 } }, // disable thinking, faster response
    });
    return response.text ?? '';
  }

  async generateStructuredResponse(
    prompt: string,
    schema: Schema,
    modelName = 'gemini-2.5-flash',
  ): Promise<string> {
    const response = await this.client.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    if (!response.text) {
      throw new Error('No response text received from Gemini');
    }

    return response.text;
  }

  async test(prompt: string, modelName = 'gemini-2.5-flash'): Promise<string> {
    const response = await this.client.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text ?? '';
  }
}
