"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "Something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl shadow-2xl overflow-hidden slide-up flex flex-col" style={{ height: "520px" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "#1A2340" }}
      >
        <div className="flex items-center gap-2">
          <Bot size={18} style={{ color: "#3ECFB2" }} />
          <span className="text-white text-sm" style={{ fontWeight: 700 }}>
            SOP Assistant
          </span>
          <span className="w-2 h-2 rounded-full bg-[#3ECFB2]" />
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F6FA]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={36} className="mx-auto text-[#D0D4E8] mb-3" />
            <p className="text-sm text-[#6B7299]" style={{ fontWeight: 600 }}>
              Ask me anything about the SOPs.
            </p>
            <p className="text-xs text-[#6B7299] mt-1">
              Answers strictly from documentation — no guessing.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: "#EBF9F6" }}
              >
                <Bot size={12} style={{ color: "#3ECFB2" }} />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "chat-bubble-user"
                  : "chat-bubble-ai"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
              style={{ background: "#EBF9F6" }}
            >
              <Bot size={12} style={{ color: "#3ECFB2" }} />
            </div>
            <div className="chat-bubble-ai px-4 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D0D4E8] pulse-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#D0D4E8] pulse-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#D0D4E8] pulse-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-[#E8EAF0]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about SOPs..."
            className="flex-1 px-3.5 py-2.5 text-sm bg-[#F5F6FA] border border-[#E8EAF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ECFB2]/30 focus:border-[#3ECFB2] text-[#2D3550] placeholder-[#6B7299]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3.5 py-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{ background: "#1A2340", color: "#3ECFB2" }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
