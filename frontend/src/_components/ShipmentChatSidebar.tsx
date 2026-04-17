"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  PaperclipIcon, 
  GitCommit, 
  X, 
  User, 
  Bot, 
  MoreVertical,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  text: string;
  sender: "user" | "system";
  userName?: string;
  timestamp: string;
  milestoneId?: string;
};

interface ShipmentChatSidebarProps {
  shipmentId: string;
  activeMilestone?: string;
}

/**
 * ShipmentChatSidebar: Real-time communication for operational context.
 * Features: Milestone anchoring, actor-based styling, and sticky timeline markers.
 */
export function ShipmentChatSidebar({ shipmentId, activeMilestone }: ShipmentChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Shipment assigned to Driver Joe.", sender: "system", timestamp: "08:00 AM" },
    { id: "2", text: "Is the seal number SL-12345 confirmed?", sender: "user", userName: "Sarah Admin", timestamp: "08:15 AM" },
    { id: "3", text: "Seal SL-12345 verified at Gate-in.", sender: "system", timestamp: "09:30 AM", milestoneId: "gate-in" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      userName: "Me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-card border-l w-full max-w-[320px] shadow-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight">Operation Chat</h2>
            <p className="text-[10px] text-muted-foreground font-mono">{shipmentId}</p>
          </div>
        </div>
        <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={cn(
            "flex flex-col gap-1",
            msg.sender === "user" ? "items-end" : "items-start"
          )}>
            {msg.milestoneId && (
              <div className="mb-2 px-2 py-0.5 bg-purple-500/10 border border-purple-200 rounded text-[9px] font-bold text-purple-600 uppercase flex items-center gap-1 self-center">
                <GitCommit className="h-3 w-3" />
                Attached to {msg.milestoneId}
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-0.5 px-1">
               {msg.sender === "user" && <span className="text-[10px] font-bold text-muted-foreground">{msg.userName}</span>}
               {msg.sender === "system" && <Bot className="h-3 w-3 text-primary" />}
            </div>

            <div className={cn(
              "px-3 py-2 rounded-2xl text-xs max-w-[90%] shadow-sm",
              msg.sender === "user" 
                ? "bg-primary text-primary-foreground rounded-tr-none" 
                : "bg-muted/50 border border-border/50 text-foreground rounded-tl-none"
            )}>
              {msg.text}
            </div>
            
            <div className="flex items-center gap-1 px-1">
              <span className="text-[9px] text-muted-foreground">{msg.timestamp}</span>
              {msg.sender === "user" && <CheckCheck className="h-3 w-3 text-primary/50" />}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        {activeMilestone && (
          <div className="mb-3 flex items-center justify-between px-2 py-1.5 bg-slate-50 border rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Attaching to Active Milestone</span>
            <button className="text-[9px] font-black text-primary uppercase hover:underline">Cancel</button>
          </div>
        )}
        
        <div className="relative group">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type message..."
            className="w-full pl-3 pr-12 py-3 bg-muted/30 border rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[44px]"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors">
              <Paperclip className="h-4 w-4" />
            </button>
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
