
import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useEventSource } from "@/hooks/use-event-source";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
};

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: streamData, error, connect } = useEventSource();

  useChatScroll({
    containerRef,
    messages,
    isLoading,
  });

  useEffect(() => {
    if (streamData) {
      try {
        const event = JSON.parse(streamData);
        if (event.event === "message") {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + event.answer },
              ];
            }
            return [
              ...prev,
              {
                id: event.message_id,
                content: event.answer,
                role: "assistant",
                timestamp: event.created_at,
              },
            ];
          });
        } else if (event.event === "message_end") {
          setIsLoading(false);
          setConversationId(event.conversation_id);
        }
      } catch (e) {
        console.error("Failed to parse stream data:", e);
      }
    }
  }, [streamData]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error("An error occurred while connecting to the chat server");
    }
  }, [error]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsLoading(true);
      setInput("");
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content,
          role: "user",
          timestamp: Date.now(),
        },
      ]);

      const response = await fetch("https://api.dify.ai/v1/chat-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer YOUR_API_KEY", // Replace with actual API key
        },
        body: JSON.stringify({
          query: content,
          response_mode: "streaming",
          conversation_id: conversationId,
          user: "user-" + Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      connect(response);
    } catch (err) {
      setIsLoading(false);
      toast.error("Failed to send message");
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100" ref={containerRef}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <div className="w-2 h-2 rounded-full bg-purple-400 animation-delay-200" />
            <div className="w-2 h-2 rounded-full bg-purple-400 animation-delay-400" />
          </div>
        )}
      </div>
      
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
