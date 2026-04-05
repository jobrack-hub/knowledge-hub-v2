"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import AIChat from "./AIChat";
import { Bot } from "lucide-react";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar onToggleChat={() => setChatOpen(!chatOpen)} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">{children}</div>

      {/* Floating AI button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: "#1A2340" }}
        >
          <Bot size={22} style={{ color: "#3ECFB2" }} />
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#3ECFB2] border-2 border-white" />
        </button>
      )}

      {/* AI Chat panel */}
      <AIChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
