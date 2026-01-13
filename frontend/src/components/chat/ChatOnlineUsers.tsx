"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Circle } from "lucide-react";
import socketService from "@/services/socketService";

interface ChatOnlineUsersProps {
  participants: Array<{
    userId: string;
    fullName: string;
    role: string;
  }>;
}

export default function ChatOnlineUsers({
  participants,
}: ChatOnlineUsersProps) {
  const { t } = useTranslation();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  useEffect(() => {
    const handleUserOnline = (event: CustomEvent) => {
      const { userId } = event.detail;
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    const handleUserOffline = (event: CustomEvent) => {
      const { userId } = event.detail;
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    window.addEventListener(
      "socket_user_online",
      handleUserOnline as EventListener
    );
    window.addEventListener(
      "socket_user_offline",
      handleUserOffline as EventListener
    );

    // Request current online users
    socketService.getOnlineUsers();

    return () => {
      window.removeEventListener(
        "socket_user_online",
        handleUserOnline as EventListener
      );
      window.removeEventListener(
        "socket_user_offline",
        handleUserOffline as EventListener
      );
    };
  }, []);

  const onlineParticipants = participants.filter((p) =>
    onlineUsers.has(p.userId)
  );
  const offlineParticipants = participants.filter(
    (p) => !onlineUsers.has(p.userId)
  );

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "tutor":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      case "test team":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return t("roles.admin");
      case "tutor":
        return t("roles.tutor");
      case "student":
        return t("roles.student");
      case "test team":
        return t("roles.testTeam");
      default:
        return role;
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowOnlineUsers(!showOnlineUsers)}
        className="flex items-center space-x-2"
      >
        <Users className="h-4 w-4" />
        <span className="text-sm">
          {t("chat.onlineUsers")} ({onlineParticipants.length})
        </span>
        <Circle
          className={`h-2 w-2 ${
            onlineParticipants.length > 0 ? "text-green-500" : "text-gray-400"
          }`}
          fill="currentColor"
        />
      </Button>

      {/* Online Users Panel */}
      {showOnlineUsers && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">
              {t("chat.conversationParticipants")}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t("chat.onlineCount", {
                count: onlineParticipants.length,
                total: participants.length,
              })}
            </p>
          </div>

          <ScrollArea className="max-h-64">
            {/* Online Users */}
            {onlineParticipants.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-xs font-medium text-green-600 mb-2 flex items-center">
                  <Circle className="h-2 w-2 mr-1" fill="currentColor" />
                  {t("chat.online")} ({onlineParticipants.length})
                </h4>
                <div className="space-y-2">
                  {onlineParticipants.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-3"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                            {user.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Circle
                          className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500"
                          fill="currentColor"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        <Badge
                          className={getRoleColor(user.role)}
                          variant="secondary"
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Users */}
            {offlineParticipants.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                  <Circle className="h-2 w-2 mr-1" />
                  {t("chat.offline")} ({offlineParticipants.length})
                </h4>
                <div className="space-y-2">
                  {offlineParticipants.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-3 opacity-60"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm bg-gray-100 text-gray-500">
                          {user.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        <Badge
                          className={getRoleColor(user.role)}
                          variant="secondary"
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Close Button */}
          <div className="p-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOnlineUsers(false)}
              className="w-full"
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
