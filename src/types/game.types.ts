export interface PlayerMessageDto {
  sessionId: string;
  message: string;
}

export interface Product {
  name: string;
  price: number;
}

export interface Customer {
  name: string;
  description: string;
  patience: number; // number of turns before customer leaves
}

export interface GameSession {
  sessionId: string;
  product: Product;
  customer: Customer;
  conversationHistory: ConversationTurn[];
  turnsRemaining: number;
  playerMoney: number;
  status: 'active' | 'won' | 'lost';
}

export interface ConversationTurn {
  speaker: 'player' | 'customer';
  message: string;
  timestamp: Date;
}

export interface SalesResult {
  success: boolean;
  moneyEarned: number;
  finalMessage: string;
  reason: string;
}

export interface CustomerResponse {
  message: string;
  willBuy: boolean;
}
