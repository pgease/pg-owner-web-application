import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Building2, ArrowRight } from "lucide-react";

interface CelebrationDialogProps {
  open: boolean;
  onClose: () => void;
  pgName?: string;
}

/** Tiny confetti piece */
const Confetti = ({ delay, x }: { delay: number; x: number }) => {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.7)",
    "#f59e0b",
    "#10b981",
    "#6366f1",
    "#ec4899",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      initial={{ y: -20, x, opacity: 1, rotate: 0, scale: 0 }}
      animate={{
        y: 400,
        x: x + (Math.random() - 0.5) * 120,
        opacity: [1, 1, 0],
        rotate: rotation + 720,
        scale: [0, 1.2, 0.8],
      }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeOut" }}
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
};

export function CelebrationDialog({ open, onClose, pgName }: CelebrationDialogProps) {
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; delay: number; x: number }[]>([]);

  useEffect(() => {
    if (open) {
      const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        x: Math.random() * 300 - 150,
      }));
      setConfettiPieces(pieces);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-primary/20 overflow-hidden">
        {/* Confetti container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex justify-center">
          <AnimatePresence>
            {open &&
              confettiPieces.map((p) => (
                <Confetti key={p.id} delay={p.delay} x={p.x} />
              ))}
          </AnimatePresence>
        </div>

        <div className="relative flex flex-col items-center text-center gap-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15"
          >
            <PartyPopper className="h-10 w-10 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h2 className="text-xl font-bold tracking-tight">
              🎉 Congratulations!
            </h2>
            {pgName && (
              <p className="text-base font-semibold text-primary">
                "{pgName}" is successfully set up!
              </p>
            )}
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Welcome to PgEase! You can now start managing your property from the dashboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-2 w-full mt-2"
          >
            <Button onClick={onClose} className="w-full gap-2">
              <Building2 className="h-4 w-4" /> Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
