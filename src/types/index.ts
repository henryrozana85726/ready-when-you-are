export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}
