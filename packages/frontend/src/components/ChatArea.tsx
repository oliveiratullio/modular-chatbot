import { useEffect, useRef } from "react";
import { Conversation } from "../types/api";
import { Message } from "./Message";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { MessageCircle, Brain, Calculator, Route } from "lucide-react";

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

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [conversation?.messages]);

  if (!conversation) {
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
    <div className="flex-1 flex flex-col h-full">
      {/* Header - apenas no desktop, no mobile é tratado pelo MobileHeader */}
      {!isMobile && (
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{conversation.title}</h2>
              <p className="text-sm text-muted-foreground">
                {conversation.messages.length} mensagens • ID: {conversation.id}
              </p>
            </div>

            <div className="flex gap-1">
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
      <ScrollArea ref={scrollAreaRef} className={`flex-1 ${isMobile ? "p-3" : "p-4"}`}>
        <div className="space-y-1">
          {conversation.messages.length === 0 && (
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

          {conversation.messages.map((message) => (
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
      <MessageInput onSendMessage={onSendMessage} disabled={isLoading} isMobile={isMobile} />
    </div>
  );
}
