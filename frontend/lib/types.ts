// ============================================================
// CampusDAO — Shared Type Definitions
// ============================================================

/**
 * Maps the Soroban ProposalStatus enum variants to TypeScript.
 */
export enum ProposalStatus {
  Active = "Active",
  Passed = "Passed",
  Rejected = "Rejected",
  Executed = "Executed",
}

/**
 * Client-side representation of a DAO Proposal returned from the contract.
 */
export interface Proposal {
  id: number;
  creator: string;
  description: string;
  requestedFunds: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  deadline: number;
  status: ProposalStatus;
}

/**
 * Serialisable version of Proposal (for JSON-safe contexts like API routes).
 * bigint fields are converted to string.
 */
export interface SerializableProposal {
  id: number;
  creator: string;
  description: string;
  requestedFunds: string;
  votesFor: string;
  votesAgainst: string;
  deadline: number;
  status: ProposalStatus;
}

/**
 * User role within the DAO.
 */
export type UserRole = "admin" | "member" | "guest";

/**
 * Represents the status of an on-chain transaction lifecycle.
 */
export type TransactionStatus =
  | "idle"
  | "building"
  | "simulating"
  | "signing"
  | "submitting"
  | "success"
  | "error";

/**
 * Payload for creating a new proposal via the UI form.
 */
export interface CreateProposalPayload {
  description: string;
  requestedFunds: string; // user-entered string; converted to i128 before submit
  durationLedgers: number;
}

/**
 * Payload for casting a vote on a proposal.
 */
export interface CastVotePayload {
  proposalId: number;
  support: boolean;
  voteWeight: string; // converted to i128
}

/**
 * Response shape from the AI analysis API route.
 */
export interface AIAnalysisResponse {
  summary: string;
  qualityScore: number;
  suggestions: string[];
  error?: string;
}
