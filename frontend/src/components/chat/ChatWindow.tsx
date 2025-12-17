'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  Info,
  Edit3,
  Trash2,
  Reply,
  Check,
  CheckCheck
} from 'lucide-react';
import socketService from '@/services/socketService';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
  messageType: 'text' | 'file' | 'image' | 'system';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  replyTo?: Message;
  edited?: boolean;
  editedAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  participants: Array<{
    userId: string;
    fullName: string;
    role: string;
  }>;
  type: 'application' | 'televerification' | 'panel';
  relatedId: string;
}

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  onClose?: () => void;
}

export default function ChatWindow({ conversation, currentUserId, onClose }: ChatWindowProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (conversation?.id) {
      loadMessages();
      socketService.joinConversation(conversation.id);
      setupSocketListeners();
    }

    return () => {
      if (conversation?.id) {
        socketService.leaveConversation(conversation.id);
      }
      cleanupSocketListeners();
    };
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocketListeners = () => {
    window.addEventListener('socket_new_message', handleNewMessage as EventListener);
    window.addEventListener('socket_user_typing', handleUserTyping as EventListener);
    window.addEventListener('socket_user_stop_typing', handleUserStopTyping as EventListener);
    window.addEventListener('socket_message_read', handleMessageRead as EventListener);
    window.addEventListener('socket_message_edited', handleMessageEdited as EventListener);
    window.addEventListener('socket_message_deleted', handleMessageDeleted as EventListener);
  };

  const cleanupSocketListeners = () => {
    window.removeEventListener('socket_new_message', handleNewMessage as EventListener);
    window.removeEventListener('socket_user_typing', handleUserTyping as EventListener);
    window.removeEventListener('socket_user_stop_typing', handleUserStopTyping as EventListener);
    window.removeEventListener('socket_message_read', handleMessageRead as EventListener);
    window.removeEventListener('socket_message_edited', handleMessageEdited as EventListener);
    window.removeEventListener('socket_message_deleted', handleMessageDeleted as EventListener);
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chat/messages/${conversation.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (event: CustomEvent) => {
    const message = event.detail;
    if (message.conversationId === conversation.id) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if it's not from current user
      if (message.sender.id !== currentUserId) {
        setTimeout(() => {
          socketService.markAsRead(message.id, conversation.id);
        }, 1000);
      }
    }
  };

  const handleUserTyping = (event: CustomEvent) => {
    const { userId, fullName, conversationId } = event.detail;
    if (conversationId === conversation.id && userId !== currentUserId) {
      setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
    }
  };

  const handleUserStopTyping = (event: CustomEvent) => {
    const { userId, conversationId } = event.detail;
    if (conversationId === conversation.id) {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleMessageRead = (event: CustomEvent) => {
    const { messageId } = event.detail;
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'read' } : msg
    ));
  };

  const handleMessageEdited = (event: CustomEvent) => {
    const { messageId, content, editedAt } = event.detail;
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, content, edited: true, editedAt } : msg
    ));
  };

  const handleMessageDeleted = (event: CustomEvent) => {
    const { messageId } = event.detail;
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: newMessage,
          messageType: 'text',
          replyTo: replyingTo?.id,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setReplyingTo(null);
        socketService.stopTyping(conversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping && conversation?.id) {
      setIsTyping(true);
      socketService.startTyping(conversation.id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.stopTyping(conversation.id);
      }, 1000);
    }
  };

  const editMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      if (response.ok) {
        setEditingMessage(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const isMessageFromCurrentUser = (message: Message) => {
    return message.sender.id === currentUserId;
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
      const user = conversation.participants.find(p => p.userId === typingUsers[0]);
      return `${user?.fullName} is typing...`;
    }
    return `${typingUsers.length} people are typing...`;
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        {t('chat.selectConversation')}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>
              {conversation.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{conversation.title}</h3>
            <p className="text-sm text-gray-500">
              {conversation.participants.length} participants
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isMessageFromCurrentUser(message)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {!isMessageFromCurrentUser(message) && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {message.sender.fullName}
                    </p>
                  )}
                  
                  {message.replyTo && (
                    <div className="text-xs opacity-75 mb-1 border-l-2 pl-2">
                      <p className="font-medium">{message.replyTo.sender.fullName}</p>
                      <p className="truncate">{message.replyTo.content}</p>
                    </div>
                  )}

                  {editingMessage === message.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-gray-900"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            editMessage(message.id);
                          }
                        }}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => editMessage(message.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMessage(null);
                            setEditContent('');
                          }}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{message.content}</p>
                      {message.edited && (
                        <p className="text-xs opacity-75 mt-1">(edited)</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isMessageFromCurrentUser(message) && (
                          <div className="flex items-center space-x-1">
                            {message.status === 'read' ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : message.status === 'delivered' ? (
                              <Check className="h-3 w-3" />
                            ) : null}
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessage(message.id);
                                  setEditContent(message.content);
                                }}
                                className="h-4 w-4 p-0 hover:bg-white hover:bg-opacity-20"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMessage(message.id)}
                                className="h-4 w-4 p-0 hover:bg-white hover:bg-opacity-20"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 italic">
          {getTypingText()}
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">Replying to {replyingTo.sender.fullName}</p>
            <p className="text-sm text-gray-600 truncate">{replyingTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
          >
            ×
          </Button>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onInput={handleTyping}
              placeholder="Type a message..."
              className="w-full"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}