"use client";

import { useState } from "react";
import { Wallet, Loader2, AlertCircle, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWalletStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ConnectWallet() {
  const {
    publicKey,
    isConnected,
    isConnecting,
    walletError,
    role,
    connectWallet,
    disconnectWallet,
  } = useWalletStore();

  const [copied, setCopied] = useState(false);

  const shortKey = publicKey
    ? `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`
    : null;

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Not connected ─────────────────────────────────────────── */
  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <Button
          id="connect-wallet-btn"
          onClick={connectWallet}
          disabled={isConnecting}
          className="gap-2 min-w-[160px] bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm shadow-primary/20"
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          {isConnecting ? "Menghubungkan…" : "Hubungkan Dompet"}
        </Button>

        {walletError && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {walletError.includes("not installed") || walletError.includes("No freighter")
              ? "Freighter belum diinstal"
              : walletError}
          </span>
        )}
      </div>
    );
  }

  /* ── Connected ──────────────────────────────────────────────── */
  return (
    <div className="flex items-center gap-2">
      {/* Role badge */}
      <span
        className={cn(
          "hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
          role === "admin" &&
            "bg-amber-400/10 text-amber-500 ring-amber-400/30",
          role === "member" &&
            "bg-emerald-400/10 text-emerald-500 ring-emerald-400/30",
          role === "guest" &&
            "bg-muted text-muted-foreground ring-border",
        )}
      >
        {role === "member" ? "Anggota" : role === "guest" ? "Tamu" : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>

      {/* Public key chip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            id="copy-address-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-150 cursor-pointer"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {shortKey}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{publicKey}</p>
        </TooltipContent>
      </Tooltip>

      {/* Disconnect */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="disconnect-wallet-btn"
            variant="ghost"
            size="icon"
            onClick={disconnectWallet}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="sr-only">Putuskan dompet</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Putuskan Koneksi</TooltipContent>
      </Tooltip>
    </div>
  );
}
