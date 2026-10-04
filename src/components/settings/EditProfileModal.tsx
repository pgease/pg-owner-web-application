import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/propertyOwner";
import { authStorage } from "@/api/http";
import { useUpdateMeMutation } from "@/hooks/usePropertyOwnerQueries";
import { toast } from "@/components/ui/use-toast";
import { User, Mail, Phone, Loader2, Check } from "lucide-react";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditProfileModal({ open, onOpenChange, onSuccess }: EditProfileModalProps) {
  const meQuery = useQuery({
    queryKey: ["property-owner", "me"],
    queryFn: getMe,
    enabled: open,
  });

  const me = meQuery.data || (authStorage.getPropertyOwner() as any);
  const updateMeMut = useUpdateMeMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    if (open) {
      setName(me?.name || "");
      setEmail(me?.email || "");
      setPhone(me?.mobileContactNumber || "");
      setErrors({});
    }
  }, [open, me?.name, me?.email, me?.mobileContactNumber]);

  const validate = () => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      const updated = await updateMeMut.mutateAsync({
        name: name.trim(),
        email: email.trim() || undefined,
      });

      if (updated) {
        authStorage.setPropertyOwner(updated);
      }

      toast({
        title: "Profile Updated",
        description: "Your name and email have been saved successfully.",
      });

      onOpenChange(false);
      onSuccess?.();
      void meQuery.refetch();
    } catch (err: any) {
      toast({
        title: "Could not update profile",
        description: err?.message || "Please check your details and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-white border border-[var(--gray-200)] shadow-xl">
        <div className="bg-[var(--gray-50)] px-6 py-5 border-b border-[var(--gray-200)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] flex items-center justify-center font-bold text-sm border border-[var(--brand-200)]">
              {(name || me?.name || "O").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[var(--gray-900)]">
                Edit Owner Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--gray-500)] mt-0.5">
                Update your registered owner name and official contact email.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="owner-edit-name" className="text-xs font-semibold text-[var(--gray-700)] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[var(--gray-500)]" />
              <span>Full Name</span>
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="owner-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Rahul Sharma"
              className={`h-10 text-sm ${errors.name ? "border-red-500 focus-visible:ring-red-400" : ""}`}
              disabled={updateMeMut.isPending}
              autoFocus
            />
            {errors.name ? (
              <p className="text-[11px] text-red-500 font-medium">{errors.name}</p>
            ) : (
              <p className="text-[11px] text-[var(--gray-500)]">This name appears on tenant receipts and property notices.</p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="owner-edit-email" className="text-xs font-semibold text-[var(--gray-700)] flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[var(--gray-500)]" />
              <span>Email Address</span>
            </Label>
            <Input
              id="owner-edit-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="e.g. owner@example.com"
              className={`h-10 text-sm ${errors.email ? "border-red-500 focus-visible:ring-red-400" : ""}`}
              disabled={updateMeMut.isPending}
            />
            {errors.email ? (
              <p className="text-[11px] text-red-500 font-medium">{errors.email}</p>
            ) : (
              <p className="text-[11px] text-[var(--gray-500)]">Used for payment reconciliation statements and monthly digests.</p>
            )}
          </div>

          {/* Registered Mobile (Read-only reference) */}
          {phone ? (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-[var(--gray-500)] flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                <span>Registered Mobile Number</span>
              </Label>
              <div className="h-10 px-3 flex items-center rounded-md border border-[var(--gray-200)] bg-[var(--gray-50)] text-xs text-[var(--gray-600)] font-mono">
                {phone}
              </div>
              <p className="text-[10px] text-[var(--gray-400)]">Mobile number is linked to your primary OTP login account.</p>
            </div>
          ) : null}

          <DialogFooter className="pt-4 border-t border-[var(--gray-100)] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={updateMeMut.isPending}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMeMut.isPending || !name.trim()}
              className="h-9 px-4 text-xs font-medium bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-1.5"
            >
              {updateMeMut.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
