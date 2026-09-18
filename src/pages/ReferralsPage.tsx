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
  Sparkles,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Banknote,
  ArrowUpRight,
} from "lucide-react";
import {
  getOwnerReferralSummary,
  applyOwnerReferralCode,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState("");

  // Consolidated PG Owner Referral Summary Query
  const summaryQuery = useQuery({
    queryKey: ["owner-referral-summary"],
    queryFn: getOwnerReferralSummary,
  });

  // Apply code mutation
  const applyMutation = useMutation({
    mutationFn: (code: string) => applyOwnerReferralCode(code),
    onSuccess: (res) => {
      toast({
        title: "Referral code applied!",
        description: res?.message || "Your PG owner account is now linked to your referrer.",
      });
      setInputCode("");
      void queryClient.invalidateQueries({ queryKey: ["owner-referral-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
    onError: (err: unknown) => {
      toast({
        title: "Failed to apply code",
        description: err instanceof Error ? err.message : "Invalid or already applied referral code.",
        variant: "destructive",
      });
    },
  });

  const referralCode = summaryQuery.data?.referralCode || "PGE7X9";
  const shareUrl =
    summaryQuery.data?.shareableLink ||
    `https://pgease.com/partner/signup?ref=${referralCode}`;

  const referees: ReferralItem[] = summaryQuery.data?.referees || [];

  const totalReferees = summaryQuery.data?.totalReferees ?? referees.length;
  const totalEarned = summaryQuery.data?.totalEarned ?? 0;
  const pendingRewards = summaryQuery.data?.pendingRewards ?? 0;
  const qualifiedReferees = referees.filter(
    (r) => r.rewardStatus === "credited" || r.rewardStatus === "paid"
  ).length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast({
      title: "Invite link copied!",
      description: shareUrl,
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast({
      title: "Referral code copied!",
      description: referralCode,
    });
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hey! I use PG Ease to automate hostel & PG management, rent collections, and tenant KYC. Join using my referral code ${referralCode} or sign up here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    applyMutation.mutate(inputCode.trim());
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Recent";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recent";
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto animate-fade-in">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950 text-white p-8 sm:p-10 shadow-xl border border-blue-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>PG Ease Owner Rewards Program</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Refer Fellow PG Owners. <br />
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-teal-300 to-emerald-300">₹1,000 Cash</span> per Referral.
          </h1>
          <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
            Invite hostel and PG owners to digitize their properties with PG Ease. When they subscribe to any paid plan, cash rewards are automatically credited directly to your settlement bank account.
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
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyCode}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold gap-1.5 rounded-xl h-9 px-3"
                  title="Copy code only"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode ? "Code Copied" : "Copy Code"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyLink}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold gap-1.5 rounded-xl h-9 px-3"
                  title="Copy full invite link"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  {copiedLink ? "Link Copied" : "Copy Link"}
                </Button>
              </div>
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
                {summaryQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : totalReferees}
              </p>
              <p className="text-[11px] text-muted-foreground">Joined via your link/code</p>
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
                {summaryQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : qualifiedReferees}
              </p>
              <p className="text-[11px] text-muted-foreground">Purchased a paid plan</p>
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
                {summaryQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatInr(totalEarned)}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">Credited to bank account</p>
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
                {summaryQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatInr(pendingRewards)}
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
                Send your unique invite link via WhatsApp or share your code with PG & hostel owners in your city or network.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-foreground">Owner Signs Up & Subscribes</h3>
              <p className="text-xs text-muted-foreground">
                They register with your code and activate any PG Ease subscription plan to manage their hostel.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-foreground">Cash Rewards Credited</h3>
              <p className="text-xs text-muted-foreground">
                Receive ₹500 for starter plans and ₹1,000 for standard or enterprise plans directly into your settlement account.
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
                  Invited PG Owners & Ledger
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Real-time referral performance and payout tracking
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {referees.length} Total
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {summaryQuery.isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : referees.length === 0 ? (
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
                    <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
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
                      {referees.map((ref) => (
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
                            {ref.rewardStatus === "credited" || ref.rewardStatus === "paid" ? (
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
                            {formatDate(ref.joinedAt || ref.createdAt)}
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
                <span>Have an Invite Code?</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter an invite code (e.g. PGO-NAME-XXXX), invite link, or referrer's registered mobile number.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <form onSubmit={handleApply} className="space-y-3">
                <Input
                  placeholder="Code, Link, or Mobile Number"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  maxLength={120}
                  className="text-center h-10 rounded-xl font-semibold text-xs sm:text-sm"
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
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Reward Payout Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
              <p>• ₹500 cash credited for Starter subscription plans.</p>
              <p>• ₹1,000 cash credited for Growth & Enterprise plans.</p>
              <p>• Rewards are credited automatically upon first successful plan activation.</p>
              <p>• Payouts are transferred directly to your bank account with zero fees.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
