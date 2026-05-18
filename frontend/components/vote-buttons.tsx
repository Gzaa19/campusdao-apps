"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/lib/store";
import { castVote } from "@/lib/stellar";
import { ProposalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  proposalId: number;
  proposalStatus: ProposalStatus;
  onVoteSuccess?: () => void;
}

export function VoteButtons({
  proposalId,
  proposalStatus,
  onVoteSuccess,
}: VoteButtonsProps) {
  const { publicKey, isConnected, votedProposals, markAsVoted, setTxStatus, resetTxStatus } =
    useWalletStore();

  const [isPending, startTransition] = useTransition();
  const [activeVote, setActiveVote] = useState<"for" | "against" | null>(null);

  const isActive = proposalStatus === ProposalStatus.Active;
  const hasVoted = votedProposals.has(proposalId);

  const handleVote = (support: boolean) => {
    if (!isConnected || !publicKey) {
      toast.error("Connect your wallet first");
      return;
    }

    const voteType = support ? "for" : "against";
    setActiveVote(voteType);

    startTransition(async () => {
      try {
        setTxStatus("building");
        toast.loading("Building transaction…", { id: "vote-tx" });

        setTxStatus("simulating");
        toast.loading("Simulating…", { id: "vote-tx" });

        // 1 vote = 1 unit weight
        await castVote(publicKey, proposalId, support, 1n);

        setTxStatus("success");
        markAsVoted(proposalId);
        onVoteSuccess?.();

        toast.success(
          `Vote ${support ? "in favour of" : "against"} proposal #${proposalId} submitted!`,
          { id: "vote-tx" },
        );
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Transaction failed";
        setTxStatus("error", msg);
        toast.error(msg, { id: "vote-tx" });
      } finally {
        setActiveVote(null);
        setTimeout(resetTxStatus, 3000);
      }
    });
  };

  /* ── Already voted ──────────────────────────────────────────── */
  if (hasVoted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        Kamu sudah memberikan suara pada proposal ini.
      </div>
    );
  }

  /* ── Not active ─────────────────────────────────────────────── */
  if (!isActive) {
    return (
      <p className="text-sm text-muted-foreground">
        Voting telah ditutup untuk proposal ini.
      </p>
    );
  }

  /* ── Not connected ──────────────────────────────────────────── */
  if (!isConnected) {
    return (
      <p className="text-sm text-muted-foreground">
        Hubungkan dompetmu untuk mulai memilih.
      </p>
    );
  }

  /* ── Voting UI ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Approve */}
      <Button
        id={`vote-approve-${proposalId}`}
        onClick={() => handleVote(true)}
        disabled={isPending}
        className={cn(
          "flex-1 gap-2 font-semibold transition-all duration-200",
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
          "hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
          "disabled:opacity-50",
        )}
        variant="outline"
      >
        {isPending && activeVote === "for" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="h-4 w-4" />
        )}
        Setuju
      </Button>

      {/* Reject */}
      <Button
        id={`vote-reject-${proposalId}`}
        onClick={() => handleVote(false)}
        disabled={isPending}
        className={cn(
          "flex-1 gap-2 font-semibold transition-all duration-200",
          "bg-rose-500/10 text-rose-400 border border-rose-500/30",
          "hover:bg-rose-500 hover:text-white hover:border-rose-500",
          "disabled:opacity-50",
        )}
        variant="outline"
      >
        {isPending && activeVote === "against" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="h-4 w-4" />
        )}
        Tolak
      </Button>
    </div>
  );
}
