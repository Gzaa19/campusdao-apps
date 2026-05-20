// ============================================================
// CampusDAO — Zustand Store for Wallet & App State
// ============================================================
"use client";

import { create } from "zustand";
import { requestAccess, getAddress } from "@stellar/freighter-api";
import type { Proposal, TransactionStatus, UserRole } from "@/lib/types";
import {
  getAllProposals,
  isMember,
  hasUserVoted,
} from "@/lib/stellar";

// ============================================================
//  Store Interface
// ============================================================

interface WalletState {
  // ----- Wallet -----
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletError: string | null;
  role: UserRole;

  // ----- Proposals -----
  proposals: Proposal[];
  isLoadingProposals: boolean;
  proposalsError: string | null;

  // ----- Voting -----
  votedProposals: Set<number>;

  // ----- Transaction -----
  txStatus: TransactionStatus;
  txError: string | null;

  // ----- Actions -----
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchProposals: () => Promise<void>;
  checkVoteStatus: (proposalId: number) => Promise<boolean>;
  markAsVoted: (proposalId: number) => void;
  setTxStatus: (status: TransactionStatus, error?: string) => void;
  resetTxStatus: () => void;
}

// ============================================================
//  Store Implementation
// ============================================================

export const useWalletStore = create<WalletState>((set, get) => ({
  // ----- Initial State -----
  publicKey: null,
  isConnected: false,
  isConnecting: false,
  walletError: null,
  role: "guest",

  proposals: [],
  isLoadingProposals: false,
  proposalsError: null,

  votedProposals: new Set<number>(),

  txStatus: "idle",
  txError: null,

  // ----- Wallet Actions -----
  connectWallet: async () => {
    set({ isConnecting: true, walletError: null });

    try {
      // Check if Freighter is available
      if (typeof window === "undefined") {
        throw new Error("Cannot connect wallet in server context");
      }

      // Request access
      const accessResult = await requestAccess();

      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      // Get public key
      const addressResult = await getAddress();
      if (addressResult.error) {
        throw new Error(addressResult.error);
      }

      const pubKey = addressResult.address;
      if (!pubKey) throw new Error("No address returned from Freighter");

      // Check membership status
      let role: UserRole = "guest";
      try {
        const memberStatus = await isMember(pubKey);
        role = memberStatus ? "member" : "guest";
      } catch {
        // Membership check may fail on mainnet — default to guest
        console.warn("Could not verify membership, defaulting to guest");
      }

      set({
        publicKey: pubKey,
        isConnected: true,
        isConnecting: false,
        role,
        walletError: null,
      });

      // After connecting, fetch proposals
      get().fetchProposals();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect wallet";
      set({
        isConnecting: false,
        walletError: message,
        isConnected: false,
        publicKey: null,
      });
    }
  },

  disconnectWallet: () => {
    set({
      publicKey: null,
      isConnected: false,
      role: "guest",
      walletError: null,
      votedProposals: new Set(),
    });
  },

  // ----- Proposal Actions -----
  fetchProposals: async () => {
    set({ isLoadingProposals: true, proposalsError: null });

    try {
      const proposals = await getAllProposals();
      set({ proposals, isLoadingProposals: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load proposals";
      set({ isLoadingProposals: false, proposalsError: message });
    }
  },

  // ----- Voting Actions -----
  checkVoteStatus: async (proposalId: number) => {
    const { publicKey, votedProposals } = get();
    if (!publicKey) return false;

    // Check local cache first
    if (votedProposals.has(proposalId)) return true;

    try {
      const voted = await hasUserVoted(proposalId, publicKey);
      if (voted) {
        set((state) => ({
          votedProposals: new Set([...state.votedProposals, proposalId]),
        }));
      }
      return voted;
    } catch {
      return false;
    }
  },

  markAsVoted: (proposalId: number) => {
    set((state) => ({
      votedProposals: new Set([...state.votedProposals, proposalId]),
    }));
  },

  // ----- Transaction Status -----
  setTxStatus: (status, error) => {
    set({ txStatus: status, txError: error ?? null });
  },

  resetTxStatus: () => {
    set({ txStatus: "idle", txError: null });
  },
}));
