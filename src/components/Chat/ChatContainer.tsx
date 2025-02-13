
import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useEventSource } from "@/hooks/use-event-source";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("dify_api_key") || "");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!apiKey);
  const [tempApiKey, setTempApiKey] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: streamData, error, connect } = useEventSource();

  useChatScroll({
    containerRef,
    messages,
    isLoading,
  });

  useEffect(() => {
    if (!apiKey) {
      setShowApiKeyDialog(true);
    }
  }, [apiKey]);

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
      if (error.message.includes("401")) {
        setApiKey("");
        toast.error("Invalid API key. Please enter a valid Dify API key.");
      } else {
        toast.error("An error occurred while connecting to the chat server");
      }
    }
  }, [error]);

  const saveApiKey = () => {
    if (tempApiKey) {
      localStorage.setItem("dify_api_key", tempApiKey);
      setApiKey(tempApiKey);
      setShowApiKeyDialog(false);
      setTempApiKey("");
      toast.success("API key saved successfully");
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !apiKey) return;

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
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: {},  // Agregamos el objeto inputs requerido
          query: content,
          response_mode: "streaming",
          conversation_id: conversationId,
          user: "user-" + Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      connect(response);
    } catch (err) {
      setIsLoading(false);
      toast.error("Failed to send message");
      console.error("Error sending message:", err);
    }
  };

  return (
    <>
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

      <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter your Dify API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your Dify API key to start chatting. You can find your API key in your Dify dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveApiKey} disabled={!tempApiKey}>
              Save API Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
