
/// <reference types="vite/client" />

// Additional chat types
interface ChatSession {
  uuid: string;
  title: string;
  created_at: string;
  details: string;
}

interface DetailedChatSession extends ChatSession {
  messages: Message[];
}

