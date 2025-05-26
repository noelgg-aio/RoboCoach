

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  code?: string; // Lua code
  timestamp: number;
  isLoading?: boolean; // For AI message placeholder while generating/streaming
  isError?: boolean; // If message generation resulted in an error
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  // System instruction is global for RoboCoach, but could be per-chat if needed in future
}

export enum ModelType {
  TEXT = 'gemini-2.5-flash-preview-04-17',
  // IMAGE enum member removed
}