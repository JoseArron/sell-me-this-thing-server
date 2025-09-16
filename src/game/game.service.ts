import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Type } from '@google/genai';
import { GeminiService } from '../gemini/gemini.service';
import {
  Product,
  Customer,
  GameSession,
  CustomerResponse,
  SalesResult,
  ConversationTurn,
} from '../types/game.types';

@Injectable()
export class GameService {
  private readonly gameSessions = new Map<string, GameSession>();

  constructor(private readonly geminiService: GeminiService) {}

  async generateRandomProduct(): Promise<Product> {
    const prompt = `Generate a random, single, simple, and slightly quirky product name that someone could try to sell. It could be something like "A self-stirring mug", "Unlosable socks", "A pen that writes in three colors at once", "Longganisa". Return the response as JSON with the following structure:
{
  "name": "Product name (keep it concise)",
  "price": number (price in Philippine pesos),
}`;

    const response = await this.geminiService.generateStructuredResponse(
      prompt,
      {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            example: [
              'Unlosable socks',
              'A pen that writes in three colors at once',
              'Wired iron man suit',
              'Longganisa',
            ],
          },
          price: { type: Type.NUMBER },
        },
        required: ['name', 'price'],
      },
    );

    return JSON.parse(response) as Product;
  }

  async generateCustomer(): Promise<Customer> {
    const prompt = `Generate a diverse customer with A funny silly name. It should be a character with personality, interests, and buying behavior. Return the response as JSON with the following structure. You can choose from a wide range of demographics, professions, and lifestyles to create an interesting character. Make sure the description is 1-3 sentences long only. Avoid making the name too long or complicated. The patience should be a number between 3 and 8, representing how many conversation turns they are willing to engage in before they leave.
{
  "name": "Full name example: ['Xi Ai Dol', 'Al Beback', 'Boi Men'],",
  "description": "Brief character description. For example - 'A tech-savvy young professional who loves gadgets and outdoor activities.'", "An Instagram influencer who posts reels about fashion and lifestyle.'",
  "patience": number (must be between 3 and 8, representing conversation turns before they leave),
}`;

    const response = await this.geminiService.generateStructuredResponse(
      prompt,
      {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            example: ['Xi Ai Dol', 'Al Beback', 'Boi Men'],
          },
          description: {
            type: Type.STRING,
            example: [
              'A tech-savvy young professional who loves gadgets and outdoor activities',
              'An Instagram influencer who posts reels about fashion and lifestyle',
            ],
            description:
              'Brief character description should be 1-3 sentences long only',
          },
          patience: { type: Type.NUMBER, minimum: 3, maximum: 8 },
        },
        required: ['name', 'description', 'patience'],
      },
    );

    return JSON.parse(response) as Customer;
  }

  async startGame(product: Product): Promise<GameSession> {
    const customer = await this.generateCustomer();
    const sessionId = uuidv4();

    const gameSession: GameSession = {
      sessionId,
      product,
      customer,
      conversationHistory: [],
      turnsRemaining: customer.patience,
      playerMoney: 0,
      status: 'active',
    };

    this.gameSessions.set(sessionId, gameSession);
    return gameSession;
  }

  async processPlayerMessage(
    sessionId: string,
    message: string,
  ): Promise<CustomerResponse> {
    const session = this.gameSessions.get(sessionId);
    if (!session) {
      throw new Error('Game session not found');
    }

    const playerTurn: ConversationTurn = {
      speaker: 'player',
      message,
      timestamp: new Date(),
    };

    session.conversationHistory.push(playerTurn);

    const customerResponse = await this.generateCustomerResponse(
      session,
      message,
    );

    const customerTurn: ConversationTurn = {
      speaker: 'customer',
      message: customerResponse.message,
      timestamp: new Date(),
    };
    session.conversationHistory.push(customerTurn);

    session.turnsRemaining -= 1;

    // game end check
    if (customerResponse.willBuy) {
      session.status = 'won';
      session.playerMoney += session.product.price;
    } else if (session.turnsRemaining <= 0) {
      session.status = 'lost';
    }

    this.gameSessions.set(sessionId, session);
    return customerResponse;
  }

  private async generateCustomerResponse(
    session: GameSession,
    playerMessage: string,
  ): Promise<CustomerResponse> {
    const conversationHistory = session.conversationHistory
      .map((turn) => `${turn.speaker}: ${turn.message}`)
      .join('\n');

    const prompt = `You are playing as a customer. Here's your character:
- Name: ${session.customer.name}
- Description: ${session.customer.description}
- Patience Remaining: ${session.turnsRemaining} turns

Product being sold to you:
- Name: ${session.product.name}
- Price: $${session.product.price}

Conversation History:
${conversationHistory}

Latest Player Message: "${playerMessage}"

Respond as this customer would, considering:
1. Your lifestyle, interests and personality
2. Whether the player's approach appeals to you
3. If the product matches your needs/interests
4. If you can afford the product
5. Your patience level

Decide if you want to buy the product based on the conversation so far.

Return your response as JSON:
{
  "message": "Your response as the customer (be natural and in character)",
  "willBuy": boolean (true if convinced to buy),
}`;

    const response = await this.geminiService.generateStructuredResponse(
      prompt,
      {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
          willBuy: { type: Type.BOOLEAN },
        },
        required: ['message', 'willBuy'],
      },
    );

    return JSON.parse(response) as CustomerResponse;
  }

  getGameSession(sessionId: string): GameSession | undefined {
    return this.gameSessions.get(sessionId);
  }

  endGame(sessionId: string): SalesResult {
    const session = this.gameSessions.get(sessionId);
    if (!session) {
      throw new Error('Game session not found');
    }

    const result: SalesResult = {
      success: session.status === 'won',
      moneyEarned: session.playerMoney,
      finalMessage:
        session.status === 'won'
          ? `Yey! You successfully sold the ${session.product.name} for $${session.product.price}!`
          : `Nooo! The customer left without buying the ${session.product.name}.`,
      reason: `Here's what they said: "${
        // get last customer message
        session.conversationHistory
          .filter((turn) => turn.speaker === 'customer')
          .slice(-1)[0]?.message
      }"`,
    };

    this.gameSessions.delete(sessionId);
    return result;
  }

  async test(): Promise<string> {
    return this.geminiService.test('Hello world');
  }
}
