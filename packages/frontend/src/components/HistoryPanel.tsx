import React, { useEffect } from "react";

import { useHistory } from "../hooks/useHistory";
import "./HistoryPanel.css";

interface HistoryPanelProps {
  userId: string;
  onQuestionSelect: (question: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  userId,
  onQuestionSelect,
  isOpen,
  onClose,
}) => {
  const { questions, loading, error, removeQuestion, clearHistory, refreshHistory } =
    useHistory(userId);

  useEffect(() => {
    if (isOpen && userId) {
      refreshHistory();
    }
  }, [isOpen, userId, refreshHistory]);

  const handleQuestionClick = (question: string) => {
    onQuestionSelect(question);
    onClose();
  };

  const handleRemoveQuestion = async (questionId: string) => {
    await removeQuestion(questionId);
  };

  const handleClearHistory = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o histórico de perguntas?")) {
      return;
    }

    await clearHistory();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="history-panel-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-panel-header">
          <h3>Histórico de Perguntas</h3>
          <div className="history-panel-actions">
            <button
              className="clear-history-btn"
              onClick={handleClearHistory}
              disabled={questions.length === 0}
              title="Limpar todo o histórico"
            >
              🗑️
            </button>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="history-panel-content">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <span>Carregando histórico...</span>
            </div>
          )}

          {error && (
            <div className="error">
              <span>❌ {error}</span>
              <button onClick={refreshHistory}>Tentar novamente</button>
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div className="empty-state">
              <span>📝</span>
              <p>Nenhuma pergunta no histórico ainda.</p>
              <p>Suas perguntas aparecerão aqui!</p>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="questions-list">
              {questions.map((question) => (
                <div key={question.id} className="question-item">
                  <div
                    className="question-content"
                    onClick={() => handleQuestionClick(question.question)}
                    title="Clique para reutilizar esta pergunta"
                  >
                    <p className="question-text">{question.question}</p>
                    <div className="question-meta">
                      <span className="question-date">{formatDate(question.timestamp)}</span>
                      <span className="question-conversation">
                        Conversa: {question.conversation_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <button
                    className="remove-question-btn"
                    onClick={() => handleRemoveQuestion(question.id)}
                    title="Remover pergunta"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
