"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/lib/store";
import { createProposal } from "@/lib/stellar";
import { DEFAULT_PROPOSAL_DURATION_LEDGERS, STROOPS_PER_XLM } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CreateProposalModalProps {
  onSuccess?: (newId: number) => void;
}

interface FormState {
  description: string;
  requestedFunds: string;
  durationLedgers: string;
}

const INITIAL_FORM: FormState = {
  description: "",
  requestedFunds: "",
  durationLedgers: String(DEFAULT_PROPOSAL_DURATION_LEDGERS),
};

export function CreateProposalModal({ onSuccess }: CreateProposalModalProps) {
  const { publicKey, isConnected, setTxStatus, resetTxStatus, fetchProposals } =
    useWalletStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isPending, startTransition] = useTransition();

  /* ── Validation ──────────────────────────────────────────────── */
  function validate(): boolean {
    const next: Partial<FormState> = {};

    if (!form.description.trim() || form.description.trim().length < 20) {
      next.description = "Description must be at least 20 characters.";
    }

    const funds = parseFloat(form.requestedFunds);
    if (isNaN(funds) || funds <= 0) {
      next.requestedFunds = "Enter a valid positive XLM amount.";
    }

    const dur = parseInt(form.durationLedgers, 10);
    if (isNaN(dur) || dur < 100) {
      next.durationLedgers = "Duration must be at least 100 ledgers.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /* ── Submit ──────────────────────────────────────────────────── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !publicKey) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!validate()) return;

    startTransition(async () => {
      try {
        setTxStatus("building");
        toast.loading("Building transaction…", { id: "create-tx" });

        // Convert XLM → stroops (i128)
        const stroops = BigInt(
          Math.round(parseFloat(form.requestedFunds) * STROOPS_PER_XLM),
        );
        const duration = parseInt(form.durationLedgers, 10);

        setTxStatus("signing");
        toast.loading("Waiting for Freighter signature…", { id: "create-tx" });

        const newId = await createProposal(
          publicKey,
          form.description.trim(),
          stroops,
          duration,
        );

        setTxStatus("success");
        toast.success(`Proposal #${newId} created successfully!`, {
          id: "create-tx",
        });

        setOpen(false);
        setForm(INITIAL_FORM);
        onSuccess?.(newId);
        fetchProposals(); // refresh list
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Transaction failed";
        setTxStatus("error", msg);
        toast.error(msg, { id: "create-tx" });
      } finally {
        setTimeout(resetTxStatus, 3000);
      }
    });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          id="create-proposal-btn"
          className="gap-2 bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
          disabled={!isConnected}
          title={!isConnected ? "Hubungkan dompet untuk membuat proposal" : undefined}
        >
          <Plus className="h-4 w-4" />
          Proposal Baru
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg border-border/60 bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Proposal Baru
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Minta pendanaan dari kas DAO.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Deskripsi Proyek
              <span className="ml-1 text-muted-foreground font-normal">
                ({form.description.length}/1000)
              </span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Deskripsikan proyek layanan komunitasmu secara rinci — masalah apa yang diselesaikan, bagaimana dana digunakan, dan hasil yang diharapkan…"
              className={cn(
                "min-h-[120px] resize-none text-sm",
                errors.description && "border-destructive",
              )}
              value={form.description}
              onChange={handleChange}
              maxLength={1000}
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Requested funds */}
          <div className="space-y-1.5">
            <Label htmlFor="requestedFunds" className="text-sm font-medium">
              Dana yang Diminta (XLM)
            </Label>
            <div className="relative">
              <Input
                id="requestedFunds"
                name="requestedFunds"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className={cn(
                  "pr-14 text-sm",
                  errors.requestedFunds && "border-destructive",
                )}
                value={form.requestedFunds}
                onChange={handleChange}
                disabled={isPending}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
                XLM
              </span>
            </div>
            {errors.requestedFunds && (
              <p className="text-xs text-destructive">{errors.requestedFunds}</p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="durationLedgers" className="text-sm font-medium">
              Durasi Voting (ledger)
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                ≈ {Math.round(parseInt(form.durationLedgers || "0") / 17280)} hari
              </span>
            </Label>
            <Input
              id="durationLedgers"
              name="durationLedgers"
              type="number"
              step="100"
              min="100"
              className={cn(
                "text-sm",
                errors.durationLedgers && "border-destructive",
              )}
              value={form.durationLedgers}
              onChange={handleChange}
              disabled={isPending}
            />
            {errors.durationLedgers && (
              <p className="text-xs text-destructive">{errors.durationLedgers}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              id="submit-proposal-btn"
              disabled={isPending}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Mengirim…" : "Kirim Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
