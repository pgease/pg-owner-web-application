import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Pin,
  Trash2,
  Reply,
  X,
  Search,
  Users,
  Bell,
  BellOff,
  Shield,
  ShieldAlert,
  Sparkles,
  Check,
  CheckCheck,
  MoreVertical,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  Building,
  Info,
  Lock,
  ArrowRight,
  Eye,
  Megaphone,
  Wrench,
  DollarSign,
  UserCheck,
  AlertCircle,
  PlusCircle,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/context/AppContext";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePermissions } from "@/context/PermissionContext";
import { useNavigate } from "react-router-dom";

export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "ANNOUNCEMENT";
export type SenderRole = "OWNER" | "STAFF" | "TENANT" | "SYSTEM";

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  senderRoom?: string;
  senderStaffRole?: string;
  messageType: MessageType;
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: string;
  createdAt: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    messageType: MessageType;
  } | null;
  isPinned?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  role: SenderRole;
  roomNumber?: string;
  staffRole?: string;
  joinedAt: string;
  status: "ACTIVE" | "INACTIVE";
  avatarColor: string;
}

const DEFAULT_MEMBERS: GroupMember[] = [
  {
    id: "user-owner-1",
    name: "Kavyansh Gupta",
    role: "OWNER",
    joinedAt: "Jan 2026",
    status: "ACTIVE",
    avatarColor: "bg-purple-600",
  },
  {
    id: "user-staff-1",
    name: "Rahul Sharma",
    role: "STAFF",
    staffRole: "Property Manager",
    joinedAt: "Feb 2026",
    status: "ACTIVE",
    avatarColor: "bg-emerald-600",
  },
  {
    id: "user-staff-2",
    name: "Amit Patel",
    role: "STAFF",
    staffRole: "Caretaker",
    joinedAt: "Mar 2026",
    status: "ACTIVE",
    avatarColor: "bg-teal-600",
  },
  {
    id: "user-tenant-1",
    name: "Amit Kumar",
    role: "TENANT",
    roomNumber: "Room A-102",
    joinedAt: "Apr 2026",
    status: "ACTIVE",
    avatarColor: "bg-blue-600",
  },
  {
    id: "user-tenant-2",
    name: "Rohit Sharma",
    role: "TENANT",
    roomNumber: "Room A-203",
    joinedAt: "May 2026",
    status: "ACTIVE",
    avatarColor: "bg-indigo-600",
  },
  {
    id: "user-tenant-3",
    name: "Vikas Verma",
    role: "TENANT",
    roomNumber: "Room A-204",
    joinedAt: "Jun 2026",
    status: "ACTIVE",
    avatarColor: "bg-cyan-600",
  },
  {
    id: "user-tenant-4",
    name: "Priya Singh",
    role: "TENANT",
    roomNumber: "Room B-101",
    joinedAt: "Jul 2026",
    status: "ACTIVE",
    avatarColor: "bg-rose-600",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-sys-1",
    groupId: "pg-default",
    senderId: "system",
    senderName: "PG Ease",
    senderRole: "SYSTEM",
    messageType: "SYSTEM",
    text: "🏠 Welcome to the official ABC Boys PG Private Group Chat. Only verified residents and staff have access.",
    createdAt: "Yesterday at 09:00 AM",
  },
  {
    id: "msg-1",
    groupId: "pg-default",
    senderId: "user-owner-1",
    senderName: "Kavyansh Gupta",
    senderRole: "OWNER",
    messageType: "ANNOUNCEMENT",
    text: "📢 Water supply maintenance scheduled tomorrow morning from 9:00 AM – 11:00 AM. Overhead tanks are being sanitized. Please plan accordingly.",
    createdAt: "Yesterday at 10:15 AM",
    isPinned: true,
  },
  {
    id: "msg-sys-2",
    groupId: "pg-default",
    senderId: "system",
    senderName: "PG Ease",
    senderRole: "SYSTEM",
    messageType: "SYSTEM",
    text: "🏠 Rahul Sharma joined Room A-203.",
    createdAt: "Yesterday at 11:30 AM",
  },
  {
    id: "msg-2",
    groupId: "pg-default",
    senderId: "user-tenant-3",
    senderName: "Vikas Verma",
    senderRole: "TENANT",
    senderRoom: "Room A-204",
    messageType: "TEXT",
    text: "Hi team, Room A-204 bathroom tap is leaking slightly after today's pressure test.",
    createdAt: "Yesterday at 02:40 PM",
  },
  {
    id: "msg-3",
    groupId: "pg-default",
    senderId: "user-staff-2",
    senderName: "Amit Patel",
    senderRole: "STAFF",
    senderStaffRole: "Caretaker",
    messageType: "TEXT",
    text: "Noted Vikas! The plumber is already in the building today. I will have him inspect and fix it by 4 PM.",
    createdAt: "Yesterday at 02:45 PM",
    replyTo: {
      id: "msg-2",
      senderName: "Vikas Verma",
      text: "Hi team, Room A-204 bathroom tap is leaking slightly after today's pressure test.",
      messageType: "TEXT",
    },
  },
  {
    id: "msg-4",
    groupId: "pg-default",
    senderId: "user-tenant-1",
    senderName: "Amit Kumar",
    senderRole: "TENANT",
    senderRoom: "Room A-102",
    messageType: "IMAGE",
    text: "Special dinner menu for festival tonight looks amazing! Sharing the notice board snap for anyone who missed it.",
    attachmentUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    attachmentName: "festive_dinner_menu.jpg",
    attachmentType: "image/jpeg",
    createdAt: "Today at 01:15 PM",
  },
  {
    id: "msg-5",
    groupId: "pg-default",
    senderId: "user-owner-1",
    senderName: "Kavyansh Gupta",
    senderRole: "OWNER",
    messageType: "TEXT",
    text: "Yes! Dinner service tonight is extended until 10:30 PM. Enjoy everyone!",
    createdAt: "Today at 01:20 PM",
    replyTo: {
      id: "msg-4",
      senderName: "Amit Kumar",
      text: "Special dinner menu for festival tonight looks amazing!...",
      messageType: "IMAGE",
    },
  },
  {
    id: "msg-sys-3",
    groupId: "pg-default",
    senderId: "system",
    senderName: "PG Ease",
    senderRole: "SYSTEM",
    messageType: "SYSTEM",
    text: "💰 Rent Update: 18 residents completed digital rent collection for this cycle.",
    createdAt: "Today at 02:00 PM",
  },
];

