// ============================================================
// CampusDAO — Application Constants
// ============================================================

/**
 * Soroban RPC endpoint URL (Stellar Testnet).
 */
export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  "https://soroban-testnet.stellar.org";

/**
 * Stellar network passphrase for the target network.
 */
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE ??
  "Test SDF Network ; September 2015";

/**
 * Deployed CampusDAO smart contract ID.
 */
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ??
  "CCX3VZKUFA44JHBL3TG3R3PA5ZVCN2F53VRL4DITCDKKSDYENQ4MHFRD";

/**
 * Target network identifier used by Freighter.
 */
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? "testnet";

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
