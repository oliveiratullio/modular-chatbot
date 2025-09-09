import { useState, useEffect, useCallback } from "react";
import { chatService } from "../services/chatService";
import type { Conversation } from "../types/api";

export function useConversationHistory(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversationHistory = async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const conversationHistory = await chatService.getConversationHistory(userId, 7);
      setConversations(conversationHistory);
    } catch (err) {
      // Se for erro 404, não é um erro real - o endpoint não existe
      if (err instanceof Error && err.message.includes("404")) {
        setError(null);
      } else {
        setError("Erro ao carregar conversas do histórico");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshConversationHistory = useCallback(() => {
    loadConversationHistory();
  }, [userId]);

  // Carrega o histórico automaticamente quando o userId muda
  useEffect(() => {
    if (userId) {
      loadConversationHistory();
    }
  }, [userId]);

  return {
    conversations,
    loading,
    error,
    refreshConversationHistory,
  };
}
