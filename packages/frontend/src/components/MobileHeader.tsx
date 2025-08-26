import { Button } from "./ui/button";
import { ArrowLeft, Menu } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  subtitle?: string;
}

export function MobileHeader({
  title,
  showBackButton,
  onBackClick,
  onMenuClick,
  subtitle,
}: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-3">
        {showBackButton && onBackClick && (
          <Button variant="ghost" size="icon" onClick={onBackClick} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        <div>
          <h1 className="font-medium">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {onMenuClick && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8">
          <Menu className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
