import { Message as MessageType } from "../types/api";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Clock, Link as LinkIcon, Brain, Calculator, Route } from "lucide-react";

interface MessageProps {
  message: MessageType;
  isMobile?: boolean;
}

export function Message({ message, isMobile = false }: MessageProps) {
  const { content, isUser, agentWorkflow, sourceAgentResponse, timestamp } = message;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAgentIcon = (agent: string) => {
    const iconSize = isMobile ? "w-4 h-4" : "w-3 h-3";
    switch (agent) {
      case "RouterAgent":
        return <Route className={iconSize} />;
      case "KnowledgeAgent":
        return <Brain className={iconSize} />;
      case "MathAgent":
        return <Calculator className={iconSize} />;
      default:
        return <Brain className={iconSize} />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "RouterAgent":
        return "bg-blue-100 text-blue-800";
      case "KnowledgeAgent":
        return "bg-green-100 text-green-800";
      case "MathAgent":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // mensagem do usuário (direita)
  if (isUser) {
    return (
      <div className={`flex justify-end ${isMobile ? "mb-3" : "mb-4"}`}>
        <div
          className={`${isMobile ? "max-w-[85%]" : "max-w-[70%]"} bg-primary text-primary-foreground rounded-lg px-4 py-2`}
        >
          <p className="break-words">{content}</p>
          <span className={`opacity-70 mt-1 block ${isMobile ? "text-xs" : "text-xs"}`}>
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // agente final = primeiro passo que não é Router
  const finalAgent = agentWorkflow?.find((step) => step.agent !== "RouterAgent");

  // fontes: string "url1 | url2 | ..." → string[]
  const sources =
    (sourceAgentResponse ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean) || [];

  return (
    <div className={`flex items-start gap-3 ${isMobile ? "mb-3" : "mb-4"}`}>
      <Avatar className={`${isMobile ? "w-10 h-10" : "w-8 h-8"} mt-1`}>
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
          {finalAgent ? (
            getAgentIcon(finalAgent.agent)
          ) : (
            <Brain className={isMobile ? "w-4 h-4" : "w-3 h-3"} />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 ${isMobile ? "max-w-[85%]" : "max-w-[70%]"}`}>
        <div className="bg-card border rounded-lg px-4 py-2">
          <p className="break-words whitespace-pre-wrap">{content}</p>

          {/* Fontes colapsáveis (apenas em respostas do assistente) */}
          {sources.length > 0 && (
            <details className={`mt-2 ${isMobile ? "text-sm" : "text-xs"}`}>
              <summary className="cursor-pointer text-muted-foreground">Fontes</summary>
              <ul className="list-disc pl-5 mt-1">
                {sources.map((u, idx) => (
                  <li key={`${u}-${idx}`}>
                    <a
                      className="underline inline-flex items-center gap-1"
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <LinkIcon className={isMobile ? "w-4 h-4" : "w-3 h-3"} />
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {/* Agent Workflow */}
        {agentWorkflow && agentWorkflow.length > 0 && (
          <Card className={`${isMobile ? "mt-3" : "mt-2"} bg-muted/50`}>
            <CardContent className={isMobile ? "p-4" : "p-3"}>
              <div className="space-y-2">
                <h4
                  className={`font-medium text-muted-foreground ${isMobile ? "text-sm" : "text-xs"}`}
                >
                  Workflow dos Agentes:
                </h4>

                <div className={`flex ${isMobile ? "flex-col space-y-2" : "flex-wrap"} gap-1`}>
                  {agentWorkflow.map((step, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className={`${isMobile ? "text-sm w-fit" : "text-xs"} ${getAgentColor(step.agent)} inline-flex items-center gap-1`}
                    >
                      {getAgentIcon(step.agent)}
                      <span>{step.agent}</span>
                      {step.decision && <span>→ {step.decision}</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rodapé com agente e hora */}
        <div className={`flex items-center gap-2 mt-1 ${isMobile ? "text-sm" : "text-xs"}`}>
          <span className="text-muted-foreground">{finalAgent?.agent || "Assistente"}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Clock className={isMobile ? "w-4 h-4" : "w-3 h-3"} />
            {formatTime(timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
