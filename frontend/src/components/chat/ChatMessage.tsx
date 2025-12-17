'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit2, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  id: string;
  content: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isCurrentUser: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
}

export default function ChatMessage({
  id,
  content,
  sender,
  createdAt,
  updatedAt,
  isEdited = false,
  isCurrentUser,
  onEdit,
  onDelete,
  onCopy,
  status = 'sent',
  attachments = []
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showDropdown, setShowDropdown] = useState(false);

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(content);
    }
  };

  const handleCopy = () => {
    onCopy?.(content);
    setShowDropdown(false);
  };

  const handleDelete = () => {
    onDelete?.(id);
    setShowDropdown(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        );
      case 'sent':
      default:
        return (
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors group',
        isCurrentUser && 'flex-row-reverse space-x-reverse space-x-3'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn(
          'text-sm font-medium',
          isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
        )}>
          {sender.fullName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn('flex-1 min-w-0', isCurrentUser && 'text-right')}>
        <div className={cn(
          'flex items-center space-x-2 mb-1',
          isCurrentUser && 'justify-end space-x-reverse space-x-2'
        )}>
          <span className="text-sm font-medium text-gray-900">
            {sender.fullName}
          </span>
          <span className="text-xs text-gray-500">
            {sender.role}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(createdAt)}
          </span>
          {isCurrentUser && (
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
            </div>
          )}
        </div>

        {/* Message Text */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              autoFocus
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={!editContent.trim() || editContent === content}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className={cn(
              'inline-block px-4 py-2 rounded-lg max-w-md lg:max-w-lg',
              isCurrentUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            )}>
              <p className="whitespace-pre-wrap break-words">{content}</p>
              {isEdited && (
                <span className="text-xs opacity-75 ml-2">(edited)</span>
              )}
            </div>

            {/* Actions Menu */}
            {isCurrentUser && (
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  'inline-flex items-center space-x-2 p-2 rounded-md border max-w-xs',
                  isCurrentUser
                    ? 'bg-blue-500 border-blue-400 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                )}
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {attachment.filename.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-xs opacity-75">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Edited timestamp */}
        {isEdited && updatedAt && (
          <p className="text-xs text-gray-400 mt-1">
            Edited {formatTime(updatedAt)}
          </p>
        )}
      </div>
    </div>
  );
}