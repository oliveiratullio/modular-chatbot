import { useEffect, useRef, useMemo } from "react";
import { Conversation, HistoryQuestion } from "../types/api";
import { Message } from "./Message";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { MessageCircle, Brain, Calculator, Route } from "lucide-react";
import { useHistory } from "../hooks/useHistory";
import { useConversationHistory } from "../hooks/useConversationHistory";

// Função para gerar respostas mockadas mais realistas
function generateMockResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (lowerQuestion.includes("taxa") || lowerQuestion.includes("maquininha")) {
    return "As taxas da maquininha da InfinitePay variam conforme o tipo de transação:\n\n• Débito: 1,99%\n• Crédito à vista: 2,99%\n• Crédito parcelado: 3,99% + juros\n\nPara mais informações sobre taxas específicas, entre em contato com nosso suporte.";
  }

  if (
    lowerQuestion.includes("quanto é") ||
    lowerQuestion.includes("calcular") ||
    lowerQuestion.includes("×") ||
    lowerQuestion.includes("*")
  ) {
    // Extrai números da pergunta para fazer o cálculo
    const numbers = question.match(/\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 2) {
      const num1 = parseFloat(numbers[0] || "0");
      const num2 = parseFloat(numbers[1] || "0");
      const result = num1 * num2;
      return `O resultado de ${num1} × ${num2} é ${result.toFixed(2)}.`;
    }
    return "Posso ajudar com cálculos matemáticos! Por favor, forneça os números que deseja calcular.";
  }

  if (
    lowerQuestion.includes("telefone") ||
    lowerQuestion.includes("celular") ||
    lowerQuestion.includes("app")
  ) {
    return "Sim! Você pode usar seu telefone como maquininha através do nosso aplicativo InfinitePay Mobile. O app permite:\n\n• Aceitar pagamentos por PIX\n• Gerar boletos\n• Consultar vendas\n• Emitir relatórios\n\nBaixe o app na App Store ou Google Play.";
  }

  if (lowerQuestion.includes("produto") || lowerQuestion.includes("serviço")) {
    return "A InfinitePay oferece diversos produtos e serviços:\n\n• Maquininhas de cartão\n• Gateway de pagamento\n• PIX\n• Boletos bancários\n• Antecipação de recebíveis\n\nGostaria de saber mais sobre algum produto específico?";
  }

  if (
    lowerQuestion.includes("suporte") ||
    lowerQuestion.includes("ajuda") ||
    lowerQuestion.includes("contato")
  ) {
    return "Nossa equipe de suporte está disponível:\n\n• WhatsApp: (11) 99999-9999\n• Email: suporte@infinitepay.com.br\n• Chat online: 24h\n• Telefone: (11) 3000-0000 (8h às 18h)\n\nComo posso ajudá-lo hoje?";
  }

  // Resposta genérica para outras perguntas
  return `Obrigado pela sua pergunta: "${question}"\n\nNossa equipe de especialistas está trabalhando para fornecer a melhor resposta. Para informações mais específicas, entre em contato com nosso suporte através do WhatsApp ou chat online.`;
}

// Função para gerar workflow de agentes baseado na pergunta
function generateAgentWorkflow(
  question: string,
): Array<{
  agent: "RouterAgent" | "KnowledgeAgent" | "MathAgent";
  decision?: "KnowledgeAgent" | "MathAgent";
}> {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes("quanto é") ||
    lowerQuestion.includes("calcular") ||
    lowerQuestion.includes("×") ||
    lowerQuestion.includes("*")
  ) {
    return [{ agent: "RouterAgent", decision: "MathAgent" }, { agent: "MathAgent" }];
  }

  if (
    lowerQuestion.includes("taxa") ||
    lowerQuestion.includes("maquininha") ||
    lowerQuestion.includes("produto") ||
    lowerQuestion.includes("telefone")
  ) {
    return [{ agent: "RouterAgent", decision: "KnowledgeAgent" }, { agent: "KnowledgeAgent" }];
  }

  // Workflow padrão
  return [{ agent: "RouterAgent", decision: "KnowledgeAgent" }, { agent: "KnowledgeAgent" }];
}

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isMobile?: boolean;
}

