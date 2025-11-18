export enum Sender {
  USER = 'USER',
  BOT = 'BOT',
  SYSTEM = 'SYSTEM'
}

export interface MessageImage {
  prompt: string;
  url?: string; // Base64 data URI
  isLoading: boolean;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isStreaming?: boolean;
  images?: MessageImage[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert';
  icon: string;
  initialPrompt: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}