export default function GroupChatPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedPgId, properties } = useApp();
  const subAccess = useSubscriptionAccess();
  const entitlements = useEntitlements();
  const { isOwner, can } = usePermissions();

  // Find active PG name
  const currentProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPgId) || properties[0] || {
      id: "pg-default",
      name: "ABC Boys PG",
      address: "Sector 62, Noida",
    };
  }, [properties, selectedPgId]);

  const storageKey = `pgease_group_chat_messages_${currentProperty.id}`;
  const settingsKey = `pgease_group_chat_settings_${currentProperty.id}`;

  // Settings state
  const [chatSettings, setChatSettings] = useState<{
    enabled: boolean;
    tenantPostingAllowed: boolean;
    isMuted: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { enabled: true, tenantPostingAllowed: true, isMuted: false };
  });

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MESSAGES;
  });

  // UI state
  const [inputText, setInputText] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<"image" | "file">("image");
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // File upload simulation state
  const [mockFileName, setMockFileName] = useState("maintenance_notice.pdf");
  const [mockFileType, setMockFileType] = useState("application/pdf");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Check feature permission via central feature key
  const isProAccess = entitlements.hasFeature("pg_group_chat");

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(chatSettings));
    } catch {}
  }, [chatSettings, settingsKey]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Filter messages for search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.attachmentName && m.attachmentName.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  // Currently pinned message
  const pinnedMessage = useMemo(() => {
    return messages.find((m) => m.isPinned && !m.isDeleted);
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: currentProperty.id,
      senderId: "user-owner-1",
      senderName: isOwner ? "Kavyansh Gupta" : "Staff Member",
      senderRole: isOwner ? "OWNER" : "STAFF",
      senderStaffRole: isOwner ? undefined : "Property Manager",
      messageType: isAnnouncement ? "ANNOUNCEMENT" : "TEXT",
      text: inputText.trim(),
      createdAt: "Just now",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text.slice(0, 70) + (replyingTo.text.length > 70 ? "..." : ""),
            messageType: replyingTo.messageType,
          }
        : null,
      isPinned: isAnnouncement, // Announcements can auto-pin or offer pin
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setIsAnnouncement(false);
    setReplyingTo(null);

    toast({
      title: isAnnouncement ? "📢 Announcement posted" : "Message sent",
      description: "Delivered to all active members of " + currentProperty.name,
    });
  };

  // Simulate Tenant Message (for Demo / QA)
  const handleSimulateTenantResponse = () => {
    const tenantResponses = [
      { name: "Amit Kumar", room: "Room A-102", text: "Got it, thank you for the timely update!" },
      { name: "Rohit Sharma", room: "Room A-203", text: "Thanks for keeping us posted on the timings." },
      { name: "Priya Singh", room: "Room B-101", text: "Appreciate the quick maintenance response 👍" },
    ];
    const pick = tenantResponses[Math.floor(Math.random() * tenantResponses.length)];

    const tenantMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: currentProperty.id,
      senderId: "user-tenant-sim",
      senderName: pick.name,
      senderRole: "TENANT",
      senderRoom: pick.room,
      messageType: "TEXT",
      text: pick.text,
      createdAt: "Just now",
    };

    setMessages((prev) => [...prev, tenantMsg]);
    toast({
      title: "Tenant Message Received",
      description: `${pick.name} (${pick.room}) replied to the group.`,
    });
  };

  // Handle Attachment Send
  const handleSendAttachment = () => {
    const isImg = selectedAttachmentType === "image";
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: currentProperty.id,
      senderId: "user-owner-1",
      senderName: isOwner ? "Kavyansh Gupta" : "Staff Member",
      senderRole: isOwner ? "OWNER" : "STAFF",
      messageType: isImg ? "IMAGE" : "FILE",
      text: inputText.trim() || (isImg ? "Attached photo" : "Shared document"),
      attachmentUrl: isImg
        ? "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80"
        : undefined,
      attachmentName: isImg ? "room_layout_notice.jpg" : mockFileName,
      attachmentType: isImg ? "image/jpeg" : mockFileType,
      attachmentSize: isImg ? "1.8 MB" : "420 KB",
      createdAt: "Just now",
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text.slice(0, 60),
            messageType: replyingTo.messageType,
          }
        : null,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setReplyingTo(null);
    setAttachmentModalOpen(false);

    toast({
      title: "Attachment shared",
      description: `Uploaded and delivered to ${currentProperty.name}`,
    });
  };

  // Handle Pin / Unpin
  const handleTogglePin = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const next = !m.isPinned;
          toast({
            title: next ? "📌 Message Pinned" : "Message Unpinned",
            description: next
              ? "Pinned to the group banner for all members."
              : "Removed from the group banner.",
          });
          return { ...m, isPinned: next };
        }
        // Unpin others if we only support single pinned announcement in V1
        return { ...m, isPinned: false };
      })
    );
  };

  // Handle Delete Message (Soft delete)
  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            isDeleted: true,
            deletedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            deletedBy: isOwner ? "Owner" : "User",
            isPinned: false,
          };
        }
        return m;
      })
    );
    toast({
      title: "Message deleted",
      description: "This message has been removed from the chat.",
    });
  };

  // Jump and highlight replied message
  const handleJumpToMessage = (targetId: string) => {
    setHighlightedMsgId(targetId);
    const el = document.getElementById(`chat-msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => {
      setHighlightedMsgId(null);
    }, 2500);
  };

  // ==================== Plan Gate Render ====================
  if (!isProAccess) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-[#0c1427] via-[#09101d] to-[#040810] p-8 md:p-12 text-white shadow-2xl">
          {/* Subtle glow circles */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary tracking-wide uppercase mb-6 shadow-sm">
              <Sparkles className="h-4 w-4" />
              PRO PLAN EXCLUSIVE FEATURE
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Private PG-Level Group Chat
            </h1>

            <p className="text-base text-slate-300 leading-relaxed mb-6">
              Connect your verified tenants, staff, and management inside a private, official
              communication channel built directly into PG Ease. Eliminate messy WhatsApp groups
              and protect tenant privacy with room badges instead of exposing phone numbers.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Full Privacy Protection</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tenants are identified by room numbers (e.g. "Room A-204"). Personal phone
                    numbers are kept confidential.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <Megaphone className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Pinned Announcements</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Broadcast critical PG maintenance, water, electricity, or dinner timings right
                    to the pinned header.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <UserCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Auto Sync with Onboarding</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tenants join the group automatically when onboarded and are deactivated when
                    exiting. No manual group admin hassle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <Lock className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Staff Permission Controls</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Control which staff can post announcements, upload media, or moderate group
                    messages.
                  </p>
                </div>
              </div>
            </div>

            {/* Trial Offer Box */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  45-Day Free Pro Trial
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Enjoy all Pro features, including PG Group Chat, automated gateway collections,
                  and your branded website free for 45 days.
                </p>
              </div>

              <Button
                onClick={() => navigate("/plans")}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 shrink-0 rounded-xl"
              >
                Upgrade to Pro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Demo QA switcher */}
            <div className="border-t border-white/10 pt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400">Developer / Demo Preview:</span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-primary/40 text-primary hover:bg-primary/20 rounded-lg"
                onClick={() => {
                  subAccess.setDemoPlan("trial");
                  toast({
                    title: "Pro Trial Activated (Demo)",
                    description: "You now have full access to PG Group Chat for testing.",
                  });
                }}
              >
                Activate 45-Day Trial (Demo)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/20 rounded-lg"
                onClick={() => {
                  subAccess.setDemoPlan("pro");
                  toast({
                    title: "Pro Plan Activated (Demo)",
                    description: "You are now simulating an active Pro Plan.",
                  });
                }}
              >
                Activate Pro Plan (Demo)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Main Pro Chat Interface ====================
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      {/* Top Demo Banner for QA convenience */}
      {entitlements.isTrial && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>PRO Trial Active</strong> — {entitlements.daysRemaining} days remaining in
              your 45-day trial. Private PG Group Chat is fully unlocked.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => subAccess.setDemoPlan("lite")}
              className="text-[11px] underline text-amber-300 hover:text-white"
            >
              Test Lite Lock
            </button>
            <button
              onClick={() => subAccess.setDemoPlan("reset")}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Box Card */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/90 dark:bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {/* ================= HEADER ================= */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {/* Left: PG Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary/80 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Building className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate leading-tight">
                  {currentProperty.name} Group
                </h2>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-[10px] px-1.5 py-0 uppercase font-bold"
                >
                  PRO
                </Badge>
                {chatSettings.isMuted && (
                  <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 bg-slate-800 text-slate-400">
                    <VolumeX className="h-2.5 w-2.5" /> Muted
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {DEFAULT_MEMBERS.length + 80} members
                </span>
                <span>•</span>
                <span className="truncate">{currentProperty.address || "Sector 62, Noida"}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery("");
              }}
              title="Search chat"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Mute Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${
                chatSettings.isMuted
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              onClick={() => {
                const next = !chatSettings.isMuted;
                setChatSettings((s) => ({ ...s, isMuted: next }));
                toast({
                  title: next ? "Notifications Muted" : "Notifications Enabled",
                  description: next
                    ? "You will not receive sound alerts for this group."
                    : "You will receive real-time push alerts for new messages.",
                });
              }}
              title={chatSettings.isMuted ? "Unmute group" : "Mute group notifications"}
            >
              {chatSettings.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            {/* Quick Demo: Simulate Tenant Response */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateTenantResponse}
              className="hidden sm:inline-flex text-xs h-8 gap-1.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg"
              title="Simulate tenant message in this PG"
            >
              <PlusCircle className="h-3.5 w-3.5 text-primary" />
              <span>Simulate Tenant</span>
            </Button>

            {/* Members Drawer Trigger */}
            <Sheet open={memberSheetOpen} onOpenChange={setMemberSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="View group members"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-slate-900 border-slate-800 text-white p-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-slate-800">
                  <SheetTitle className="text-base font-bold text-white flex items-center justify-between">
                    <span>{currentProperty.name} Members</span>
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                      {DEFAULT_MEMBERS.length + 80} Verified
                    </Badge>
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-400">
                    Residents & staff assigned to this property. Phone numbers are protected.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Privacy Notice */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-start gap-2.5">
                    <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Privacy Protected:</span> Tenants can only see
                      names and room tags. Personal phone numbers remain hidden.
                    </div>
                  </div>

                  {/* Owner Section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      PG Owner
                    </h3>
                    {DEFAULT_MEMBERS.filter((m) => m.role === "OWNER").map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full ${m.avatarColor} flex items-center justify-center font-bold text-xs text-white`}
                          >
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{m.name}</div>
                            <div className="text-xs text-purple-300">Property Owner</div>
                          </div>
                        </div>
                        <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-[10px]">
                          Admin
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Staff Section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Authorized Staff
                    </h3>
                    <div className="space-y-2">
                      {DEFAULT_MEMBERS.filter((m) => m.role === "STAFF").map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full ${m.avatarColor} flex items-center justify-center font-bold text-xs text-white`}
                            >
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{m.name}</div>
                              <div className="text-xs text-emerald-300">{m.staffRole}</div>
                            </div>
                          </div>
                          <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                            Staff
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tenants Section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Active Tenants ({DEFAULT_MEMBERS.filter((m) => m.role === "TENANT").length}+)
                    </h3>
                    <div className="space-y-2">
                      {DEFAULT_MEMBERS.filter((m) => m.role === "TENANT").map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full ${m.avatarColor} flex items-center justify-center font-bold text-xs text-white`}
                            >
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{m.name}</div>
                              <div className="text-xs text-cyan-300 font-medium">{m.roomNumber}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                            Tenant
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                  <Button
                    onClick={() => {
                      setMemberSheetOpen(false);
                      navigate("/team");
                    }}
                    variant="outline"
                    className="w-full text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Manage Staff Permissions in Team Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Group Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white w-56">
                <DropdownMenuItem
                  onClick={() => setSettingsModalOpen(true)}
                  className="text-xs cursor-pointer focus:bg-slate-800 flex items-center gap-2"
                >
                  <Settings className="h-3.5 w-3.5 text-primary" />
                  <span>Group Chat Settings</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    const next = !chatSettings.isMuted;
                    setChatSettings((s) => ({ ...s, isMuted: next }));
                  }}
                  className="text-xs cursor-pointer focus:bg-slate-800 flex items-center gap-2"
                >
                  {chatSettings.isMuted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  <span>{chatSettings.isMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-800" />

                <DropdownMenuItem
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset this chat's local demo messages?")) {
                      setMessages(INITIAL_MESSAGES);
                      localStorage.removeItem(storageKey);
                      toast({ title: "Chat Reset", description: "Default demo messages restored." });
                    }
                  }}
                  className="text-xs text-rose-400 cursor-pointer focus:bg-slate-800 focus:text-rose-400 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset Demo Chat Data</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar Drawer if opened */}
        {showSearch && (
          <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this PG group messages, senders, or attachments..."
              className="h-8 text-xs bg-slate-900 border-slate-700 text-white placeholder-slate-400"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-7 text-xs text-slate-400 hover:text-white px-2"
              >
                Clear
              </Button>
            )}
          </div>
        )}

        {/* ================= PINNED ANNOUNCEMENT BANNER ================= */}
        {pinnedMessage && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Pin className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <span className="font-bold text-amber-300 mr-2">PINNED ANNOUNCEMENT:</span>
                <span className="text-slate-200 truncate inline-block max-w-xl align-bottom">
                  {pinnedMessage.text}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleJumpToMessage(pinnedMessage.id)}
                className="text-[11px] font-semibold text-amber-300 hover:underline"
              >
                View
              </button>
              {(isOwner || can("chat_pin")) && (
                <button
                  onClick={() => handleTogglePin(pinnedMessage.id)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                  title="Unpin announcement"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= MESSAGE FEED ================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No messages found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for something else or clear the search filter.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === "user-owner-1";
              const isHighlight = highlightedMsgId === msg.id;

              // System Message Style
              if (msg.messageType === "SYSTEM") {
                return (
                  <div key={msg.id} id={`chat-msg-${msg.id}`} className="flex justify-center my-3">
                    <div className="rounded-full px-4 py-1.5 bg-slate-800/70 border border-slate-700/50 text-[11px] text-slate-300 shadow-sm flex items-center gap-2 max-w-lg text-center">
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              // Normal & Announcement Messages
              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} group transition-colors duration-300 ${
                    isHighlight ? "bg-primary/10 rounded-xl p-2" : ""
                  }`}
                >
                  {/* Sender Details (Name, Role badge, Room) */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-xs">
                    <span className="font-semibold text-slate-200">{msg.senderName}</span>

                    {msg.senderRole === "OWNER" && (
                      <Badge className="bg-purple-900/60 text-purple-300 border-purple-500/40 text-[9px] px-1.5 py-0 font-bold">
                        Owner
                      </Badge>
                    )}
                    {msg.senderRole === "STAFF" && (
                      <Badge className="bg-emerald-900/60 text-emerald-300 border-emerald-500/40 text-[9px] px-1.5 py-0 font-bold">
                        Staff{msg.senderStaffRole ? ` · ${msg.senderStaffRole}` : ""}
                      </Badge>
                    )}
                    {msg.senderRole === "TENANT" && (
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-300 bg-cyan-950/40 text-[9px] px-1.5 py-0">
                        {msg.senderRoom || "Tenant"}
                      </Badge>
                    )}

                    <span className="text-[10px] text-slate-500">{msg.createdAt}</span>

                    {msg.isPinned && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0 gap-1">
                        <Pin className="h-2.5 w-2.5" /> Pinned
                      </Badge>
                    )}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`relative max-w-xl rounded-2xl p-3 shadow-md ${
                      msg.isDeleted
                        ? "bg-slate-800/40 border border-slate-700/40 text-slate-400 italic text-xs"
                        : msg.messageType === "ANNOUNCEMENT"
                        ? "bg-gradient-to-br from-amber-950/40 to-slate-900 border-2 border-amber-500/40 text-white"
                        : isMe
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60"
                    }`}
                  >
                    {/* Soft Deleted Message */}
                    {msg.isDeleted ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
                        <span>This message was deleted ({msg.deletedAt}).</span>
                      </div>
                    ) : (
                      <>
                        {/* Announcement Header Tag */}
                        {msg.messageType === "ANNOUNCEMENT" && (
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5 pb-1 border-b border-amber-500/20">
                            <Megaphone className="h-3.5 w-3.5" />
                            <span>Official PG Announcement</span>
                          </div>
                        )}

                        {/* Quoted Reply Preview */}
                        {msg.replyTo && (
                          <div
                            onClick={() => handleJumpToMessage(msg.replyTo!.id)}
                            className={`mb-2 rounded-lg p-2 text-xs border-l-2 cursor-pointer transition-colors ${
                              isMe
                                ? "bg-black/20 border-white/60 text-white/90 hover:bg-black/30"
                                : "bg-slate-900/60 border-primary text-slate-300 hover:bg-slate-900"
                            }`}
                          >
                            <div className="font-bold text-[11px] text-primary-foreground/90">
                              {msg.replyTo.senderName}
                            </div>
                            <div className="text-[11px] truncate opacity-80">{msg.replyTo.text}</div>
                          </div>
                        )}

                        {/* Image Attachment Preview */}
                        {msg.attachmentUrl && (
                          <div className="mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || "Attachment"}
                              className="max-h-64 w-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                              onClick={() => setPreviewImage(msg.attachmentUrl!)}
                            />
                            {msg.attachmentName && (
                              <div className="p-1.5 text-[11px] text-slate-300 flex items-center justify-between">
                                <span className="truncate">{msg.attachmentName}</span>
                                {msg.attachmentSize && <span className="opacity-60">{msg.attachmentSize}</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* File Attachment Card */}
                        {msg.messageType === "FILE" && msg.attachmentName && (
                          <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-2.5">
                            <div className="h-10 w-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                {msg.attachmentName}
                              </div>
                              <div className="text-[10px] text-slate-300 opacity-75">
                                {msg.attachmentSize || "Document"}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:bg-white/10 rounded-lg shrink-0"
                              onClick={() =>
                                toast({
                                  title: "Downloading File",
                                  description: `Securely retrieving ${msg.attachmentName}...`,
                                })
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Text Body */}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                          {msg.text}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hover Actions (Reply, Pin, Delete) */}
                  {!msg.isDeleted && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Reply Button */}
                      <button
                        onClick={() => {
                          setReplyingTo(msg);
                          messageInputRef.current?.focus();
                        }}
                        className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 flex items-center gap-1"
                        title="Reply to message"
                      >
                        <Reply className="h-3 w-3" />
                        <span>Reply</span>
                      </button>

                      {/* Pin/Unpin (Owner or staff with pin perm) */}
                      {(isOwner || can("chat_pin")) && (
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className="text-[11px] text-slate-400 hover:text-amber-400 px-2 py-0.5 rounded hover:bg-slate-800 flex items-center gap-1"
                          title={msg.isPinned ? "Unpin message" : "Pin message"}
                        >
                          <Pin className="h-3 w-3" />
                          <span>{msg.isPinned ? "Unpin" : "Pin"}</span>
                        </button>
                      )}

                      {/* Delete (Own message or Owner moderating) */}
                      {(isMe || isOwner || can("chat_delete_any")) && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-slate-800 flex items-center gap-1"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ================= COMPOSER ================= */}
        <div className="p-3 bg-slate-850 border-t border-slate-800 shrink-0">
          {/* Replying Banner */}
          {replyingTo && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-2 truncate">
                <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-semibold text-primary">{replyingTo.senderName}:</span>
                <span className="truncate opacity-75">{replyingTo.text}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Announcement Indicator Bar */}
          {isAnnouncement && (
            <div className="mb-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Megaphone className="h-3.5 w-3.5" /> Posting as Official Announcement
              </span>
              <button
                onClick={() => setIsAnnouncement(false)}
                className="text-xs text-amber-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Input & Action buttons */}
          <div className="flex items-center gap-2">
            {/* Attachment Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                  title="Attach media or document"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-white w-48">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAttachmentType("image");
                    setAttachmentModalOpen(true);
                  }}
                  className="cursor-pointer text-xs flex items-center gap-2.5 focus:bg-slate-800"
                >
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  <span>Upload Image / Photo</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedAttachmentType("file");
                    setAttachmentModalOpen(true);
                  }}
                  className="cursor-pointer text-xs flex items-center gap-2.5 focus:bg-slate-800"
                >
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span>Upload PDF / Document</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Announcement Toggle Button (Owner or Staff with pin perm) */}
            {(isOwner || can("chat_pin")) && (
              <Button
                variant={isAnnouncement ? "default" : "ghost"}
                size="icon"
                onClick={() => setIsAnnouncement(!isAnnouncement)}
                className={`h-10 w-10 rounded-xl shrink-0 ${
                  isAnnouncement
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
                title="Post as Announcement"
              >
                <Megaphone className="h-5 w-5" />
              </Button>
            )}

            {/* Message Input Box */}
            <div className="flex-1 relative">
              <Input
                ref={messageInputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isAnnouncement
                    ? "Write an announcement to all members of " + currentProperty.name + "..."
                    : "Type a message to ABC Boys PG members... (Enter to send)"
                }
                className="h-11 bg-slate-900 border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus-visible:ring-1 focus-visible:ring-primary pl-4 pr-10 shadow-inner"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0 p-0 shadow-md disabled:opacity-40"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: IMAGE LIGHTBOX ================= */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl bg-slate-950 border-slate-800 p-2 text-white overflow-hidden rounded-2xl">
            <div className="relative">
              <img
                src={previewImage}
                alt="Enlarged preview"
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
            </div>
            <DialogFooter className="p-3 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">PG Verified Media</span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-700 text-white"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= MODAL: ATTACHMENT SIMULATION ================= */}
      <Dialog open={attachmentModalOpen} onOpenChange={setAttachmentModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {selectedAttachmentType === "image" ? (
                <>
                  <ImageIcon className="h-5 w-5 text-emerald-400" />
                  Attach Image
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 text-blue-400" />
                  Attach Document
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Select or confirm the file to upload and share in the PG group chat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedAttachmentType === "image" ? (
              <div className="rounded-xl border border-slate-700 overflow-hidden bg-black/40">
                <img
                  src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80"
                  alt="Room preview"
                  className="h-44 w-full object-cover"
                />
                <div className="p-3 text-xs text-slate-300 flex items-center justify-between">
                  <span>room_layout_notice.jpg</span>
                  <span className="text-slate-500">1.8 MB (JPEG)</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 p-4 bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-slate-400">File Name</Label>
                    <Input
                      value={mockFileName}
                      onChange={(e) => setMockFileName(e.target.value)}
                      className="h-8 text-xs bg-slate-900 border-slate-700 text-white mt-1"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  Allowed formats: PDF, DOC, DOCX, XLS, XLSX (Max 15MB)
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-slate-300">Caption / Message (optional)</Label>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Add a message to accompany this attachment..."
                className="h-9 text-xs bg-slate-900 border-slate-700 text-white mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-700 text-slate-300"
              onClick={() => setAttachmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendAttachment}
              className="text-xs bg-primary hover:bg-primary/90 text-white"
            >
              Upload & Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: GROUP SETTINGS ================= */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              PG Group Chat Controls
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Manage operational rules and member permissions for {currentProperty.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Enable/Disable Group Chat */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <Label className="text-xs font-semibold text-white">Enable Group Chat for this PG</Label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When toggled off, chat is paused for all members.
                </p>
              </div>
              <Switch
                checked={chatSettings.enabled}
                onCheckedChange={(v) => setChatSettings((s) => ({ ...s, enabled: v }))}
              />
            </div>

            {/* Tenant Posting Permission */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <Label className="text-xs font-semibold text-white">Allow Tenants to Post</Label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  If turned off, only Owner & Staff can post (Announcement Mode).
                </p>
              </div>
              <Switch
                checked={chatSettings.tenantPostingAllowed}
                onCheckedChange={(v) => setChatSettings((s) => ({ ...s, tenantPostingAllowed: v }))}
              />
            </div>

            {/* Sound & Notifications */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div>
                <Label className="text-xs font-semibold text-white">Mute Group Notifications</Label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Disable push alerts and sound notifications for your account.
                </p>
              </div>
              <Switch
                checked={chatSettings.isMuted}
                onCheckedChange={(v) => setChatSettings((s) => ({ ...s, isMuted: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                setSettingsModalOpen(false);
                toast({
                  title: "Settings Saved",
                  description: "PG Group Chat configuration updated successfully.",
                });
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
