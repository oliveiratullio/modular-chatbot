import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Calculator, Brain } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isMobile?: boolean;
}

const suggestedMessages = [
  { text: "Qual a taxa da maquininha?", icon: Brain },
  { text: "Quanto é 65 x 3.11?", icon: Calculator },
  { text: "Posso usar meu telefone como maquininha?", icon: Brain },
];

export function MessageInput({ onSendMessage, disabled, isMobile = false }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="border-t bg-background">
      {showSuggestions && !message && (
        <div className={`border-b bg-muted/20 ${isMobile ? "p-3" : "p-4"}`}>
          <p className={`text-muted-foreground mb-2 ${isMobile ? "text-sm" : "text-xs"}`}>
            Sugestões:
          </p>
          <div className={`${isMobile ? "space-y-2" : "flex flex-wrap gap-2"}`}>
            {suggestedMessages.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size={isMobile ? "sm" : "sm"}
                onClick={() => handleSuggestionClick(suggestion.text)}
                disabled={disabled}
                className={`${isMobile ? "w-full justify-start text-sm" : "text-xs"} h-auto ${isMobile ? "py-3" : "h-8"}`}
              >
                <suggestion.icon className={`${isMobile ? "w-4 h-4" : "w-3 h-3"} mr-2`} />
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`flex gap-2 ${isMobile ? "p-3" : "p-4"}`}>
        <Input
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={
            isMobile ? "Digite sua mensagem..." : "Digite uma pergunta ou cálculo matemático..."
          }
          disabled={disabled}
          className={`flex-1 ${isMobile ? "text-base" : ""}`}
        />
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          className={`shrink-0 ${isMobile ? "h-12 w-12" : ""}`}
        >
          <Send className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
        </Button>
      </form>
    </div>
  );
}
