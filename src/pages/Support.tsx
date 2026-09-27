import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MessageCircle, Sparkles, Clock, BookOpen, ExternalLink, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { HelpLink } from "@/components/common/HelpLink";
import { useApp } from "@/context/AppContext";
import { authStorage } from "@/api/http";
import { toast } from "@/components/ui/use-toast";
import {
  HELP_CENTER_URL,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  supportMailtoUrl,
  supportWhatsAppUrl,
} from "@/config/links";

const CATEGORIES = ["Rent & payments", "Tenants & KYC", "Rooms & property setup", "Plans & billing", "Staff & permissions", "Something else"];

/** Navigation-only FAQs — every answer points at a real screen in this app. */
const FAQS: { q: string; a: string; to?: string; toLabel?: string }[] = [
  {
    q: "How do I add my first tenant?",
    a: "Go to Tenants → All Tenants and click “Add tenant”. You'll pick a room and bed, enter rent details, and optionally send a KYC link to the tenant's phone.",
    to: "/tenants/add",
    toLabel: "Add a tenant",
  },
  {
    q: "How do I add blocks, floors, rooms and beds?",
    a: "Open Property → Rooms & Beds. Create blocks and floors first, then add rooms with their sharing type and number of beds.",
    to: "/my-pgs/structure",
    toLabel: "Open Rooms & Beds",
  },
  {
    q: "How do I record a rent payment or see who hasn't paid?",
    a: "Rent & Payments → Rent Collection shows this month's paid and unpaid tenants. Use “Dues & Pending” to see only the unpaid list and send WhatsApp reminders.",
    to: "/rent-payments",
    toLabel: "Open Rent Collection",
  },
  {
    q: "How does tenant KYC verification work?",
    a: "From Tenants → KYC & Agreements you can send a verification link to the tenant. Once they submit their documents, the application shows up here for you to approve or reject.",
    to: "/tenants/kyc",
    toLabel: "Open KYC",
  },
  {
    q: "What happens when my trial ends?",
    a: "Your data stays safe. You'll be asked to pick a plan to keep managing your PG. Current plans and prices are always listed on the Plans & Billing page.",
    to: "/plans",
    toLabel: "See plans",
  },
  {
    q: "Can my staff log in with limited access?",
    a: "Yes. Add team members under Staff → Team Members and control what each person can see or do from the Permissions page.",
    to: "/team",
    toLabel: "Manage team",
  },
];

const Support = () => {
  const { properties, selectedPgId } = useApp();
  const selectedPg = properties.find((p) => p.id === selectedPgId);
  const ownerName = authStorage.getPropertyOwner()?.name ?? "";

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");

  const buildMessage = () =>
    [
      `Hi PG Ease team,`,
      ``,
      `Topic: ${category}`,
      selectedPg ? `PG: ${selectedPg.name}${selectedPg.propertyCode ? ` (${selectedPg.propertyCode})` : ""}` : null,
      ownerName ? `From: ${ownerName}` : null,
      ``,
      message.trim(),
    ]
      .filter((l) => l !== null)
      .join("\n");

  const requireMessage = () => {
    if (message.trim().length < 5) {
      toast({ title: "Tell us a bit more", description: "Please describe the issue so we can help quickly.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const sendViaWhatsApp = () => {
    if (!requireMessage()) return;
    window.open(supportWhatsAppUrl(buildMessage()), "_blank", "noopener,noreferrer");
  };

  const sendViaEmail = () => {
    if (!requireMessage()) return;
    window.location.href = supportMailtoUrl(`[${category}] Support request${selectedPg ? ` – ${selectedPg.name}` : ""}`, buildMessage());
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Help & Support"
        description="Talk to a real person on WhatsApp or phone, or find step-by-step guides in the Help Center."
        actions={<HelpLink tutorialKey="onboarding_guide" mode="article" label="Open Help Center" variant="button" />}
      />

      {/* Contact channels */}
      <section aria-label="Contact support" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ChannelCard
          icon={<MessageCircle className="h-5 w-5" />}
          title="WhatsApp"
          description="Fastest way to reach us during support hours."
          action={
            <Button asChild className="w-full">
              <a href={supportWhatsAppUrl()} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            </Button>
          }
          meta={SUPPORT_PHONE_DISPLAY}
        />
        <ChannelCard
          icon={<Phone className="h-5 w-5" />}
          title="Call us"
          description="Speak to the support team directly."
          action={
            <Button asChild variant="outline" className="w-full">
              <a href={SUPPORT_PHONE_TEL}>Call {SUPPORT_PHONE_DISPLAY}</a>
            </Button>
          }
          meta={SUPPORT_HOURS}
        />
        <ChannelCard
          icon={<Mail className="h-5 w-5" />}
          title="Email"
          description="Best for detailed issues or sharing screenshots."
          action={
            <Button asChild variant="outline" className="w-full">
              <a href={supportMailtoUrl()}>Email {SUPPORT_EMAIL}</a>
            </Button>
          }
          meta="We reply within one working day"
        />
        <ChannelCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Ease Buddy"
          description="Ask quick questions about using PG Ease."
          action={
            <Button variant="outline" className="w-full" onClick={() => window.dispatchEvent(new CustomEvent("open-ease-buddy"))}>
              Ask Ease Buddy
            </Button>
          }
          meta="Available anytime"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Message form → opens WhatsApp / email with the text pre-filled */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              We'll open WhatsApp or your email app with the details filled in, so nothing gets lost.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="support-category">What is this about?</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="support-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPg ? (
              <div className="space-y-1.5">
                <Label htmlFor="support-pg">Property</Label>
                <Input id="support-pg" value={selectedPg.name} readOnly className="bg-muted/40" />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="support-message">Describe the issue</Label>
              <Textarea
                id="support-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Example: I recorded a rent payment for Room 102 but it still shows as unpaid."
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={sendViaWhatsApp} className="gap-1.5 sm:flex-1">
                <MessageCircle className="h-4 w-4" /> Send on WhatsApp
              </Button>
              <Button onClick={sendViaEmail} variant="outline" className="gap-1.5 sm:flex-1">
                <Send className="h-4 w-4" /> Send by email
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {SUPPORT_HOURS}
            </p>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Common questions</CardTitle>
            <CardDescription>Quick answers, with a shortcut to the right screen.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">{f.q}</AccordionTrigger>
                  <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{f.a}</p>
                    {f.to ? (
                      <Button asChild variant="link" size="sm" className="h-auto p-0">
                        <Link to={f.to}>{f.toLabel ?? "Open"}</Link>
                      </Button>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-5 flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Looking for step-by-step guides?</p>
                  <p className="text-xs text-muted-foreground">The Help Center has written guides and video tutorials for every feature.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                <a href={HELP_CENTER_URL} target="_blank" rel="noopener noreferrer">
                  Visit Help Center <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function ChannelCard({
  icon,
  title,
  description,
  action,
  meta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  meta?: string;
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-auto space-y-2">
          {action}
          {meta ? <p className="truncate text-center text-[11px] text-muted-foreground">{meta}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default Support;
