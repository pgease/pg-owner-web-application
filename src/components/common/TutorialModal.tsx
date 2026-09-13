import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, BookOpen, QrCode, Globe, Users, ArrowRight, CheckCircle } from "lucide-react";

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TUTORIALS = [
  {
    id: "upi",
    title: "How to Collect Rent via Direct UPI Intent & Manual Verify",
    plan: "Lite & Pro",
    duration: "2 min guide",
    icon: QrCode,
    steps: [
      "Navigate to Rent Collection tab on your Dashboard.",
      "Share the direct payment link or dynamic UPI QR code with tenants.",
      "When tenant pays via PhonePe/GPay/Paytm, they submit UTR/screenshot.",
      "Review the transaction under 'Pending Approvals' and click 'Approve' to instantly issue receipt.",
    ],
  },
  {
    id: "add_tenant",
    title: "How to Add Tenants & Rooms",
    plan: "All Plans",
    duration: "1.5 min guide",
    icon: Users,
    steps: [
      "Go to Tenants → Add Tenant (or click '+' on room bed).",
      "Enter mobile number, name, monthly rent amount and deposit.",
      "Assign bed and room. Tenant instantly receives WhatsApp welcome alert.",
    ],
  },
  {
    id: "website",
    title: "How to Setup Your PG Website ({pgname}.pgease.in)",
    plan: "Pro Plan",
    duration: "3 min guide",
    icon: Globe,
    steps: [
      "Upgrade or activate your Pro Plan (₹49/bed/mo).",
      "In Property Settings, enter your desired subdomain (e.g. madhavpg).",
      "Upload PG photos, food menu, rules and amenities.",
      "Your live public site (e.g. madhavpg.pgease.in) goes live with direct tenant booking form!",
    ],
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState("upi");

  const current = TUTORIALS.find((t) => t.id === activeTab) || TUTORIALS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-6 border-teal-500/30 bg-[#0a1128] text-white shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs">
              Knowledge Base
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-400" />
            PG Ease Step-by-Step Tutorials
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Quick interactive walkthroughs to master your PG living operations.
          </DialogDescription>
        </DialogHeader>

        {/* Tutorial Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/5 pt-2">
          {TUTORIALS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-900/40"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.id === "upi" ? "UPI Payments" : t.id === "add_tenant" ? "Add Tenants" : "PG Website"}</span>
            </button>
          ))}
        </div>

        {/* Selected Tutorial Card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-white">{current.title}</h4>
              <p className="text-xs text-teal-400 mt-0.5">{current.duration} • {current.plan}</p>
            </div>
            <Badge variant="outline" className="text-slate-300 border-white/10 text-[10px]">
              Step-by-Step
            </Badge>
          </div>

          <div className="space-y-2.5">
            {current.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                <div className="h-5 w-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  {idx + 1}
                </div>
                <p className="leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs text-slate-400 hover:text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
