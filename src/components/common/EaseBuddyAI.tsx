import React, { useState, useRef, useEffect } from "react";
import {
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
import mascotRent from "@/assets/mascot/mascot-rent.png";

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
      {/* Floating Action Button - Positioned at bottom: 24px, right: 24px */}
      {!isOpen && (
        <div className="fixed bottom-24 right-5 z-30 hidden sm:block">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-600)] text-white shadow-pop hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 border-2 border-white overflow-hidden p-0.5"
            title="Ease Buddy AI Assistant"
            aria-label="Open Ease Buddy AI"
          >
            <img
              src={mascotRent}
              alt="Ease Buddy"
              className="h-full w-full object-cover object-top rounded-full"
            />
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
        </div>
      )}

      {/* Ease Buddy Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[70vh] rounded-md border border-[var(--gray-200)] bg-white shadow-overlay flex flex-col overflow-hidden text-[var(--gray-900)]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--gray-50)] border-b border-[var(--gray-200)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-[var(--brand-50)] border border-[var(--brand-100)] overflow-hidden shrink-0">
                <img
                  src={mascotRent}
                  alt="Ease Buddy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--gray-900)]">Ease Buddy</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <p className="text-xs text-[var(--gray-500)]">PG Operations Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[var(--gray-500)] hover:text-[var(--gray-900)] hover:bg-[var(--gray-100)] rounded-md"
                onClick={handleClose}
                aria-label="Close Ease Buddy"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="bg-[var(--gray-50)]/50 border-b border-[var(--gray-200)] px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => handleSend("Tell me about the 45-day Lite trial")}
              className="text-xs whitespace-nowrap bg-white border border-[var(--gray-300)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] text-[var(--gray-700)] px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 font-medium shadow-none"
            >
              <Sparkles className="h-3 w-3 text-[var(--brand-600)]" /> 45-Day Trial
            </button>
            <button
              onClick={() => handleSend("What is the difference between Lite and Pro plans?")}
              className="text-xs whitespace-nowrap bg-white border border-[var(--gray-300)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] text-[var(--gray-700)] px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 font-medium shadow-none"
            >
              <CreditCard className="h-3 w-3 text-[var(--gray-500)]" /> Lite vs Pro
            </button>
            <button
              onClick={() => handleSend("How does Direct UPI intent verification work?")}
              className="text-xs whitespace-nowrap bg-white border border-[var(--gray-300)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] text-[var(--gray-700)] px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 font-medium shadow-none"
            >
              <QrCode className="h-3 w-3 text-[var(--gray-500)]" /> UPI Verification
            </button>
            <button
              onClick={() => handleSend("How to get my PG website on Pro?")}
              className="text-xs whitespace-nowrap bg-white border border-[var(--gray-300)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)] text-[var(--gray-700)] px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1 font-medium shadow-none"
            >
              <Globe className="h-3 w-3 text-[var(--gray-500)]" /> PG Website
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-white">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="h-6 w-6 rounded-full bg-[var(--brand-50)] border border-[var(--brand-100)] overflow-hidden shrink-0 mt-0.5 shadow-2xs">
                    <img
                      src={mascotRent}
                      alt="Ease Buddy"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                )}
                <div
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-md px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-[var(--brand-600)] text-white"
                        : "bg-[var(--gray-100)] text-[var(--gray-900)] border border-[var(--gray-200)]"
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
                      className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] hover:underline transition-colors"
                    >
                      <span>{m.actionLink.label}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center gap-2 shrink-0">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask Ease Buddy anything..."
              className="h-9 text-xs bg-white border-[var(--gray-300)] text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus-visible:ring-[var(--brand-600)] rounded-md"
            />
            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="h-9 px-3 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
