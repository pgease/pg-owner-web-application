import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  Users,
  Award,
  IndianRupee,
  Clock,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  getMyReferralCode,
  getReferralStats,
  getReferralsList,
  applyReferralCode,
  type ReferralItem,
} from "@/api/propertyOwner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { formatInr } from "@/lib/rentDashboard";

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState("");

  // Queries
  const codeQuery = useQuery({
    queryKey: ["referrals", "my-code"],
    queryFn: getMyReferralCode,
  });

  const statsQuery = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: getReferralStats,
  });

  const listQuery = useQuery({
    queryKey: ["referrals", "list"],
    queryFn: () => getReferralsList({ page: 1, limit: 50 }),
  });

  // Apply code mutation
  const applyMutation = useMutation({
    mutationFn: (code: string) => applyReferralCode(code),
    onSuccess: () => {
      toast({
        title: "Referral code applied!",
        description: "Your account is now linked to your referrer.",
      });
      setInputCode("");
      void queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
    onError: (err: unknown) => {
      toast({
        title: "Failed to apply code",
        description: err instanceof Error ? err.message : "Invalid or already applied code.",
        variant: "destructive",
      });
    },
  });

  const referralCode = codeQuery.data?.referralCode || "PGE7X9";
  const shareUrl =
    codeQuery.data?.shareUrl ||
    `https://www.pgease.com/signup?ref=${referralCode}`;

  const stats = statsQuery.data || {
    totalReferees: 0,
    qualifiedReferees: 0,
    totalRewardAmount: 0,
    pendingRewardAmount: 0,
    referralCode,
  };

  const referrals: ReferralItem[] = listQuery.data?.items || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Invite link copied to clipboard!",
      description: shareUrl,
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! I use PG Ease to manage my PG bookings, rents, agreements, and biometric KYC. Register using my link to get zero-commission direct settlements: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    applyMutation.mutate(inputCode.trim().toUpperCase());
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto animate-fade-in">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-8 sm:p-10 shadow-xl border border-blue-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>PG Ease Owner Rewards Program</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Refer Fellow PG Owners. <br />
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-teal-300 to-emerald-300">₹1,000 Cash</span> per Referral.
          </h1>
          <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
            Invite hostel and PG owners to digitize with PG Ease. When they purchase any subscription plan, cash rewards are automatically credited directly to your settlement account.
          </p>

          {/* SHARE CODE BOX */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-between bg-black/40 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-300">Your Referral Code</p>
                <p className="text-2xl font-black tracking-widest text-amber-300 font-mono">
                  {referralCode}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold gap-1.5 rounded-xl h-9"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 rounded-2xl h-14 px-6 shadow-lg shadow-emerald-950/40"
            >
              <Share2 className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 bottom-0 translate-y-12 w-80 h-80 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Referees</p>
              <p className="text-2xl font-black text-foreground">
                {statsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalReferees}
              </p>
              <p className="text-[11px] text-muted-foreground">Registered via your link</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Qualified Referees</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {statsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.qualifiedReferees}
              </p>
              <p className="text-[11px] text-muted-foreground">Purchased a plan</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Total Rewards Earned</p>
              <p className="text-2xl font-black text-foreground">
                {statsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatInr(stats.totalRewardAmount || 0)}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">Credited to payouts</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <IndianRupee className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Pending Rewards</p>
              <p className="text-2xl font-black text-muted-foreground">
                {statsQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatInr(stats.pendingRewardAmount || 0)}
              </p>
              <p className="text-[11px] text-muted-foreground">Awaiting plan purchase</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HOW IT WORKS 3 STEPS */}
      <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>How the Referral Program Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-bold text-foreground">Share your Link or Code</h3>
              <p className="text-xs text-muted-foreground">
                Send your unique link via WhatsApp or copy your code to PG owners in your city or network.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-foreground">They Subscribe to a Plan</h3>
              <p className="text-xs text-muted-foreground">
                When they sign up and purchase any Starter or Growth plan for their PG property.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-foreground">Get Cash Rewards Credited</h3>
              <p className="text-xs text-muted-foreground">
                Receive ₹500 for starter plans and ₹1,000 for plans ≥ ₹3,000 directly to your bank account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REFERRALS TABLE & APPLY CODE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REFERRALS LIST */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Invited PG Owners & Status
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Real-time reward settlement ledger
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {referrals.length} Total
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {listQuery.isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="py-12 text-center space-y-3 px-6">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <Gift className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">No referrals yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Share your code with friends and fellow PG owners to start earning direct cash rewards today!
                  </p>
                  <Button
                    size="sm"
                    onClick={handleWhatsAppShare}
                    className="rounded-xl text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share Now
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/30 border-y border-border/60 text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-3 px-5">Referee</th>
                        <th className="py-3 px-4">Plan</th>
                        <th className="py-3 px-4">Reward</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-5 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-muted/15 transition-colors">
                          <td className="py-3 px-5 font-semibold text-foreground">
                            <div>{ref.refereeName || "PG Owner"}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{ref.refereePhone}</div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-medium">
                            {ref.planName || "Trial"}
                          </td>
                          <td className="py-3 px-4 font-bold text-foreground">
                            {ref.rewardAmount > 0 ? formatInr(ref.rewardAmount) : "Pending"}
                          </td>
                          <td className="py-3 px-4">
                            {ref.rewardStatus === "credited" ? (
                              <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                Credited
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 border-amber-300">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-5 text-right text-[11px] text-muted-foreground">
                            {new Date(ref.joinedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* APPLY REFERRAL CODE CARD */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span>Have a Referral Code?</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                If you were invited by another PG owner, enter their code here.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <form onSubmit={handleApply} className="space-y-3">
                <Input
                  placeholder="e.g. PGE7X9"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="font-mono uppercase tracking-widest text-center h-10 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={applyMutation.isPending || !inputCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-9"
                >
                  {applyMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Apply Code"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* REWARDS FAQ CARD */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-muted/15">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-xs font-bold text-foreground">
                Reward Payout Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-[11px] text-muted-foreground">
              <p>• Rewards are credited automatically when the referee makes their first plan purchase.</p>
              <p>• ₹500 credited for Starter subscription plans.</p>
              <p>• ₹1,000 credited for Growth & Enterprise plans (≥ ₹3,000).</p>
              <p>• Payouts are transferred directly to your registered bank account with zero fee.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
