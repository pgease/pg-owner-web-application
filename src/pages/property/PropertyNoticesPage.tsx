import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Trash2, Megaphone, AlertCircle, Clock, CheckCircle, Calendar, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export default function PropertyNoticesPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const { data: noticesData, isLoading } = useQuery({
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
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-teal-600" /> Property Notices & Announcements
            </h1>
            <p className="text-sm text-muted-foreground">
              Publish announcements, emergency updates, and maintenance notices for {selectedPg?.name || "your tenants"}.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-bold">
            <Plus className="h-4 w-4" /> Create Notice
          </Button>
        </div>

        {/* NOTICES LIST */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">Active Announcements ({notices.length})</CardTitle>
            <CardDescription>All broadcasted communications displayed on the tenant mobile app.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading property notices...</div>
            ) : notices.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No active notices broadcasted yet.</p>
                <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                  Publish First Notice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice: any, idx: number) => {
                  const noticeId = notice.id || notice._id || String(idx);
                  const isHighPriority = notice.priority === "high";

                  return (
                    <div
                      key={noticeId}
                      className={`rounded-xl p-4 border transition-all ${
                        isHighPriority
                          ? "bg-amber-50/40 border-amber-300"
                          : "bg-slate-50/60 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground text-base">{notice.title}</h3>
                            <Badge
                              variant="outline"
                              className={
                                isHighPriority
                                  ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                                  : "bg-teal-100 text-teal-800 border-teal-200"
                              }
                            >
                              {notice.category || "General"}
                            </Badge>
                            {isHighPriority && (
                              <Badge className="bg-red-600 text-white font-bold text-[10px]">High Priority</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{notice.message}</p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                            {notice.createdAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Published {new Date(notice.createdAt).toLocaleDateString()}
                              </span>
                            )}
                            {notice.expiresAt && (
                              <span className="flex items-center gap-1 text-amber-700 font-medium">
                                <Calendar className="h-3.5 w-3.5" /> Expires {new Date(notice.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600 shrink-0"
                          onClick={() => deleteNoticeMutation.mutate(noticeId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CREATE NOTICE MODAL */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 font-bold">
                <Megaphone className="h-5 w-5" /> Publish New Notice
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Water Supply Interruption Tomorrow" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="event">Event / Gathering</SelectItem>
                      <SelectItem value="general">General Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">🔥 High</SelectItem>
                      <SelectItem value="medium">⚡ Medium</SelectItem>
                      <SelectItem value="low">ℹ️ Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notice Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Type announcement details for tenants..." />
              </div>

              <div className="space-y-1.5">
                <Label>Expiry Date (Optional)</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5" onClick={() => createNoticeMutation.mutate()} disabled={createNoticeMutation.isPending || !title.trim() || !message.trim()}>
                <Send className="h-4 w-4" /> Publish Announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
