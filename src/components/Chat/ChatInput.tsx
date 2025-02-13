
import React, { KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit(value);
      }
    }
  };

  return (
    <div className="relative flex items-end bg-white rounded-lg shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-purple-200 transition-all">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 max-h-32 p-4 pr-12 text-sm bg-transparent border-none outline-none resize-none"
        disabled={isLoading}
        rows={1}
      />
      <button
        onClick={() => {
          if (value.trim() && !isLoading) {
            onSubmit(value);
          }
        }}
        disabled={!value.trim() || isLoading}
        className="absolute right-2 bottom-3 p-2 text-purple-600 hover:text-purple-700 disabled:text-gray-300 transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
