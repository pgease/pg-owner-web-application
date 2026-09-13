import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Mail, Calendar, ShieldCheck, Clock, UserCheck } from "lucide-react";

interface AccountManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-teal-500/30 bg-[#0a1128] text-white shadow-2xl rounded-2xl">
        <DialogHeader className="text-center sm:text-left space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs">
              Included in All Plans
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-teal-400" />
            Your Dedicated Account Manager
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Direct 1-on-1 human support for your PG operations, staff training & onboarding.
          </DialogDescription>
        </DialogHeader>

        {/* Manager Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-900 font-bold text-xl shadow-md shrink-0">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-white">Rahul Sharma</h4>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xs text-teal-300 font-medium">Senior PG Growth Specialist</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <Clock className="h-3 w-3" />
                <span>Mon – Sat (9:00 AM – 8:00 PM)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-2"
              asChild
            >
              <a href="https://wa.me/917500294131?text=Hi%20Rahul,%20I%20am%20a%20PG%20Ease%20owner%20and%20need%20help." target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Chat
              </a>
            </Button>

            <Button
              variant="outline"
              className="border-white/15 text-white hover:bg-white/10 text-xs h-10 rounded-xl flex items-center justify-center gap-2"
              asChild
            >
              <a href="tel:+917500294131">
                <Phone className="h-4 w-4 text-teal-400" />
                Direct Call
              </a>
            </Button>
          </div>

          <div className="space-y-1.5 pt-1 text-[11px] text-slate-300 border-t border-white/5">
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">What Rahul can help with:</p>
            <ul className="space-y-1 text-slate-300 list-disc list-inside">
              <li>Setting up rooms, beds & floor structures</li>
              <li>Setting up Direct UPI intent & verifying rent</li>
              <li>Custom PG subdomain website setup (Pro Plan)</li>
              <li>Staff onboarding & training for wardens</li>
            </ul>
          </div>
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
