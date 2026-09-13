import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageCircle,
  Mail,
  PlayCircle,
  ExternalLink,
  Bot,
  Sparkles,
  Clock,
  Youtube,
  Headphones,
} from "lucide-react";

interface SupportLearningHubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "support" | "tutorials";
}

const tutorialVideos = [
  {
    id: "upi-intent",
    title: "Zero-Fee Direct UPI Intent Setup & Manual Payment Verify",
    duration: "5:12",
    description: "Learn how to accept rent via Direct UPI intent without gateway commission, and approve/reject tenant receipts.",
    category: "Payments",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Core Feature",
  },
  {
    id: "add-tenant",
    title: "Adding, Allocating & Importing Tenants (Excel)",
    duration: "4:30",
    description: "Step-by-step guide to adding guests, assigning beds/rooms, and importing large tenant lists from Excel.",
    category: "Tenants",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Must Watch",
  },
  {
    id: "electricity-meter",
    title: "Sub-Meter Electricity Reading & Auto-Calculation",
    duration: "3:45",
    description: "How to enter monthly sub-meter units, configure your per-unit rate, and split electricity charges accurately.",
    category: "Billing",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Billing",
  },
  {
    id: "pg-website",
    title: "Launching Your Branded PG Website ({pg}.pgease.in)",
    duration: "4:10",
    description: "How Pro plan owners activate their public PG website, showcase photos and amenities, and capture direct leads.",
    category: "Pro Feature",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Pro Plan",
  },
  {
    id: "aadhaar-kyc",
    title: "DigiLocker Aadhaar KYC Verification in 30 Seconds",
    duration: "3:15",
    description: "How government UIDAI Aadhaar verification works with OTP to keep your property 100% compliant and secure.",
    category: "Verification",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Security",
  },
  {
    id: "staff-roles",
    title: "Staff Management, Wardens & Granular Roles",
    duration: "4:40",
    description: "Add managers, wardens, cooks, and gatekeepers with customized permissions so they only see what they need.",
    category: "Operations",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Operations",
  },
  {
    id: "notice-period",
    title: "Notice Period Tracking & Check-Out Settlements",
    duration: "3:55",
    description: "Set 30-day move-out notices, calculate electricity and damage deductions, and settle security deposits.",
    category: "Tenants",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    badge: "Tenants",
  },
];

export const SupportLearningHubModal: React.FC<SupportLearningHubModalProps> = ({
  open,
  onOpenChange,
  defaultTab = "support",
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const handleOpenEaseBuddy = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("open-ease-buddy"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a1128] rounded-3xl shadow-2xl">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-[#004245] via-[#013336] to-[#012224] p-6 sm:p-7 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 rounded-full border-2 border-teal-400 overflow-hidden shrink-0 shadow-md bg-teal-900/60">
                <img
                  src="/support-agent-avatar.jpg"
                  alt="Support Manager"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#013336]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold uppercase tracking-wider">
                    Dedicated Support
                  </Badge>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online Now
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-white mt-1">
                  PG Ease Support & Learning Hub
                </DialogTitle>
                <DialogDescription className="text-xs text-teal-200/80 mt-0.5">
                  Direct contact with your account manager and complete video tutorials
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/30">
            <TabsList className="bg-transparent h-12 p-0 gap-6">
              <TabsTrigger
                value="support"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#008080] data-[state=active]:text-[#008080] dark:data-[state=active]:text-teal-400 rounded-none h-12 px-1 text-xs font-bold text-slate-500 flex items-center gap-2"
              >
                <Headphones className="h-4 w-4" />
                Account Manager & 24/7 Support
              </TabsTrigger>
              <TabsTrigger
                value="tutorials"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#008080] data-[state=active]:text-[#008080] dark:data-[state=active]:text-teal-400 rounded-none h-12 px-1 text-xs font-bold text-slate-500 flex items-center gap-2"
              >
                <Youtube className="h-4 w-4 text-red-500" />
                Video Tutorials ({tutorialVideos.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: SUPPORT & ACCOUNT MANAGER */}
          <TabsContent value="support" className="p-6 space-y-6 m-0 animate-fade-in">
            {/* Dedicated Account Manager Card */}
            <div className="rounded-2xl border-2 border-teal-500/20 bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/30 dark:from-slate-900/60 dark:to-slate-900/40 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                    RS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Rahul Sharma
                      </h4>
                      <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold">
                        Dedicated Manager
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Personal Onboarding, Banking & Operations Specialist
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-teal-600" />
                      +91 98765 43210
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-center">
                  🟢 Typical response: &lt; 2 mins
                </span>
              </div>

              {/* 3 Main Contact CTAs: Call, WhatsApp, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <Button
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-10 gap-2 shadow-xs"
                >
                  <a href="tel:+919876543210">
                    <Phone className="h-3.5 w-3.5 text-teal-400" />
                    Call Phone
                  </a>
                </Button>

                <Button
                  asChild
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold h-10 gap-2 shadow-xs"
                >
                  <a
                    href="https://wa.me/919876543210?text=Hi%20Rahul,%20I%20am%20a%20PG%20Owner%20using%20PG%20Ease%20and%20need%20assistance."
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat WhatsApp
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold h-10 gap-2"
                >
                  <a href="mailto:support@pgease.in?subject=PG%20Ease%20Owner%20Support%20Request">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    Send Email
                  </a>
                </Button>
              </div>
            </div>

            {/* Ease Buddy AI Promotion Card */}
            <div className="rounded-2xl border border-teal-200 dark:border-teal-900 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Need instant answers right now?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ease Buddy AI is trained on all PG Ease operations and answers questions 24/7.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleOpenEaseBuddy}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm"
              >
                <Sparkles className="h-3 w-3 mr-1 text-amber-300" />
                Open AI Chat
              </Button>
            </div>

            {/* Helpline Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  ⏰ Support Operating Hours
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Priority Phone: 9:00 AM – 9:00 PM (Mon – Sun)
                  <br />
                  WhatsApp & Email: 24/7 Monitoring
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  🏢 Engineering & Billing Escalation
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Email: support@pgease.in
                  <br />
                  Emergency Tech: tech-ops@pgease.in
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: VIDEO TUTORIALS (6 TO 7 VIDEOS) */}
          <TabsContent value="tutorials" className="p-6 space-y-4 m-0 animate-fade-in">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step-by-Step Video Masterclasses
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quick 3 to 5 minute guides to get the most value from PG Ease.
                </p>
              </div>
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Youtube className="h-3 w-3" /> YouTube HD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {tutorialVideos.map((video, idx) => (
                <div
                  key={video.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {video.badge}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {video.duration}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-2">
                      {idx + 1}. {video.title}
                    </h5>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      {video.category}
                    </span>
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <PlayCircle className="h-3.5 w-3.5 text-red-500" />
                      Watch Video
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
export default SupportLearningHubModal;
