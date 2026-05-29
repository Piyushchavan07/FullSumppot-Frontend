import { useEffect, useRef } from 'react';
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { HUB_URL } from '../config';

export function useSignalR() {
  const qc = useQueryClient();
  // Subscribe to Zustand state so the effect re-runs on login/logout
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    // Tear down any existing connection first (handles token rotation / logout)
    const existing = connectionRef.current;
    if (existing && existing.state !== HubConnectionState.Disconnected) {
      existing.stop();
      connectionRef.current = null;
    }

    // Nothing to do when logged out
    if (!isAuthenticated || !token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('NewMessage', () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['unreadMessages'] });
    });

    connection.on('NewNotification', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    connection.start().catch((err) => {
      console.warn('SignalR connection failed, falling back to polling:', err);
    });

    return () => {
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop();
      }
      connectionRef.current = null;
    };
  // Re-run whenever auth state changes (login / logout / token refresh)
  }, [qc, token, isAuthenticated]);

  return connectionRef;
}
