
import React from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: {
    content: string;
    role: "user" | "assistant";
    timestamp: number;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full overflow-hidden",
          isUser ? "w-8 h-8 bg-purple-100" : "w-10 h-10"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-purple-600" />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
            alt="Assistant Avatar"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      <div
        className={cn(
          "flex flex-col max-w-[80%] rounded-lg p-4",
          isUser
            ? "bg-purple-50 text-purple-900"
            : "bg-white border border-gray-100 shadow-sm"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <span className="text-xs text-gray-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
