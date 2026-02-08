import React from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';

interface NotificationPermissionBannerProps {
  onDismiss?: () => void;
}

const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({ onDismiss }) => {
  const { isSupported, permission, requestPermission } = useBrowserNotifications();

  // Don't show if not supported, already granted, or denied
  if (!isSupported || permission === 'granted') {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-3">
        <BellOff className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">Notifications Blocked</p>
          <p className="text-xs text-muted-foreground">
            Enable notifications in your browser settings to receive order alerts
          </p>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  const handleEnable = async () => {
    await requestPermission();
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
      <Bell className="h-5 w-5 text-primary shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Enable Notifications</p>
        <p className="text-xs text-muted-foreground">
          Get instant alerts for new orders and status updates
        </p>
      </div>
      <Button size="sm" onClick={handleEnable}>
        Enable
      </Button>
      {onDismiss && (
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onDismiss}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default NotificationPermissionBanner;
