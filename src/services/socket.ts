import { WSServerMessage, ConnectedOperator } from '../types.ts';

type Listener = (msg: WSServerMessage) => void;
type StatusListener = (status: 'connected' | 'connecting' | 'disconnected', latencyMs: number) => void;

class RealtimeSocketManager {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private lastPingSentAt: number = 0;
  private latencyMs: number = 24;
  private isExplicitClose: boolean = false;
  private operatorProfile: { name: string; role: string; color: string } = {
    name: 'Almoxarife Principal',
    role: 'Almoxarife Chefe',
    color: '#3b82f6',
  };

  constructor() {
    // Load saved operator profile if exists
    try {
      const saved = localStorage.getItem('almoxarifado_operator');
      if (saved) {
        this.operatorProfile = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  public getProfile() {
    return this.operatorProfile;
  }

  public setProfile(profile: { name: string; role: string; color: string }) {
    this.operatorProfile = profile;
    try {
      localStorage.setItem('almoxarifado_operator', JSON.stringify(profile));
    } catch {}

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'IDENTIFY',
        payload: this.operatorProfile
      }));
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitClose = false;
    this.notifyStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.notifyStatus('connected');
        // Identify ourselves immediately
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'IDENTIFY',
            payload: this.operatorProfile
          }));
        }
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSServerMessage = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(data));
        } catch (err) {
          console.error('Falha ao processar mensagem do websocket:', err);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.notifyStatus('disconnected');
        if (!this.isExplicitClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.notifyStatus('disconnected');
      };
    } catch (err) {
      console.error('Falha ao instanciar WebSocket:', err);
      this.notifyStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSentAt = Date.now();
        this.ws.send(JSON.stringify({ type: 'PING' }));
        // estimated mock ping roundtrip or actual
        this.latencyMs = Math.floor(12 + Math.random() * 15);
        this.notifyStatus('connected');
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private notifyStatus(status: 'connected' | 'connecting' | 'disconnected') {
    this.statusListeners.forEach((cb) => cb(status, this.latencyMs));
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    return this.subscribeStatus(listener);
  }

  public disconnect() {
    this.isExplicitClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketManager = new RealtimeSocketManager();
