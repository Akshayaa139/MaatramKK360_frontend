import io, { Socket } from 'socket.io-client';
import { getSession } from 'next-auth/react';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.initializeSocket();
  }

  private async initializeSocket() {
    try {
      let token: string | undefined;

      // 1. Try sessionStorage first (for multi-tab support)
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("token");
        if (stored) token = stored;
      }

      // 2. Fallback to next-auth session
      if (!token) {
        const session = await getSession();
        if (session?.accessToken) {
          token = session.accessToken;
        }
      }

      if (!token) {
        console.log('No access token available, socket will be initialized on login');
        return;
      }

      this.connect(token);
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  public connect(token: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitConnectionStatus(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emitConnectionStatus(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Chat events
    this.socket.on('new_message', (data) => {
      this.emitMessage('new_message', data);
    });

    this.socket.on('message_read', (data) => {
      this.emitMessage('message_read', data);
    });

    this.socket.on('user_typing', (data) => {
      this.emitMessage('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.emitMessage('user_stop_typing', data);
    });

    this.socket.on('message_edited', (data) => {
      this.emitMessage('message_edited', data);
    });

    this.socket.on('message_deleted', (data) => {
      this.emitMessage('message_deleted', data);
    });

    // User status events
    this.socket.on('user_online', (data) => {
      this.emitMessage('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emitMessage('user_offline', data);
    });
  }

  private handleReconnect() {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emitConnectionStatus(false);
    }
  }

  private emitConnectionStatus(connected: boolean) {
    window.dispatchEvent(new CustomEvent('socket_connection_status', { 
      detail: { connected } 
    }));
  }

  private emitMessage(event: string, data: unknown) {
    window.dispatchEvent(new CustomEvent(`socket_${event}`, { detail: data }));
  }

  // Public methods
  public joinConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  public leaveConversation(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  public sendMessage(data: {
    conversationId: string;
    content: string;
    messageType?: 'text' | 'file' | 'image';
    replyTo?: string;
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', data);
    }
  }

  public markAsRead(messageId: string, conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_as_read', { messageId, conversationId });
    }
  }

  public startTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { conversationId });
    }
  }

  public stopTyping(conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stop_typing', { conversationId });
    }
  }

  public editMessage(messageId: string, content: string, conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit_message', { messageId, content, conversationId });
    }
  }

  public deleteMessage(messageId: string, conversationId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_message', { messageId, conversationId });
    }
  }

  public getConversationHistory(conversationId: string, limit: number = 50, before?: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_conversation_history', { conversationId, limit, before });
    }
  }

  public getOnlineUsers() {
    if (this.socket && this.isConnected) {
      this.socket.emit('get_online_users');
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;