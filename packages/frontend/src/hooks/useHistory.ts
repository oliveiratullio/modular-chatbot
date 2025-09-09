import { useState, useEffect, useCallback } from "react";
import { chatService } from "../services/chatService";
import type { HistoryQuestion } from "../types/api";

export function useHistory(userId: string) {
  const [questions, setQuestions] = useState<HistoryQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedUserId, setLastLoadedUserId] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!userId) {
      return;
    }

    // Evita carregar o mesmo userId múltiplas vezes
    if (lastLoadedUserId === userId && questions.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const historyQuestions = await chatService.getHistory(userId, 50);
      setQuestions(historyQuestions);
      setLastLoadedUserId(userId);
    } catch (err) {
      setError("Erro ao carregar histórico");
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      const success = await chatService.removeQuestion(userId, questionId);
      if (success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch (err) {
      console.error("Erro ao remover pergunta:", err);
    }
  };

  const clearHistory = async () => {
    try {
      const success = await chatService.clearHistory(userId);
      if (success) {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Erro ao limpar histórico:", err);
    }
  };

  const refreshHistory = useCallback(() => {
    setLastLoadedUserId(null); // Força recarregamento
    loadHistory();
  }, [userId]); // userId como dependência para recriar quando necessário

  // Carrega o histórico automaticamente quando o userId muda
  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  return {
    questions,
    loading,
    error,
    removeQuestion,
    clearHistory,
    refreshHistory,
  };
}
