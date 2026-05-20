"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { VoteButtons } from "@/components/vote-buttons";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import { useWalletStore } from "@/lib/store";
import { getProposal, executeProposal } from "@/lib/stellar";
import { ProposalStatus } from "@/lib/types";
import type { Proposal } from "@/lib/types";
import { STROOPS_PER_XLM } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────

function formatXLM(stroops: bigint): string {
  const xlm = Number(stroops) / STROOPS_PER_XLM;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(xlm);
}

const STATUS_META: Record<ProposalStatus, { label: string; icon: React.ElementType; cls: string }> = {
  [ProposalStatus.Active]:   { label: "Aktif",   icon: Clock,        cls: "bg-blue-500/10 text-blue-400 ring-blue-400/30" },
  [ProposalStatus.Passed]:   { label: "Lulus",   icon: CheckCircle2, cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-400/30" },
  [ProposalStatus.Rejected]: { label: "Ditolak", icon: XCircle,      cls: "bg-rose-500/10 text-rose-400 ring-rose-400/30" },
  [ProposalStatus.Executed]: { label: "Dieksekusi", icon: Zap,          cls: "bg-amber-500/10 text-amber-400 ring-amber-400/30" },
};

function VoteStat({
  label,
  value,
  pct,
  color,
  icon: Icon,
}: {
  label: string;
  value: bigint;
  pct: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex-1 rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-sm font-medium", color)}>
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className="text-xl font-bold tabular-nums">{Number(value).toLocaleString()}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color === "text-emerald-400" ? "bg-emerald-500" : "bg-rose-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{pct}% dari total suara</p>
    </div>
  );
}

// ── Page Component ───────────────────────────────────────────

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { publicKey, isConnected, setTxStatus, resetTxStatus, checkVoteStatus } = useWalletStore();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExecuting, startExecuteTransition] = useTransition();

  // Load proposal
  useEffect(() => {
    if (!id || isNaN(id)) {
      setLoadError("Invalid proposal ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getProposal(id)
      .then((p) => {
        if (!p) {
          setLoadError("Proposal not found");
        } else {
          setProposal(p);
          // Check if user has voted on this proposal
          if (isConnected) {
            checkVoteStatus(id);
          }
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load proposal");
      })
      .finally(() => setIsLoading(false));
  }, [id, isConnected, checkVoteStatus]);

  // Handle execute
  function handleExecute() {
    if (!isConnected || !publicKey || !proposal) return;

    startExecuteTransition(async () => {
      try {
        setTxStatus("building");
        toast.loading("Executing proposal…", { id: "exec-tx" });

        await executeProposal(publicKey, proposal.id);

        setTxStatus("success");
        toast.success("Proposal executed successfully!", { id: "exec-tx" });

        // Refresh proposal
        const updated = await getProposal(id);
        if (updated) setProposal(updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Execution failed";
        setTxStatus("error", msg);
        toast.error(msg, { id: "exec-tx" });
      } finally {
        setTimeout(resetTxStatus, 3000);
      }
    });
  }

  // Vote counts
  const totalVotes = proposal ? proposal.votesFor + proposal.votesAgainst : 0n;
  const forPct = totalVotes === 0n ? 0 : Math.round(Number((proposal!.votesFor * 100n) / totalVotes));
  const againstPct = 100 - forPct;

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Memuat proposal…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────── */
  if (loadError || !proposal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive opacity-60" />
          <h2 className="mt-4 text-xl font-semibold">
            {loadError ?? "Proposal not found"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Proposal mungkin tidak ada atau RPC endpoint sedang tidak tersedia.
          </p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dasbor
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_META[proposal.status] ?? STATUS_META[ProposalStatus.Active];
  const StatusIcon = statusMeta.icon;
  const isActive = proposal.status === ProposalStatus.Active;
  const canExecute = isConnected && !isActive && proposal.status === ProposalStatus.Passed;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Semua Proposal
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Left: Main content ─────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  Proposal #{proposal.id}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "flex items-center gap-1 text-xs ring-1 ring-inset border-0 px-2 py-0.5",
                    statusMeta.cls,
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusMeta.label}
                </Badge>
              </div>

              <h1 className="text-xl font-bold leading-snug sm:text-2xl">
                {proposal.description}
              </h1>
            </div>

            {/* Funding ask */}
            <Card className="border-border/60 bg-primary/5 ring-1 ring-primary/10">
              <CardContent className="py-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-primary">
                  {formatXLM(proposal.requestedFunds)}
                </span>
                <span className="text-sm font-medium text-primary/70">XLM diminta</span>
              </CardContent>
            </Card>

            {/* Vote counts */}
            <div className="flex flex-col sm:flex-row gap-3">
              <VoteStat
                label="Suara Setuju"
                value={proposal.votesFor}
                pct={forPct}
                color="text-emerald-400"
                icon={TrendingUp}
              />
              <VoteStat
                label="Suara Menolak"
                value={proposal.votesAgainst}
                pct={againstPct}
                color="text-rose-400"
                icon={TrendingDown}
              />
            </div>

            {/* Vote buttons */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Berikan Suaramu</h2>
              <VoteButtons
                proposalId={proposal.id}
                proposalStatus={proposal.status}
                onVoteSuccess={() => {
                  getProposal(id).then((p) => p && setProposal(p));
                }}
              />
            </div>

            {/* Execute button (admin/post-vote) */}
            {canExecute && (
              <>
                <Separator className="opacity-50" />
                <div className="space-y-2">
                  <h2 className="text-sm font-semibold">Eksekusi Proposal</h2>
                  <p className="text-xs text-muted-foreground">
                    Batas waktu voting telah habis dan proposal ini disetujui. Anggota mana pun dapat mengeksekusi untuk mentransfer dana.
                  </p>
                  <Button
                    id={`execute-proposal-${proposal.id}`}
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Eksekusi &amp; Transfer Dana
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ── Right: Metadata + AI ────────────────────────── */}
          <div className="space-y-4">
            {/* Metadata card */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Pembuat
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/public/account/${proposal.creator}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    >
                      {`${proposal.creator.slice(0, 6)}…${proposal.creator.slice(-4)}`}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Tenggat Waktu
                    </span>
                    <span className="font-mono text-xs">
                      Ledger {proposal.deadline.toLocaleString()}
                    </span>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Suara</span>
                    <span className="font-semibold">{Number(totalVotes).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <AIAnalysisPanel
              proposalId={proposal.id}
              description={proposal.description}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
