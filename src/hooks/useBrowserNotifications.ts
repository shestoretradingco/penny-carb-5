import { useState, useEffect, useCallback } from 'react';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[Notifications] Browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('[Notifications] Permission result:', result);
      return result === 'granted';
    } catch (error) {
      console.error('[Notifications] Error requesting permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported) {
      console.warn('[Notifications] Browser does not support notifications');
      return null;
    }

    if (permission !== 'granted') {
      console.warn('[Notifications] Permission not granted, current:', permission);
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      console.log('[Notifications] Notification shown:', options.title);
      return notification;
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  // Convenience methods for common notification types
  const notifyNewOrder = useCallback((orderNumber: string, serviceType: string, onClick?: () => void) => {
    return showNotification({
      title: '🔔 New Order Assigned!',
      body: `Order #${orderNumber} (${serviceType.replace('_', ' ')}) needs your attention`,
      tag: `new-order-${orderNumber}`,
      requireInteraction: true,
      onClick,
    });
  }, [showNotification]);

  const notifyOrderAccepted = useCallback((orderNumber: string, onClick?: () => void) => {
    return showNotification({
      title: '✅ Order Accepted',
      body: `Order #${orderNumber} has been accepted`,
      tag: `order-accepted-${orderNumber}`,
      onClick,
    });
  }, [showNotification]);

  const notifyOrderReady = useCallback((orderNumber: string, onClick?: () => void) => {
    return showNotification({
      title: '🍳 Order Ready for Pickup!',
      body: `Order #${orderNumber} is ready for delivery`,
      tag: `order-ready-${orderNumber}`,
      requireInteraction: true,
      onClick,
    });
  }, [showNotification]);

  const notifyOrderPickedUp = useCallback((orderNumber: string, onClick?: () => void) => {
    return showNotification({
      title: '🚚 Order Picked Up',
      body: `Order #${orderNumber} is out for delivery`,
      tag: `order-pickup-${orderNumber}`,
      onClick,
    });
  }, [showNotification]);

  const notifyOrderDelivered = useCallback((orderNumber: string, onClick?: () => void) => {
    return showNotification({
      title: '🎉 Order Delivered!',
      body: `Order #${orderNumber} has been successfully delivered`,
      tag: `order-delivered-${orderNumber}`,
      onClick,
    });
  }, [showNotification]);

  const notifyOrderRejected = useCallback((orderNumber: string, onClick?: () => void) => {
    return showNotification({
      title: '❌ Order Rejected',
      body: `Order #${orderNumber} has been rejected`,
      tag: `order-rejected-${orderNumber}`,
      onClick,
    });
  }, [showNotification]);

  const notifyOrderTaken = useCallback((orderNumber: string, onClick?: () => void) => {
    return showNotification({
      title: '⚡ Order Taken',
      body: `Order #${orderNumber} was accepted by another driver`,
      tag: `order-taken-${orderNumber}`,
      onClick,
    });
  }, [showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    // Convenience methods
    notifyNewOrder,
    notifyOrderAccepted,
    notifyOrderReady,
    notifyOrderPickedUp,
    notifyOrderDelivered,
    notifyOrderRejected,
    notifyOrderTaken,
  };
}