export function ChatArea({
  conversation,
  onSendMessage,
  isLoading,
  isMobile = false,
}: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Usa os hooks de histórico com o userId da conversa
  const conversationUserId = conversation?.user_id || "";
  const { questions: historyQuestions, refreshHistory } = useHistory(conversationUserId);
  const { conversations: historyConversations, refreshConversationHistory } =
    useConversationHistory(conversationUserId);

  // Combina conversas do histórico com a conversa atual
  const conversationWithHistory = useMemo(() => {
    if (!conversation) {
      return conversation;
    }

    // Se não há conversas do histórico, tenta usar as perguntas do histórico
    if (historyConversations.length === 0 && historyQuestions.length > 0) {
      // APENAS mostra mensagens do histórico que pertencem à conversa atual
      const currentConversationQuestions = historyQuestions.filter(
        (q) => q.conversation_id === conversation.id,
      );

      // Se não há perguntas para esta conversa específica, retorna a conversa original
      if (currentConversationQuestions.length === 0) {
        return conversation;
      }

      const historyMessages = currentConversationQuestions
        .map((question: HistoryQuestion) => {
          const questionTimestamp = new Date(question.timestamp);
          const responseTimestamp = new Date(questionTimestamp.getTime() + 2000); // Resposta 2 segundos depois

          return [
            // Pergunta do usuário
            {
              id: `history-question-${question.id}`,
              content: question.question,
              isUser: true,
              timestamp: questionTimestamp,
              isFromHistory: true,
              originalConversationId: question.conversation_id,
              originalConversationTitle: `Conversa ${question.conversation_id.slice(0, 8)}`,
            },
            // Resposta mockada do assistente
            {
              id: `history-response-${question.id}`,
              content: generateMockResponse(question.question),
              isUser: false,
              timestamp: responseTimestamp,
              isFromHistory: true,
              originalConversationId: question.conversation_id,
              originalConversationTitle: `Conversa ${question.conversation_id.slice(0, 8)}`,
              agentWorkflow: generateAgentWorkflow(question.question),
            },
          ];
        })
        .flat();

      // Combina mensagens do histórico com mensagens da conversa atual
      const allMessages = [...historyMessages, ...conversation.messages];

      // Ordena por timestamp
      allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return {
        ...conversation,
        messages: allMessages,
      };
    }

    // Se não há conversas do histórico, retorna a conversa atual
    if (historyConversations.length === 0) {
      return conversation;
    }

    // Se há conversas do histórico, verifica se a conversa atual tem mensagens do histórico
    const currentConversationFromHistory = historyConversations.find(
      (c) => c.id === conversation.id,
    );
    if (currentConversationFromHistory) {
      return currentConversationFromHistory;
    }

    // Se não encontrou a conversa no histórico, retorna a conversa original
    return conversation;
  }, [conversation, historyConversations, historyQuestions]);

  // Recarrega o histórico quando uma mensagem é enviada (apenas uma vez por mudança)
  useEffect(() => {
    if (conversation?.messages.length && conversation.messages.length > 0) {
      // Pequeno delay para garantir que a mensagem foi salva no backend
      const timer = setTimeout(() => {
        refreshHistory();
        refreshConversationHistory();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [conversation?.messages.length]); // Removido refreshHistory da dependência

  // Scroll automático para mostrar mensagem mais recente
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]",
        );
        if (scrollElement) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    // Timeout para garantir que o DOM foi atualizado completamente
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [conversationWithHistory?.messages, isLoading]);

  if (!conversationWithHistory) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <MessageCircle
            className={`${isMobile ? "w-16 h-16" : "w-12 h-12"} text-muted-foreground mx-auto mb-4`}
          />
          <h3 className={`font-medium mb-2 ${isMobile ? "text-lg" : ""}`}>
            {isMobile ? "Selecione uma conversa" : "Selecione uma conversa"}
          </h3>
          <p className={`text-muted-foreground mb-6 ${isMobile ? "text-base" : "text-sm"}`}>
            {isMobile
              ? "Volte à lista e escolha uma conversa para começar a interagir com os agentes"
              : "Escolha uma conversa da lista para começar a interagir com os agentes da InfinitePay"}
          </p>

          <div className="space-y-3">
            <h4 className={`font-medium ${isMobile ? "text-base" : "text-sm"}`}>
              Agentes disponíveis:
            </h4>
            <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-2 justify-center`}>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Route className="w-3 h-3 mr-1" />
                RouterAgent
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Brain className="w-3 h-3 mr-1" />
                KnowledgeAgent
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Calculator className="w-3 h-3 mr-1" />
                MathAgent
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header - apenas no desktop, no mobile é tratado pelo MobileHeader */}
      {!isMobile && (
        <div className="p-4 border-b bg-card shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{conversationWithHistory.title}</h2>
              <p className="text-sm text-muted-foreground">
                {conversationWithHistory.messages.length} mensagens • ID:{" "}
                {conversationWithHistory.id}
              </p>
            </div>

            <div className="flex gap-1 items-center">
              <Badge variant="outline" className="text-xs">
                <Route className="w-3 h-3 mr-1" />
                Router
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Brain className="w-3 h-3 mr-1" />
                Knowledge
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Calculator className="w-3 h-3 mr-1" />
                Math
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className={`flex-1 min-h-0 ${isMobile ? "p-3" : "p-4"}`}>
        <div className="space-y-1">
          {conversationWithHistory.messages.length === 0 && (
            <div className={`text-center ${isMobile ? "py-6" : "py-8"}`}>
              <p className={`text-muted-foreground mb-4 ${isMobile ? "text-base" : ""}`}>
                Inicie uma conversa! Você pode:
              </p>
              <div
                className={`space-y-2 text-muted-foreground ${isMobile ? "text-sm" : "text-sm"}`}
              >
                <p>• Perguntar sobre taxas: "Qual a taxa da maquininha?"</p>
                <p>• Fazer cálculos: "Quanto é 65 x 3.11?"</p>
                <p>• Perguntar sobre produtos: "Posso usar meu telefone como maquininha?"</p>
              </div>
            </div>
          )}

          {conversationWithHistory.messages.map((message) => (
            <Message key={message.id} message={message} isMobile={isMobile} />
          ))}

          {isLoading && (
            <div className={`flex items-center gap-3 mb-4 ${isMobile ? "px-1" : ""}`}>
              <div
                className={`${isMobile ? "w-10 h-10" : "w-8 h-8"} bg-secondary rounded-full flex items-center justify-center`}
              >
                <Brain className={`${isMobile ? "w-5 h-5" : "w-4 h-4"} animate-pulse`} />
              </div>
              <div className="bg-card border rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <span
                    className={`text-muted-foreground ml-2 ${isMobile ? "text-sm" : "text-sm"}`}
                  >
                    Processando...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="shrink-0">
        <MessageInput onSendMessage={onSendMessage} disabled={isLoading} isMobile={isMobile} />
      </div>
    </div>
  );
}
