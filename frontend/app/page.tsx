"use client";

import { useEffect } from "react";
import {
  RefreshCw,
  Vote,
  CheckCircle2,
  Clock,
  Zap,
  FileQuestion,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { ProposalCard } from "@/components/proposal-card";
import { CreateProposalModal } from "@/components/create-proposal-modal";
import { useWalletStore } from "@/lib/store";
import { ProposalStatus } from "@/lib/types";
import type { Proposal } from "@/lib/types";

// ── Stat Card ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${color}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <FileQuestion className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-semibold">Belum ada proposal aktif</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Kas menunggu idemu. Hubungkan dompetmu untuk meminta pendanaan.
        </p>
      </div>
    </div>
  );
}

// ── Skeleton Loader ──────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="h-[260px] rounded-xl border border-border/40 bg-card overflow-hidden">
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-8 rounded bg-muted animate-shimmer" />
          <div className="h-5 w-16 rounded-full bg-muted animate-shimmer" />
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-3 w-full rounded bg-muted animate-shimmer" />
          <div className="h-3 w-4/5 rounded bg-muted animate-shimmer" />
          <div className="h-3 w-3/5 rounded bg-muted animate-shimmer" />
        </div>
        <div className="h-7 w-24 rounded bg-muted animate-shimmer mt-2" />
        <div className="h-1.5 w-full rounded-full bg-muted animate-shimmer mt-6" />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function DashboardPage() {
  const { proposals, isLoadingProposals, proposalsError, fetchProposals, isConnected } =
    useWalletStore();

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Split proposals into active and past
  const activeProposals = proposals.filter(
    (p: Proposal) => p.status === ProposalStatus.Active,
  );
  const pastProposals = proposals.filter(
    (p: Proposal) => p.status !== ProposalStatus.Active,
  );
  const executedCount = proposals.filter(
    (p: Proposal) => p.status === ProposalStatus.Executed,
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative gradient-hero">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/20">
                <Vote className="h-3 w-3" />
                Stellar Mainnet · Live
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Tata Kelola
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Beri suara untuk inisiatif pendanaan komunitas dan tentukan masa depan CampusDAO.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                id="refresh-proposals-btn"
                variant="outline"
                size="sm"
                onClick={fetchProposals}
                disabled={isLoadingProposals}
                className="gap-2 border-border/60"
              >
                {isLoadingProposals ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Segarkan
              </Button>
              <CreateProposalModal onSuccess={() => fetchProposals()} />
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total"
              value={proposals.length}
              icon={LayoutGrid}
              color="bg-primary/10 text-primary"
            />
            <StatCard
              label="Aktif"
              value={activeProposals.length}
              icon={Clock}
              color="bg-blue-500/10 text-blue-400"
            />
            <StatCard
              label="Dieksekusi"
              value={executedCount}
              icon={Zap}
              color="bg-amber-500/10 text-amber-400"
            />
            <StatCard
              label="Lulus"
              value={proposals.filter((p: Proposal) => p.status === ProposalStatus.Passed).length}
              icon={CheckCircle2}
              color="bg-emerald-500/10 text-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
        {/* Error */}
        {proposalsError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Gagal memuat proposal: {proposalsError}
          </div>
        )}

        {/* ── Active ───────────────────────────────────────────── */}
        <section id="active-proposals">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Proposal Aktif
            </h2>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 ring-1 ring-blue-400/30">
              {activeProposals.length}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoadingProposals ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : activeProposals.length === 0 ? (
              <EmptyState />
            ) : (
              activeProposals.map((p: Proposal) => (
                <ProposalCard key={p.id} proposal={p} />
              ))
            )}
          </div>
        </section>

        {/* ── Past ─────────────────────────────────────────────── */}
        {(pastProposals.length > 0 || !isLoadingProposals) && (
          <section id="past-proposals">
            <Separator className="mb-10 opacity-50" />
            <div className="mb-5 flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
                Proposal Terdahulu
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                {pastProposals.length}
              </span>
            </div>

            {pastProposals.length === 0 && !isLoadingProposals ? (
              <p className="text-sm text-muted-foreground">
                Belum ada proposal yang selesai.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
                {pastProposals.map((p: Proposal) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
