"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
    role: "assistant" | "user";
    content: string;
}

export default function ChatWidget() {
    const { data: session } = useSession();
    const role = (session as any)?.user?.role;
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hi! I'm your KK Assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    if (role !== "student") return null;

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await api.post("/ai/chat", { message: userMessage });
            const aiResponse = response.data.response;
            setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again later.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        className="mb-6 flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/40 shadow-2xl backdrop-blur-3xl transition-all"
                        style={{ width: "420px", height: "550px" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700/60 to-indigo-700/60 p-3 text-white backdrop-blur-md">
                            <div className="flex items-center space-x-2">
                                <div className="rounded-full bg-white/20 p-1.5 ring-1 ring-white/30">
                                    <Bot size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold leading-none">KK Assistant</h3>
                                    <p className="text-[9px] opacity-70">AI Powered Doubts Clearer</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 transition-colors hover:bg-white/20"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto overflow-x-hidden p-4"
                            ref={scrollRef}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(59, 130, 246, 0.2) transparent'
                            }}
                        >
                            <div className="space-y-4">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={i}
                                        className={cn(
                                            "flex w-full items-start gap-2",
                                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "rounded-full p-1 shadow-sm",
                                                msg.role === "user" ? "bg-blue-100" : "bg-gray-100"
                                            )}
                                        >
                                            {msg.role === "user" ? (
                                                <User size={12} className="text-blue-600" />
                                            ) : (
                                                <Bot size={12} className="text-gray-600" />
                                            )}
                                        </div>
                                        <div
                                            className={cn(
                                                "max-w-[85%] break-words rounded-2xl px-3 py-2 text-xs shadow-sm",
                                                msg.role === "user"
                                                    ? "bg-blue-600 text-white rounded-tr-none"
                                                    : "bg-white/90 text-gray-800 rounded-tl-none border border-gray-100"
                                            )}
                                        >
                                            {msg.role === "assistant" ? (
                                                <div className="prose prose-xs prose-neutral max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            h3: ({ node, ...props }) => <h3 className="text-xs font-bold mt-2 mb-1 text-blue-800" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 my-1" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-bold text-blue-900" {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <div className="ml-2 flex items-center space-x-2 text-gray-400">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-[10px] italic">Thinking...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-100 bg-white/50 p-3 backdrop-blur-sm">
                            <div className="flex items-center space-x-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Ask a doubt..."
                                    className="border-none bg-gray-100 focus-visible:ring-1 focus-visible:ring-blue-400"
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={isLoading}
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Send size={18} />
                                </Button>
                            </div>
                            <p className="mt-2 text-center text-[8px] text-gray-400 font-medium tracking-wide">
                                Powered by KK360 Companion
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
                    isOpen
                        ? "bg-gray-800 text-white"
                        : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                )}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>
        </div>
    );
}
