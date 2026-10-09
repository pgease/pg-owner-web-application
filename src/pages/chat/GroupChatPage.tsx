import { Link } from "react-router-dom";
import { BadgeCheck, BarChart3, Bell, Image, Megaphone, MessageSquare, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import { CanAccessPage } from "@/components/PermissionGuard";

export default function GroupChatPage() {
  const { selectedPgId, properties } = useApp();
  const property = properties.find((p) => p.id === selectedPgId);

  return (
    <CanAccessPage permission="chat_view">
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Resident & Group Chat
              </h1>
              <Badge className="bg-[#008080] hover:bg-[#006666] text-white font-semibold text-xs px-2.5 py-0.5">
                Coming Soon 🚀
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {property ? `Official communication hub for ${property.name}` : "Official communication hub for your PG residents & staff."}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>

        {/* Mascot Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-900/90 via-teal-950 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
          {/* Subtle Background Elements */}
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Mascot Icon Container */}
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-3xl bg-gradient-to-tr from-teal-400 to-emerald-300 p-1 shadow-2xl rotate-3 transition-transform hover:rotate-0">
                <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-slate-950/90 backdrop-blur-md">
                  <div className="relative flex items-center justify-center">
                    <MessageSquare className="h-14 w-14 sm:h-18 sm:w-18 text-teal-300 animate-pulse" />
                    <Sparkles className="absolute -top-2 -right-2 h-7 w-7 text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-amber-400 text-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg">
                NEXT RELEASE
              </div>
            </div>

            {/* Mascot Hero Text */}
            <div className="text-center md:text-left space-y-3 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300 border border-teal-500/30">
                <BadgeCheck className="h-4 w-4 text-teal-400" /> Verified Resident Network
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-slate-100">
                PG Ease Community & Resident Chat Launching Soon!
              </h2>
              <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed max-w-2xl">
                Hum ek dedicated private messaging module launch kar rahe hain jahan aapke PG ke <strong>Owners, Caretakers aur Verified Tenants</strong> ek safe, organized jagah par connect aur communicate kar sakenge.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Points Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#008080]" /> Key Upcoming Features (Kya Kya Aayega):
            </h2>
            <span className="text-xs text-muted-foreground font-medium">6 Main Modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 transition-all hover:border-teal-500/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#008080] dark:text-teal-400 font-bold border border-teal-200 dark:border-teal-900">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Official PG Announcements</h3>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">Broadcast Channel</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Owner aur Staff ek click me PG rules, food menu updates, electricity bills, aur maintenance notices saare residents ko broadcast kar sakenge.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 transition-all hover:border-teal-500/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Room & Direct 1-on-1 Chat</h3>
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">Private & Secure</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tenants bina apna personal mobile number public kiye PG owner, room partners, ya floor caretakers se direct 1-on-1 private chat kar sakenge.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 transition-all hover:border-teal-500/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                  <Image className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Photo & Receipt Sharing</h3>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Instant Uploads</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Repairs/complaint photo attachments, meter readings, aur rent payment UTR receipts direct chat me share honge for transparent tracking.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 transition-all hover:border-teal-500/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">4. Push & WhatsApp Alerts</h3>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Real-time Notifications</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Important broadcasts direct WhatsApp aur Push Notification ke zariye bheje jaayenge taaki koi bhi urgent PG update miss na ho.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 transition-all hover:border-teal-500/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">5. Emergency Gate/Staff Alert</h3>
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">1-Tap Assistance</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Late night gate assistance, room lockouts, ya water supply issues ke liye residents 1-tap emergency ping bhej sakenge.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 transition-all hover:border-teal-500/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#008080]/10 text-[#008080] dark:text-teal-300 font-bold border border-teal-500/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">6. Resident Food & Feedback Polls</h3>
                  <span className="text-[11px] text-[#008080] dark:text-teal-400 font-semibold">Interactive Voting</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sunday special lunch menu, Wifi speed satisfaction, aur general PG feedback ke liye quick interactive voting polls.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info card */}
        <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900/50 p-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Want early beta access for {property?.name || "your PG"}?
            </p>
            <p className="text-xs text-muted-foreground">
              Feature update active hote hi aapke PG me automatic enable kar diya jaayega.
            </p>
          </div>
          <Button className="bg-[#008080] hover:bg-[#006666] text-white font-semibold text-xs shrink-0" asChild>
            <Link to="/my-pgs">View My PGs</Link>
          </Button>
        </div>
      </div>
    </CanAccessPage>
  );
}
