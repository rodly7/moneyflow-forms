import { memo } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut } from "lucide-react";
import NotificationSystem from "@/components/notifications/NotificationSystem";

interface CompactHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onRefresh?: () => void;
  onSignOut: () => void;
  isLoading?: boolean;
  showNotifications?: boolean;
}

const CompactHeader = memo(({ 
  title, 
  subtitle, 
  icon, 
  onRefresh, 
  onSignOut, 
  isLoading = false,
  showNotifications = true 
}: CompactHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showNotifications && <NotificationSystem />}
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSignOut}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

CompactHeader.displayName = 'CompactHeader';

export default CompactHeader;