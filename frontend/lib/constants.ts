// ============================================================
// CampusDAO — Application Constants
// ============================================================

/**
 * Throws a descriptive error when a required env var is missing.
 * Note: Next.js inlines `process.env.NEXT_PUBLIC_*` only with static
 * keys, so each var must be referenced literally (no dynamic lookup).
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your .env file or deployment environment.`,
    );
  }
  return value;
}

/**
 * Soroban RPC endpoint URL.
 */
export const SOROBAN_RPC_URL = requireEnv(
  "NEXT_PUBLIC_SOROBAN_RPC_URL",
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
);

/**
 * Stellar network passphrase for the target network.
 */
export const NETWORK_PASSPHRASE = requireEnv(
  "NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE",
  process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE,
);

/**
 * Deployed CampusDAO smart contract ID.
 */
export const CONTRACT_ID = requireEnv(
  "NEXT_PUBLIC_CONTRACT_ID",
  process.env.NEXT_PUBLIC_CONTRACT_ID,
);

/**
 * Target network identifier used by Freighter.
 */
export const NETWORK = requireEnv(
  "NEXT_PUBLIC_NETWORK",
  process.env.NEXT_PUBLIC_NETWORK,
);

/**
 * Default transaction timeout in seconds.
 */
export const TX_TIMEOUT_SEC = 30;

/**
 * XLM decimals (Stellar native asset uses 7 decimals).
 */
export const STROOPS_PER_XLM = 10_000_000;

/**
 * Default duration in ledgers for a new proposal (~5 min per ledger ≈ 1 day).
 */
export const DEFAULT_PROPOSAL_DURATION_LEDGERS = 17_280; // ~1 day

/**
 * Polling interval for transaction confirmation (ms).
 */
export const TX_POLL_INTERVAL_MS = 2_000;
