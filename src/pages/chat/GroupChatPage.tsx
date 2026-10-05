import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Lock, Megaphone, MessageSquare, Search, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { useApp } from "@/context/AppContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePermissions } from "@/context/PermissionContext";
import { useGroupChat, type FirestoreChatMessage } from "@/hooks/useGroupChat";
import { authStorage } from "@/api/http";
import { auth } from "@/lib/firebase";
import { CanAccessPage } from "@/components/PermissionGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { cn } from "@/lib/utils";

function formatWhen(message: FirestoreChatMessage): string {
  const stamp = message.created_at;
  if (!stamp || typeof stamp.toDate !== "function") return "";
  try {
    const date = stamp.toDate();
    const sameDay = date.toDateString() === new Date().toDateString();
    const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    if (sameDay) return time;
    return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${time}`;
  } catch {
    return "";
  }
}

function roleLabel(role: FirestoreChatMessage["sender_role"] | "owner" | "tenant" | "staff"): string {
  if (role === "owner") return "Owner";
  if (role === "staff") return "Staff";
  return "Tenant";
}

function initials(name?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() || "").join("");
  return letters || "?";
}

function dayLabel(message: FirestoreChatMessage): string {
  try {
    const date = message.created_at?.toDate?.();
    if (!date) return "";
    if (date.toDateString() === new Date().toDateString()) return "Today";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function GroupChatPage() {
  const { toast } = useToast();
  const { selectedPgId, properties } = useApp();
  const { hasFeature, isLoading: entitlementsLoading, isExpired } = useEntitlements();
  const { isOwner } = usePermissions();
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState("");
  const [asNotice, setAsNotice] = useState(false);
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const property = properties.find((p) => p.id === selectedPgId);
  const userRole = isOwner ? "owner" : "staff";
  const senderName = authStorage.getPropertyOwner()?.name || (isOwner ? "Property owner" : "Staff");
  const unlocked = hasFeature("pg_group_chat");

  const { messages, members, loading, error, isConnected, sendMessage } = useGroupChat(
    unlocked ? property?.id : undefined,
    userRole,
    reloadKey,
  );

  const myId = auth?.currentUser?.uid;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) => m.text.toLowerCase().includes(q) || (m.sender_name || "").toLowerCase().includes(q),
    );
  }, [messages, query]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: FirestoreChatMessage[] }[] = [];
    visible.forEach((message) => {
      const label = dayLabel(message) || "Messages";
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) groups.push({ label, items: [message] });
      else last.items.push(message);
    });
    return groups;
  }, [visible]);

  useEffect(() => {
    if (!query) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, query]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending || !isConnected) return;
    setSending(true);
    try {
      await sendMessage(text, senderName, null, asNotice);
      setDraft("");
      setAsNotice(false);
    } catch {
      toast({
        title: "Message not sent",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <CanAccessPage permission="chat_view">
      <div className="flex h-[calc(100vh-7.5rem)] min-h-[28rem] flex-col">
        {entitlementsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !unlocked ? (
          <EmptyState
            icon={<Lock className="h-6 w-6" />}
            title={isExpired ? "Group chat needs an active plan" : "Group chat is on the Pro plan"}
            description="Tenants and staff can message this property from one place. Your existing messages stay available after you renew or upgrade."
            action={
              <Button asChild>
                <Link to="/plans">{isExpired ? "Renew plan" : "See plans"}</Link>
              </Button>
            }
          />
        ) : !property ? (
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title="Select a property"
            description="Choose a PG from the switcher to open its group chat."
          />
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-md border border-[var(--gray-200)] bg-white">
            <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--gray-200)] bg-[var(--gray-50)] md:flex">
              <div className="border-b border-[var(--gray-200)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--gray-900)]">Members</p>
                <p className="text-xs text-[var(--gray-500)]">{members.length} in this property</p>
              </div>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                {members.length === 0 ? (
                  <p className="px-2 py-4 text-xs text-[var(--gray-500)]">No members listed yet.</p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2.5 rounded-md px-2 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-[var(--brand-700)] ring-1 ring-[var(--gray-200)]">
                        {initials(member.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[var(--gray-900)]">{member.name || "Member"}</span>
                        <span className="block truncate text-xs text-[var(--gray-500)]">
                          {roleLabel(member.role)}
                          {member.room_number ? ` · ${member.room_number}` : ""}
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center gap-3 border-b border-[var(--gray-200)] px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-600)] text-sm font-semibold text-white">
                {initials(property.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold text-[var(--gray-900)]">{property.name}</h1>
                <p className="flex items-center gap-1.5 truncate text-xs text-[var(--gray-500)]">
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-[var(--success-dot)]" : "bg-[var(--gray-400)]"}`} aria-hidden />
                  {loading ? "Connecting…" : isConnected ? "Live" : "Unavailable"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label={searchOpen ? "Close search" : "Search messages"}
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setQuery("");
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 md:hidden" aria-label="View members">
                    <Users className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex w-full flex-col sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Members</SheetTitle>
                    <SheetDescription>People in this property’s group chat.</SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members listed yet.</p>
                    ) : (
                      members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-50)] text-xs font-semibold text-[var(--brand-700)]">
                            {initials(member.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{member.name || "Member"}</p>
                            <p className="text-xs text-muted-foreground">
                              {roleLabel(member.role)}
                              {member.room_number ? ` · Room ${member.room_number}` : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </header>

            {searchOpen ? (
              <div className="border-b border-border px-4 py-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages"
                  aria-label="Search messages"
                  className="h-9"
                  autoFocus
                />
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--gray-50)] px-3 py-4 sm:px-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-2/3" />
                  <Skeleton className="ml-auto h-12 w-1/2" />
                  <Skeleton className="h-12 w-3/5" />
                </div>
              ) : error && messages.length === 0 ? (
                <ErrorState
                  title="Couldn't open this chat"
                  description="The group chat didn't load. Try again in a moment."
                  onRetry={() => setReloadKey((n) => n + 1)}
                />
              ) : visible.length === 0 ? (
                <EmptyState
                  compact
                  icon={<MessageSquare className="h-6 w-6" />}
                  title={query ? "No messages match your search" : "No messages yet"}
                  description={query ? "Try a different word." : "Send a message to everyone in this property."}
                />
              ) : (
                <div className="space-y-5">
                  {grouped.map((group) => (
                    <section key={group.label}>
                      <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--gray-500)]">{group.label}</p>
                      <ul className="space-y-2">
                        {group.items.map((message) => {
                          const mine = Boolean(myId) && message.sender_id === myId;
                          const notice = message.type === "NOTICE";
                          const when = formatWhen(message);
                          if (notice) {
                            return (
                              <li key={message.id} className="mx-auto max-w-lg rounded-md border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2.5 text-sm">
                                <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--warning-text)]">
                                  <Megaphone className="h-3.5 w-3.5" aria-hidden />
                                  Notice · {message.sender_name || roleLabel(message.sender_role)}
                                  {when ? ` · ${when}` : ""}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-[var(--gray-900)]">{message.text}</p>
                              </li>
                            );
                          }
                          return (
                            <li key={message.id} className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                              {!mine ? (
                                <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-semibold text-[var(--brand-700)] ring-1 ring-[var(--gray-200)]">
                                  {initials(message.sender_name)}
                                </span>
                              ) : null}
                              <div className={cn("max-w-[85%] rounded-md px-3 py-2 text-sm sm:max-w-md", mine ? "bg-[var(--brand-50)] text-[var(--gray-900)] ring-1 ring-[var(--brand-100)]" : "border border-[var(--gray-200)] bg-white text-[var(--gray-900)]")}>
                                {!mine ? (
                                  <p className="mb-0.5 text-xs font-medium text-[var(--brand-700)]">
                                    {message.sender_name || roleLabel(message.sender_role)}
                                    {message.sender_room ? ` · ${message.sender_room}` : ""}
                                  </p>
                                ) : null}
                                <p className="whitespace-pre-wrap">{message.text}</p>
                                {message.media_url ? (
                                  <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-[var(--brand-700)] underline">
                                    View attachment
                                  </a>
                                ) : null}
                                {when ? <p className="mt-1 text-right text-[11px] text-[var(--gray-500)]">{when}</p> : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <form
              className="border-t border-[var(--gray-200)] bg-white p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <div className="flex items-end gap-2 pr-14">
                <button
                  type="button"
                  onClick={() => setAsNotice((on) => !on)}
                  aria-pressed={asNotice}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium",
                    asNotice
                      ? "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]"
                      : "border-[var(--gray-200)] bg-white text-[var(--gray-600)]",
                  )}
                >
                  <Megaphone className="h-3.5 w-3.5" aria-hidden />
                  Notice
                </button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={asNotice ? "Write a notice for everyone" : isConnected ? "Write a message" : "Chat is unavailable"}
                  aria-label="Message"
                  disabled={!isConnected || sending}
                  className="h-10"
                />
                <Button type="submit" disabled={!isConnected || sending || !draft.trim()} aria-label="Send message" className="h-10">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
            </div>
          </div>
        )}
      </div>
    </CanAccessPage>
  );
}
