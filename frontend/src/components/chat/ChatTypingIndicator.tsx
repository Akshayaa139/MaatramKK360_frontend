'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TypingUser {
  userId: string;
  fullName: string;
  conversationId: string;
}

interface ChatTypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatTypingIndicator({ 
  conversationId, 
  currentUserId 
}: ChatTypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const handleTyping = (event: CustomEvent) => {
      const { userId, fullName, conversationId: typingConversationId } = event.detail;
      
      // Ignore current user's typing and other conversations
      if (userId === currentUserId || typingConversationId !== conversationId) {
        return;
      }

      setTypingUsers(prev => {
        const existingUser = prev.find(u => u.userId === userId);
        if (existingUser) {
          // Update existing user
          return prev.map(u => 
            u.userId === userId ? { ...u, fullName } : u
          );
        } else {
          // Add new typing user
          return [...prev, { userId, fullName, conversationId }];
        }
      });
    };

    const handleStopTyping = (event: CustomEvent) => {
      const { userId, conversationId: typingConversationId } = event.detail;
      
      if (typingConversationId !== conversationId) {
        return;
      }

      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    };

    window.addEventListener('socket_typing', handleTyping as EventListener);
    window.addEventListener('socket_stop_typing', handleStopTyping as EventListener);

    return () => {
      window.removeEventListener('socket_typing', handleTyping as EventListener);
      window.removeEventListener('socket_stop_typing', handleStopTyping as EventListener);
    };
  }, [conversationId, currentUserId]);

  // Clear typing users after 5 seconds of no updates
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const timeout = setTimeout(() => {
      setTypingUsers([]);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [typingUsers]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].fullName} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].fullName} and ${typingUsers[1].fullName} are typing...`;
    } else {
      return `${typingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border-t">
      {/* Show avatars for up to 3 typing users */}
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.userId} className="h-6 w-6 border-2 border-white">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {user.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      {/* Typing text */}
      <div className="flex-1">
        <p className="text-sm text-gray-600">
          {getTypingText()}
        </p>
      </div>

      {/* Typing animation dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  );
}