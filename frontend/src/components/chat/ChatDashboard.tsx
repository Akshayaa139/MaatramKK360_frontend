"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MessageCircle, PhoneCall, Calendar, Users } from "lucide-react";
import ChatConversationList from "./ChatConversationList";
import ChatWindow from "./ChatWindow";
import socketService from "@/services/socketService";

interface Conversation {
  id: string;
  type: "application" | "televerification" | "panel";
  relatedId: string;
  title: string;
  participants: Array<{
    userId: string;
    fullName: string;
    role: string;
  }>;
  lastMessage: {
    id: string;
    content: string;
    sender: {
      id: string;
      fullName: string;
      role: string;
    };
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
}

export default function ChatDashboard() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const loadConversations = async (): Promise<void> => {
    try {
      const response = await fetch("/api/chat/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const initializeChat = useCallback(async (currentSession: Session) => {
    try {
      setLoading(true);

      // Initialize socket connection
      await socketService.connect(currentSession.user.id);
      setSocketConnected(true);

      // Load conversations
      await loadConversations();

      // Join user room for notifications
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      initializeChat(session);
    }
    return () => {
      socketService.disconnect();
    };
  }, [session, initializeChat]);

  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);

      // Join conversation room
      socketService.joinConversation(conversation.id);

      // Mark messages as read
      if (conversation.unreadCount > 0) {
        markConversationAsRead(conversation.id);
      }
    }
  };

  const markConversationAsRead = async (
    conversationId: string
  ): Promise<void> => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      // Convert File objects to the expected attachment format
      const formattedAttachments = attachments
        ? attachments.map((file, index) => ({
            id: `attachment-${Date.now()}-${index}`,
            name: file.name,
            url: URL.createObjectURL(file), // Temporary URL for preview
            type: file.type,
            size: file.size,
          }))
        : [];

      // Send message through socket
      socketService.sendMessage({
        conversationId: selectedConversation.id,
        content: content.trim(),
        attachments: formattedAttachments,
      });

      // Update local conversation state
      if (session?.user) {
        setSelectedConversation((prev) =>
          prev
            ? {
                ...prev,
                lastMessage: {
                  id: `temp-${Date.now()}`,
                  content: content.trim(),
                  sender: {
                    id: session.user.id,
                    fullName: session.user.name || "You",
                    role: session.user.role || "user",
                  },
                  createdAt: new Date().toISOString(),
                },
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleBackToConversations = () => {
    if (selectedConversation) {
      socketService.leaveConversation(selectedConversation.id);
    }
    setSelectedConversation(null);
  };

  const getConversationStats = () => {
    const total = conversations.length;
    const unread = conversations.reduce(
      (sum, conv) => sum + conv.unreadCount,
      0
    );
    const online = conversations.filter((conv) =>
      conv.participants.some(
        (p) =>
          // This would need to be implemented with actual online status
          true // Placeholder
      )
    ).length;

    return { total, unread, online };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const stats = getConversationStats();

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="h-6 w-6 mr-2 text-blue-600" />
              {t("chat.conversations")}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className={`${
                socketConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  socketConnected ? "bg-green-600" : "bg-red-600"
                }`}
              />
              {socketConnected ? t("chat.online") : t("chat.offline")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-xs text-blue-600">
                {t("chat.conversations")}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {stats.online}
              </div>
              <div className="text-xs text-green-600">{t("chat.online")}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {stats.unread}
              </div>
              <div className="text-xs text-purple-600">
                {t("common.unread")}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-hidden">
          <ChatConversationList
            conversations={conversations.map((conv) => ({
              id: conv.id,
              name: conv.title,
              lastMessage: conv.lastMessage?.content || "No messages yet",
              timestamp: conv.lastMessage?.createdAt || conv.createdAt,
              unreadCount: conv.unreadCount,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                conv.title
              )}&background=random`,
            }))}
            selectedConversationId={selectedConversation?.id || null}
            onSelectConversation={handleConversationSelect}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToConversations}
                    className="md:hidden"
                  >
                    ← {t("common.back")}
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.type === "application" && (
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {t("chat.application")}
                        </span>
                      )}
                      {selectedConversation.type === "televerification" && (
                        <span className="flex items-center">
                          <PhoneCall className="h-3 w-3 mr-1" />
                          {t("chat.televerification")}
                        </span>
                      )}
                      {selectedConversation.type === "panel" && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {t("chat.panelInterview")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Chat Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    {selectedConversation.participants.length}
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversation={selectedConversation}
                currentUserId={session?.user?.id || ""}
              />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="bg-blue-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("chat.selectConversation")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("chat.selectConversationDescription")}
              </p>
              <Button
                onClick={() =>
                  document
                    .querySelector("[data-conversation-list]")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t("chat.browseConversations")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
