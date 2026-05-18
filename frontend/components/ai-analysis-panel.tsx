"use client";

import { useState, useTransition } from "react";
import { Bot, Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AIAnalysisResponse } from "@/lib/types";

interface AIAnalysisPanelProps {
  proposalId: number;
  description: string;
}

export function AIAnalysisPanel({ proposalId, description }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/analyze-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId, description }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.statusText}`);
        }

        const data: AIAnalysisResponse = await res.json();
        if (data.error) throw new Error(data.error);
        setAnalysis(data);
        setExpanded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    });
  };

  /* ── Quality score colour ─────────────────────────────────── */
  function scoreColor(score: number) {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            Analisis Proposal
          </CardTitle>

          {analysis && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => setExpanded((p) => !p)}
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Sembunyikan</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Tampilkan</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trigger button */}
        {!analysis && !isPending && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dapatkan evaluasi otomatis tentang struktur dan kelengkapan proposal ini.
            </p>
            <Button
              id={`analyze-proposal-${proposalId}`}
              onClick={handleAnalyze}
              disabled={isPending}
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60"
            >
              <Sparkles className="h-4 w-4" />
              Analisis Proposal
            </Button>
          </div>
        )}

        {/* Loading */}
        {isPending && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Menganalisis proposal…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Analisis gagal</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analysis && expanded && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
            {/* Score */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Skor Kualitas
              </span>
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  scoreColor(analysis.qualityScore),
                )}
              >
                {analysis.qualityScore}
                <span className="text-sm font-normal text-muted-foreground">/100</span>
              </span>
            </div>

            {/* Score bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  analysis.qualityScore >= 75
                    ? "bg-emerald-500"
                    : analysis.qualityScore >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500",
                )}
                style={{ width: `${analysis.qualityScore}%` }}
              />
            </div>

            <Separator className="opacity-50" />

            {/* Summary */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ringkasan
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {analysis.summary}
              </p>
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Saran
                </p>
                <ul className="space-y-1.5">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Re-analyze */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAnalyze}
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3 w-3" /> Analisis Ulang
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
