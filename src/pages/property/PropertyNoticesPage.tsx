import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Trash2, Megaphone, Clock, Calendar, Send, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import {
  createPropertyNotice,
  getPropertyNotices,
  deletePropertyNotice,
  type CreateNoticePayload,
} from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/formatters";

export default function PropertyNoticesPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const { data: noticesData, isLoading, refetch } = useQuery({
    queryKey: ["propertyNotices", selectedPgId],
    queryFn: () => (selectedPgId ? getPropertyNotices(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("maintenance");
  const [priority, setPriority] = useState("high");
  const [targetType, setTargetType] = useState("all_tenants");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const createNoticeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPgId || !title.trim() || !message.trim()) return;
      const payload: CreateNoticePayload = {
        title: title.trim(),
        message: message.trim(),
        category,
        priority,
        targetType,
        attachmentUrl: attachmentUrl.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };
      return createPropertyNotice(selectedPgId, payload);
    },
    onSuccess: () => {
      toast({ title: "Announcement Published", description: "Notice sent to all tenants successfully." });
      setCreateModalOpen(false);
      setTitle("");
      setMessage("");
      setAttachmentUrl("");
      setExpiresAt("");
      queryClient.invalidateQueries({ queryKey: ["propertyNotices", selectedPgId] });
    },
    onError: (e: any) => {
      toast({ title: "Could not publish notice", description: e?.message, variant: "destructive" });
    },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: async (noticeId: string) => {
      if (!selectedPgId) return;
      return deletePropertyNotice(selectedPgId, noticeId);
    },
    onSuccess: () => {
      toast({ title: "Notice Deleted" });
      queryClient.invalidateQueries({ queryKey: ["propertyNotices", selectedPgId] });
    },
  });

  const notices = Array.isArray(noticesData)
    ? noticesData
    : (noticesData as any)?.data || (noticesData as any)?.notices || [];

  return (
    <CanAccessPage permission="room_view">
      <div className="space-y-6">
        <PageHeader
          title="Notice Board"
          description={`Broadcast announcements and updates for ${selectedPg?.name || "your tenants"}.`}
          action={
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            >
              <Plus className="h-4 w-4" /> Create notice
            </Button>
          }
        />

        {!selectedPgId ? (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-8">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-[var(--gray-400)]" />}
              title="Select a property"
              description="Choose a PG from the switcher in the top bar to view announcements."
            />
          </div>
        ) : (
          <div className="bg-white rounded-md border border-[var(--gray-200)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--gray-200)] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--gray-900)]">
                  Active Announcements
                </h2>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">
                  Notices currently visible on the tenant mobile app ({notices.length})
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-[var(--gray-500)]">
                Loading property notices...
              </div>
            ) : notices.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-10 w-10 text-[var(--gray-400)]" />}
                title="No active notices"
                description="When you publish announcements, tenants will see them on their app."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateModalOpen(true)}
                    className="border-[var(--gray-300)]"
                  >
                    Publish first notice
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {notices.map((notice: any, idx: number) => {
                  const noticeId = notice.id || notice._id || String(idx);
                  const isHighPriority = String(notice.priority).toLowerCase() === "high";

                  return (
                    <div
                      key={noticeId}
                      className="p-4 rounded-md border border-[var(--gray-200)] bg-white hover:border-[var(--gray-300)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                              {notice.title}
                            </h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-200)] capitalize">
                              {notice.category || "General"}
                            </span>
                            {isHighPriority && (
                              <StatusBadge label="High Priority" tone="error" size="sm" />
                            )}
                          </div>
                          <p className="text-sm text-[var(--gray-700)] leading-relaxed whitespace-pre-wrap">
                            {notice.message}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-[var(--gray-500)] pt-1">
                            {notice.createdAt && (
                              <span className="flex items-center gap-1.5 tabular-nums">
                                <Clock className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                                Published {formatDate(notice.createdAt)}
                              </span>
                            )}
                            {notice.expiresAt && (
                              <span className="flex items-center gap-1.5 text-[var(--warning)] tabular-nums">
                                <Calendar className="h-3.5 w-3.5" />
                                Expires {formatDate(notice.expiresAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[var(--gray-400)] hover:text-[#B42318] hover:bg-[#FEF1F0] shrink-0 h-8 w-8"
                          onClick={() => deleteNoticeMutation.mutate(noticeId)}
                          aria-label="Delete notice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Notice Dialog */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-lg p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-[var(--gray-900)] flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[var(--brand-600)]" />
                Publish Announcement
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Title <span className="text-[#B42318]">*</span>
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water tank cleaning tomorrow"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--gray-700)]">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Notice Message <span className="text-[#B42318]">*</span>
                </Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Type the message for tenants..."
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--gray-700)]">
                  Expiry Date (optional)
                </Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="border-[var(--gray-300)]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-medium gap-1.5"
                onClick={() => createNoticeMutation.mutate()}
                disabled={createNoticeMutation.isPending || !title.trim() || !message.trim()}
              >
                <Send className="h-4 w-4" />
                {createNoticeMutation.isPending ? "Publishing..." : "Publish Announcement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
