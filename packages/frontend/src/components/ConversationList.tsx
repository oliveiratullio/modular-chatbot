import { Conversation } from "../types/api";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, MessageCircle, User, ChevronRight } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isMobile?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isMobile = false,
}: ConversationListProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const containerClasses = isMobile
    ? "w-full h-full flex flex-col bg-background"
    : "w-80 border-r bg-card flex flex-col h-full";

  return (
    <div className={containerClasses}>
      {/* Header - desktop */}
      {!isMobile && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Conversas InfinitePay</h2>
            <Button onClick={onNewConversation} size="icon" variant="outline" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>user-123</span>
          </div>
        </div>
      )}

      {/* Nova conversa - mobile */}
      {isMobile && (
        <div className="p-4 border-b bg-card">
          <Button onClick={onNewConversation} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.map((conversation) => {
            const lastMsg = conversation.messages[conversation.messages.length - 1];
            const preview = lastMsg?.content ?? "Nenhuma mensagem ainda";
            const when = conversation.lastMessageAt ?? lastMsg?.timestamp;

            return (
              <Button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                variant={activeConversationId === conversation.id ? "secondary" : "ghost"}
                className={`w-full h-auto justify-start mb-1 text-left ${isMobile ? "p-4" : "p-3"}`}
              >
                <div className="flex items-start gap-3 w-full">
                  <MessageCircle className={`${isMobile ? "w-5 h-5" : "w-4 h-4"} mt-1 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-medium truncate ${isMobile ? "text-base" : "text-sm"}`}
                      >
                        {conversation.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span
                          className={`text-muted-foreground ${isMobile ? "text-sm" : "text-xs"}`}
                        >
                          {when ? formatTime(new Date(when)) : "--:--"}
                        </span>
                        {isMobile && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <p
                      className={`text-muted-foreground truncate ${isMobile ? "text-sm" : "text-xs"}`}
                    >
                      {preview}
                    </p>
                    <div
                      className={`text-muted-foreground mt-1 ${isMobile ? "text-sm" : "text-xs"}`}
                    >
                      {conversation.messages.length} mensagens
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}

          {conversations.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Conversa" para começar
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - desktop */}
      {!isMobile && (
        <div className="p-4 border-t bg-muted/20">
          <div className="text-xs text-muted-foreground text-center">
            <p>Sistema com RouterAgent, KnowledgeAgent e MathAgent</p>
            <p className="mt-1">Experimente perguntas sobre taxas ou cálculos!</p>
          </div>
        </div>
      )}
    </div>
  );
}
