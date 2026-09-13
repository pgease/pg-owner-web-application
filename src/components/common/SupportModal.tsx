import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Mail, HeadphonesIcon, Clock, CheckCircle } from "lucide-react";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-teal-500/30 bg-[#0a1128] text-white shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
              24/7 Assistance
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-teal-400" />
            PG Ease Support Desk
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Reach out to our customer support team anytime for technical or billing help.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <a
            href="https://wa.me/917500294131?text=Hi%20PG%20Ease%20Support,%20I%20need%20assistance."
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">WhatsApp Support</p>
                <p className="text-[11px] text-slate-400">Fastest response time (&lt; 5 min)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400">Chat &rarr;</span>
          </a>

          <a
            href="tel:+917500294131"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">Phone Helpline</p>
                <p className="text-[11px] text-slate-400">+91 75002 94131</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-400">Call &rarr;</span>
          </a>

          <a
            href="mailto:support@pgease.in?subject=PG%20Ease%20Owner%20Support%20Request"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Email Desk</p>
                <p className="text-[11px] text-slate-400">support@pgease.in</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-400">Email &rarr;</span>
          </a>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs text-slate-400 hover:text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
