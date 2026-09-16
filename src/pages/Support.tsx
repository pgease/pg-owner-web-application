import { useState } from "react";
import {
  LifeBuoy,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Shield,
  HelpCircle,
  ExternalLink,
  Send,
  User,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How do I collect rent directly to my bank account with 0% fee?",
    a: "Under your PG Ease plan, tenants can pay via Direct UPI Intent or Dynamic QR codes. Money lands straight into your linked bank account with 0% gateway commission. Simply configure your bank account under Property → Bank Account.",
  },
  {
    q: "How does Aadhaar KYC and Police Verification work?",
    a: "Tenants receive an instant onboarding link via WhatsApp where they upload their Aadhaar and selfie. PG Ease verifies the credentials and maintains a digital audit vault for compliance.",
  },
  {
    q: "How do I add blocks, floors, and rooms?",
    a: "Navigate to Property → Structure & Rooms. You can create your building blocks, add floors, define rooms with sharing type (Single, Double, Triple), and set base pricing.",
  },
  {
    q: "What happens when my 45-day free trial ends?",
    a: "During the 45-day trial, you enjoy unlimited operations. Afterwards, you can upgrade to Lite (₹29/bed/month) or Pro (₹49/bed/month with your own dedicated website) to keep operations active.",
  },
  {
    q: "How do I send payment reminders to tenants?",
    a: "In Money → Dues & Pending, you can click 'WhatsApp' next to any tenant with overdue rent. A pre-formatted reminder message with rent details will be ready to send in 1 click.",
  },
];

const Support = () => {
  const { properties, selectedPgId } = useApp();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const [ticketName, setTicketName] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Rent & Payments");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAI = () => {
    window.dispatchEvent(new CustomEvent("open-ease-buddy"));
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketPhone.trim() || !ticketMessage.trim()) {
      toast({
        title: "Please fill required fields",
        description: "Phone number and issue description are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Support Ticket Registered (#TCK-" + Math.floor(1000 + Math.random() * 9000) + ")",
        description: "Your Dedicated Account Manager will contact you within 15 minutes.",
      });
      setTicketMessage("");
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl">
      <PageHeader
        title="Support & Assistance Desk"
        description="Need immediate help? Reach our dedicated operations team via Phone, WhatsApp, Email, or 24/7 AI."
      />

      {/* 4 PRIMARY IMMEDIATE HELP CHANNELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CALLING NUMBER */}
        <Card className="rounded-2xl border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 via-card to-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Direct Phone Call</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Immediate emergency voice support with PG operations lead.
                </p>
              </div>
              <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                +91 7701953356
              </div>
            </div>
            <Button
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-2 shadow-sm"
            >
              <a href="tel:+917701953356">
                <Phone className="h-3.5 w-3.5" /> Call Now
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* WHATSAPP SUPPORT */}
        <Card className="rounded-2xl border-teal-200/80 dark:border-teal-900/40 bg-gradient-to-br from-teal-50/50 via-card to-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">WhatsApp Support</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send screenshots, error notes, or query. Avg reply: &lt;2 mins.
                </p>
              </div>
              <div className="text-sm font-extrabold text-teal-700 dark:text-teal-400 font-mono">
                +91 7701953356
              </div>
            </div>
            <Button
              asChild
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-2 shadow-sm"
            >
              <a
                href="https://wa.me/917701953356?text=Hi%20PG%20Ease%20Support,%20I%20need%20assistance%20with%20my%20PG%20operations."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat on WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* EMAIL DESK */}
        <Card className="rounded-2xl border-blue-200/80 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 via-card to-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Official Email Desk</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Billing, GST invoices, and account verification inquiries.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                support@pgease.in
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 rounded-xl text-xs font-bold gap-2"
            >
              <a href="mailto:support@pgease.in">
                <Mail className="h-3.5 w-3.5" /> Email Support
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* EASEBUDDY AI */}
        <Card className="rounded-2xl border-purple-200/80 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/50 via-card to-card hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                  24/7 AI
                </Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">EaseBuddy AI</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Instant guidance on pricing, tenant KYC, rent calculation, and rules.
                </p>
              </div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Instant interactive bot
              </div>
            </div>
            <Button
              onClick={handleOpenAI}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold gap-2 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> Open AI Buddy
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* DEDICATED ACCOUNT MANAGER NOTICE */}
      <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0 font-black">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Dedicated Account Executive Assigned
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Active Priority
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Every PG Ease property gets a designated relationship manager for free onboarding assistance, Excel import, biometric device setup, and rent collection training.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold gap-1.5 shrink-0"
          onClick={() => {
            const text = encodeURIComponent(
              `Hi Account Manager, I would like to schedule a 1-on-1 walkthrough for my PG: ${selectedPg?.name || "My Property"}`
            );
            window.open(`https://wa.me/917701953356?text=${text}`, "_blank");
          }}
        >
          <Clock className="h-3.5 w-3.5 text-amber-400" /> Book Walkthrough
        </Button>
      </div>

      {/* TWO COLUMNS: TICKET FORM & FAQS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* QUICK CALLBACK / TICKET FORM */}
        <Card className="lg:col-span-5 rounded-2xl border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-teal-600" /> Request Callback or Register Issue
            </CardTitle>
            <CardDescription className="text-xs">
              Leave your contact details and our engineering or operations team will reach out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTicketSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Your Name</Label>
                <Input
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  placeholder="e.g. Shivam"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Mobile Number *</Label>
                <Input
                  value={ticketPhone}
                  onChange={(e) => setTicketPhone(e.target.value)}
                  placeholder="+91 7701953356"
                  required
                  className="h-9 text-xs rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Issue Category</Label>
                <Select value={ticketCategory} onValueChange={setTicketCategory}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rent & Payments">Rent & Direct UPI Collections</SelectItem>
                    <SelectItem value="Room Setup">Beds, Rooms & Structure</SelectItem>
                    <SelectItem value="Tenant KYC">Aadhaar KYC & Verification</SelectItem>
                    <SelectItem value="Staff & Roles">Staff Member Permissions</SelectItem>
                    <SelectItem value="Plans & Billing">Subscription Plans & Billing</SelectItem>
                    <SelectItem value="Other">General Technical Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Brief Description *</Label>
                <Textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  rows={3}
                  required
                  className="text-xs rounded-xl resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-10 shadow-sm gap-2"
              >
                {isSubmitting ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQS ACCORDION */}
        <Card className="lg:col-span-7 rounded-2xl border-border/80 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-teal-600" /> Frequently Asked Questions
            </CardTitle>
            <CardDescription className="text-xs">
              Quick answers to common questions about PG Ease management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="faq-0" className="w-full space-y-2 text-xs">
              {FAQS.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border rounded-xl px-4 py-1 bg-muted/10 data-[state=open]:bg-muted/20 transition-colors"
                >
                  <AccordionTrigger className="text-xs font-semibold hover:no-underline text-left py-2.5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-3">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
