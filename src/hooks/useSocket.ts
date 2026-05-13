import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type MessageHandler = (payload: any) => void;

interface UseSocketReturn {
  connected: boolean;
  subscribe: (destination: string, handler: MessageHandler) => () => void;
  unsubscribe: (destination: string) => void;
}

export function useSocket(): UseSocketReturn {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const subscriptionsRef = useRef<Map<string, { unsubscribe: () => void }>>(new Map());

  useEffect(() => {
    const token = localStorage.getItem('token') || '';

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP Error:', frame.headers['message']);
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current.clear();
      client.deactivate();
    };
  }, []);

  const subscribe = useCallback((destination: string, handler: MessageHandler): () => void => {
    const client = clientRef.current;
    if (!client?.connected) return () => {};

    const subscription = client.subscribe(destination, (message: IMessage) => {
      try {
        handler(JSON.parse(message.body));
      } catch {
        handler(message.body);
      }
    });

    subscriptionsRef.current.set(destination, subscription);
    return () => subscription.unsubscribe();
  }, []);

  const unsubscribe = useCallback((destination: string) => {
    subscriptionsRef.current.get(destination)?.unsubscribe();
    subscriptionsRef.current.delete(destination);
  }, []);

  return { connected, subscribe, unsubscribe };
}
