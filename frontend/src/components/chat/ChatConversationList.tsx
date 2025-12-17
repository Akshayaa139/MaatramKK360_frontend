import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
}

interface ChatConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ChatConversationList: React.FC<ChatConversationListProps> = ({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation 
}) => {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Chats</h2>
      </div>
      <div className="space-y-2">
        {conversations.map((convo) => (
          <div
            key={convo.id}
            className={cn(
              "flex items-center p-3 cursor-pointer transition-colors",
              selectedConversationId === convo.id
                ? "bg-blue-100 dark:bg-blue-900/50"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            onClick={() => onSelectConversation(convo.id)}
          >
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage src={convo.avatar} alt={convo.name} />
              <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{convo.name}</h3>
                <span className="text-xs text-gray-500">{convo.timestamp}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-600 truncate dark:text-gray-400">
                  {convo.lastMessage}
                </p>
                {convo.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatConversationList;