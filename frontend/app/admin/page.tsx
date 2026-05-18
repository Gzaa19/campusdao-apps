"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldX, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { useWalletStore } from "@/lib/store";
import { issueStudentCredential, revokeCredential } from "@/lib/stellar";
import { cn } from "@/lib/utils";

function CredentialForm({
  action,
  onSubmit,
  isPending,
}: {
  action: "issue" | "revoke";
  onSubmit: (address: string) => void;
  isPending: boolean;
}) {
  const [address, setAddress] = useState("");

  const isIssue = action === "issue";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(address.trim());
        setAddress("");
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor={`student-address-${action}`} className="text-sm">
          Alamat Dompet Mahasiswa
        </Label>
        <Input
          id={`student-address-${action}`}
          placeholder="G…"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isPending}
          className="font-mono text-sm"
        />
      </div>
      <Button
        type="submit"
        id={`${action}-credential-btn`}
        disabled={isPending || !address.trim()}
        variant="outline"
        className={cn(
          "w-full gap-2 font-medium transition-all",
          isIssue
            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
            : "border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isIssue ? (
          <ShieldCheck className="h-4 w-4" />
        ) : (
          <ShieldX className="h-4 w-4" />
        )}
        {isPending
          ? "Memproses…"
          : isIssue
            ? "Berikan Kredensial"
            : "Cabut Kredensial"}
      </Button>
    </form>
  );
}

export default function AdminPage() {
  const { publicKey, isConnected, setTxStatus, resetTxStatus } = useWalletStore();
  const [isIssuePending, startIssueTransition] = useTransition();
  const [isRevokePending, startRevokeTransition] = useTransition();

  function handleIssue(studentAddress: string) {
    if (!publicKey) return toast.error("Connect your wallet first");
    startIssueTransition(async () => {
      try {
        setTxStatus("building");
        toast.loading("Issuing credential…", { id: "issue-tx" });
        await issueStudentCredential(publicKey, studentAddress);
        setTxStatus("success");
        toast.success(`Credential issued for ${studentAddress.slice(0, 8)}…`, {
          id: "issue-tx",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to issue credential";
        setTxStatus("error", msg);
        toast.error(msg, { id: "issue-tx" });
      } finally {
        setTimeout(resetTxStatus, 3000);
      }
    });
  }

  function handleRevoke(studentAddress: string) {
    if (!publicKey) return toast.error("Connect your wallet first");
    startRevokeTransition(async () => {
      try {
        setTxStatus("building");
        toast.loading("Revoking credential…", { id: "revoke-tx" });
        await revokeCredential(publicKey, studentAddress);
        setTxStatus("success");
        toast.success(`Credential revoked for ${studentAddress.slice(0, 8)}…`, {
          id: "revoke-tx",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to revoke credential";
        setTxStatus("error", msg);
        toast.error(msg, { id: "revoke-tx" });
      } finally {
        setTimeout(resetTxStatus, 3000);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-400/30">
            <ShieldCheck className="h-3 w-3" />
            Admin Panel
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Direktori Anggota
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Kelola kredensial anggota DAO.
          </p>
        </div>

        {!isConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Hubungkan dompet admin kamu untuk mengelola kredensial.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Issue */}
          <Card className="border-emerald-500/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> Berikan Kredensial
              </CardTitle>
              <CardDescription className="text-xs">
                Berikan hak suara dan pengajuan proposal DAO ke alamat mahasiswa yang diverifikasi.
              </CardDescription>
            </CardHeader>
            <Separator className="opacity-40" />
            <CardContent className="pt-4">
              <CredentialForm
                action="issue"
                onSubmit={handleIssue}
                isPending={isIssuePending}
              />
            </CardContent>
          </Card>

          {/* Revoke */}
          <Card className="border-rose-500/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                <ShieldX className="h-4 w-4" /> Cabut Kredensial
              </CardTitle>
              <CardDescription className="text-xs">
                Hapus keanggotaan DAO dari sebuah alamat. Aksi ini tidak dapat dibatalkan di on-chain.
              </CardDescription>
            </CardHeader>
            <Separator className="opacity-40" />
            <CardContent className="pt-4">
              <CredentialForm
                action="revoke"
                onSubmit={handleRevoke}
                isPending={isRevokePending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
