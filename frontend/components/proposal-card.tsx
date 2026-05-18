"use client";

import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Proposal } from "@/lib/types";
import { ProposalStatus } from "@/lib/types";
import { STROOPS_PER_XLM } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProposalCardProps {
  proposal: Proposal;
  currentLedger?: number;
}

// ── Helpers ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProposalStatus,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    glowClass: string;
  }
> = {
  [ProposalStatus.Active]: {
    label: "Aktif",
    icon: Clock,
    badgeClass:
      "bg-blue-500/10 text-blue-400 ring-blue-400/30 hover:bg-blue-500/20",
    glowClass: "shadow-blue-500/5",
  },
  [ProposalStatus.Passed]: {
    label: "Lulus",
    icon: CheckCircle2,
    badgeClass:
      "bg-emerald-500/10 text-emerald-400 ring-emerald-400/30 hover:bg-emerald-500/20",
    glowClass: "shadow-emerald-500/5",
  },
  [ProposalStatus.Rejected]: {
    label: "Ditolak",
    icon: XCircle,
    badgeClass:
      "bg-rose-500/10 text-rose-400 ring-rose-400/30 hover:bg-rose-500/20",
    glowClass: "shadow-rose-500/5",
  },
  [ProposalStatus.Executed]: {
    label: "Dieksekusi",
    icon: Zap,
    badgeClass:
      "bg-amber-500/10 text-amber-400 ring-amber-400/30 hover:bg-amber-500/20",
    glowClass: "shadow-amber-500/5",
  },
};

function formatXLM(stroops: bigint): string {
  const xlm = Number(stroops) / STROOPS_PER_XLM;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(xlm);
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function VoteBar({ votesFor, votesAgainst }: { votesFor: bigint; votesAgainst: bigint }) {
  const total = votesFor + votesAgainst;
  const forPct = total === 0n ? 50 : Number((votesFor * 100n) / total);
  const againstPct = 100 - forPct;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1 text-emerald-500">
          <TrendingUp className="h-3 w-3" /> Setuju {forPct}%
        </span>
        <span className="text-rose-500">Tolak {againstPct}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${forPct}%` }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-full bg-rose-500 transition-all duration-500"
          style={{ width: `${againstPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

export function ProposalCard({ proposal, currentLedger }: ProposalCardProps) {
  const config = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG[ProposalStatus.Active];
  const StatusIcon = config.icon;
  const isActive = proposal.status === ProposalStatus.Active;
  const ledgersLeft =
    currentLedger && isActive
      ? Math.max(0, proposal.deadline - currentLedger)
      : null;

  const creatorShort = `${proposal.creator.slice(0, 6)}…${proposal.creator.slice(-4)}`;

  return (
    <Link href={`/proposals/${proposal.id}`} id={`proposal-card-${proposal.id}`}>
      <Card
        className={cn(
          "group relative h-full overflow-hidden border-border/60 bg-card transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-lg hover:border-primary/30",
          config.glowClass,
        )}
      >
        {/* Active glow accent */}
        {isActive && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            {/* Proposal # */}
            <span className="text-xs font-mono font-semibold text-muted-foreground">
              #{proposal.id}
            </span>

            {/* Status badge */}
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-1 text-xs font-medium ring-1 ring-inset border-0 px-2 py-0.5",
                config.badgeClass,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="mt-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
            {truncate(proposal.description, 120)}
          </p>
        </CardHeader>

        <CardContent className="pb-3 space-y-4">
          {/* Requested funds */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-foreground">
              {formatXLM(proposal.requestedFunds)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">XLM</span>
          </div>

          <Separator className="opacity-50" />

          {/* Vote bar */}
          <VoteBar
            votesFor={proposal.votesFor}
            votesAgainst={proposal.votesAgainst}
          />
        </CardContent>

        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground pt-0">
          {/* Creator */}
          <span className="font-mono">{creatorShort}</span>

          <div className="flex items-center gap-3">
            {/* Ledgers left */}
            {ledgersLeft !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                sisa {ledgersLeft.toLocaleString()} ledger
              </span>
            )}

            {/* View link arrow */}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
