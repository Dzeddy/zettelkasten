import { useEffect, useRef, useCallback } from 'react';
import { wsService, EventType, EventHandler } from '../services/websocket';

export const useWebSocket = () => {
  const handlersRef = useRef<Map<EventType, EventHandler>>(new Map());

  useEffect(() => {
    // Connect when component mounts
    wsService.connect();

    // Cleanup function
    return () => {
      // Capture the current ref value
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentHandlers = handlersRef.current;
      // Remove all handlers when component unmounts
      currentHandlers.forEach((handler, eventType) => {
        wsService.off(eventType, handler);
      });
      currentHandlers.clear();
    };
  }, []);

  const on = useCallback((eventType: EventType, handler: EventHandler) => {
    // Store the handler reference
    handlersRef.current.set(eventType, handler);
    wsService.on(eventType, handler);
  }, []);

  const off = useCallback((eventType: EventType) => {
    const handler = handlersRef.current.get(eventType);
    if (handler) {
      wsService.off(eventType, handler);
      handlersRef.current.delete(eventType);
    }
  }, []);

  const isConnected = useCallback(() => {
    return wsService.isConnected();
  }, []);

  return { on, off, isConnected };
}; 