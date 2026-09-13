import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Minimize2,
  ChevronRight,
  HelpCircle,
  QrCode,
  Globe,
  UserCheck,
  CreditCard,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  actionLink?: { label: string; url: string };
}

const KNOWLEDGE_RESPONSES: Record<string, { answer: string; link?: { label: string; url: string } }> = {
  trial: {
    answer:
      "🎉 Every new PG owner receives a **45-day Free Trial of the Lite Plan**! During these 45 days, you enjoy unlimited properties, direct UPI intent collections, manual payment approvals, and a Dedicated Account Manager. After 45 days, you can subscribe to Lite (₹29/bed/mo) or Pro (₹49/bed/mo) to keep operations active.",
    link: { label: "View Plans & Pricing", url: "/plans" },
  },
  plans: {
    answer:
      "We offer two transparent pricing plans:\n\n• **Lite Plan (₹29 / bed / month)**: Includes Direct UPI Intent Collection, Manual Payment Approve/Reject, Dedicated Account Manager, and unlimited beds.\n\n• **Pro Plan (₹49 / bed / month)**: Includes everything in Lite PLUS Automated Payment Gateway, Automated Bank Settlement (T+2), and your own Dedicated PG Website (`{pgname}.pgease.in`).",
    link: { label: "Compare Plans", url: "/plans" },
  },
  upi: {
    answer:
      "Under the **Lite Plan**, you collect rent directly into your bank account with **0% gateway commission** via UPI Intent & dynamic QR codes. When a tenant pays, they submit their payment reference. You simply click **Approve** or **Reject** in your Rent Collections desk!",
    link: { label: "Go to Rent Collections", url: "/rent-payments" },
  },
  website: {
    answer:
      "With the **Pro Plan (₹49/bed/month)**, PG Ease gives you your own dedicated subdomain website (e.g. `madhavpg.pgease.in`). You can showcase room photos, amenities, food menus, and accept direct tenant bookings online with zero broker fees!",
    link: { label: "Upgrade to Pro", url: "/plans" },
  },
  account_manager: {
    answer:
      "You have a **Dedicated Account Manager** assigned to your property! You can reach him directly via WhatsApp or phone call for 1-on-1 assistance with room setup, staff training, or payment issues.",
  },
  tenant: {
    answer:
      "To add a tenant, navigate to **Tenants → Add Tenant**. You can enter their details, assign their room and bed, and set their monthly rent. The tenant will receive an instant WhatsApp onboarding invitation!",
    link: { label: "Add Tenant Now", url: "/tenants/add" },
  },
};

export const EaseBuddyAI: React.FC<{
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}> = ({ isOpenExternal, onCloseExternal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "bot",
      text: "👋 Hi there! I'm **Ease Buddy AI**, your intelligent assistant for PG Ease operations. How can I help you manage your PG today?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("open-ease-buddy", handleOpenEvent);
    return () => window.removeEventListener("open-ease-buddy", handleOpenEvent);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClose = () => {
    setIsOpen(false);
    onCloseExternal?.();
  };

  const handleSend = (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");

    // Generate intelligent response
    setTimeout(() => {
      const q = textToSend.toLowerCase();
      let botResponse: { answer: string; link?: { label: string; url: string } } = {
        answer:
          "I can assist you with your 45-day trial, collecting rent via UPI, setting up your custom PG website on Pro, or connecting with your Dedicated Account Manager. Please select one of the suggested topics or contact our 24/7 support desk!",
        link: { label: "Explore Plans", url: "/plans" },
      };

      if (q.includes("trial") || q.includes("45") || q.includes("free")) {
        botResponse = KNOWLEDGE_RESPONSES.trial;
      } else if (q.includes("plan") || q.includes("price") || q.includes("lite") || q.includes("pro") || q.includes("cost") || q.includes("29") || q.includes("49")) {
        botResponse = KNOWLEDGE_RESPONSES.plans;
      } else if (q.includes("upi") || q.includes("verify") || q.includes("approve") || q.includes("payment") || q.includes("rent")) {
        botResponse = KNOWLEDGE_RESPONSES.upi;
      } else if (q.includes("website") || q.includes("subdomain") || q.includes("pgease.in") || q.includes("domain")) {
        botResponse = KNOWLEDGE_RESPONSES.website;
      } else if (q.includes("manager") || q.includes("rahul") || q.includes("support") || q.includes("contact")) {
        botResponse = KNOWLEDGE_RESPONSES.account_manager;
      } else if (q.includes("tenant") || q.includes("add") || q.includes("room") || q.includes("bed")) {
        botResponse = KNOWLEDGE_RESPONSES.tenant;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: botResponse.answer,
          actionLink: botResponse.link,
        },
      ]);
    }, 450);
  };

  return (
    <>
      {/* Floating Action Button - Circular Section */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white shadow-2xl shadow-teal-950/50 hover:shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all border-2 border-teal-300/40"
            title="Ease Buddy AI Assistant (Click to open chat)"
            aria-label="Open Ease Buddy AI"
          >
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border border-[#0a1128]" />
            </span>
            <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Floating AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] rounded-3xl border border-teal-500/30 bg-[#0a1128]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden text-white animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-teal-700/80 via-emerald-700/80 to-teal-800/80 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white shadow-inner">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a1128]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">Ease Buddy AI</h3>
                  <Badge className="bg-amber-400 text-slate-900 text-[9px] font-bold px-1.5 py-0">
                    Online
                  </Badge>
                </div>
                <p className="text-[10px] text-teal-200">Your PG Operations Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="bg-white/[0.03] border-b border-white/5 p-2 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => handleSend("Tell me about the 45-day Lite trial")}
              className="text-[10px] whitespace-nowrap bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 font-medium"
            >
              <Sparkles className="h-2.5 w-2.5" /> 45-Day Trial
            </button>
            <button
              onClick={() => handleSend("What is the difference between Lite and Pro plans?")}
              className="text-[10px] whitespace-nowrap bg-white/[0.05] border border-white/10 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 font-medium"
            >
              <CreditCard className="h-2.5 w-2.5" /> Lite vs Pro
            </button>
            <button
              onClick={() => handleSend("How does Direct UPI intent verification work?")}
              className="text-[10px] whitespace-nowrap bg-white/[0.05] border border-white/10 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 font-medium"
            >
              <QrCode className="h-2.5 w-2.5" /> UPI Verification
            </button>
            <button
              onClick={() => handleSend("How to get my PG website on Pro?")}
              className="text-[10px] whitespace-nowrap bg-white/[0.05] border border-white/10 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 font-medium"
            >
              <Globe className="h-2.5 w-2.5" /> PG Website
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-br-none"
                      : "bg-white/[0.07] text-slate-200 border border-white/10 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                {m.actionLink && (
                  <button
                    onClick={() => {
                      handleClose();
                      navigate(m.actionLink!.url);
                    }}
                    className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                  >
                    <span>{m.actionLink.label}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-2.5 border-t border-white/10 bg-[#070c1e] flex items-center gap-2 shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask Ease Buddy anything..."
              className="h-10 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-teal-500 rounded-xl"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="h-10 w-10 shrink-0 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-md disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
