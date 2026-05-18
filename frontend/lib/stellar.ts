// ============================================================
// CampusDAO — Stellar / Soroban Service Layer
// ============================================================
// All blockchain interaction logic is isolated in this file.
// UI components NEVER call the SDK directly; they go through
// the Zustand store which delegates here.
// ============================================================

import * as StellarSdk from "@stellar/stellar-sdk";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import {
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
  CONTRACT_ID,
  TX_TIMEOUT_SEC,
} from "@/lib/constants";
import type { Proposal, ProposalStatus } from "@/lib/types";

// --------------- Soroban RPC Client ---------------

const server = new SorobanRpc.Server(SOROBAN_RPC_URL);
const contract = new StellarSdk.Contract(CONTRACT_ID);

// --------------- Helper: Convert JS → ScVal ---------------

function addressToScVal(address: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(
    StellarSdk.Address.fromString(address),
    { type: "address" } as never,
  );
}

function stringToScVal(value: string): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "string" });
}

function i128ToScVal(value: bigint): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "i128" });
}

function u64ToScVal(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "u64" });
}

function u32ToScVal(value: number): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "u32" });
}

function boolToScVal(value: boolean): StellarSdk.xdr.ScVal {
  return StellarSdk.nativeToScVal(value, { type: "bool" });
}

// --------------- Helper: ScVal → JS ---------------

function scValToString(val: StellarSdk.xdr.ScVal): string {
  return StellarSdk.scValToNative(val) as string;
}

// --------------- Core Transaction Builder ---------------

/**
 * Builds, simulates, signs via Freighter, and submits a Soroban
 * contract invocation transaction.
 *
 * @returns The result xdr.ScVal from the successful transaction.
 */
async function buildAndSubmitTx(
  callerPublicKey: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
): Promise<StellarSdk.xdr.ScVal | null> {
  // 1. Load source account from the network
  const sourceAccount = await server.getAccount(callerPublicKey);

  // 2. Build the transaction with the contract call operation
  const builtTx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TX_TIMEOUT_SEC)
    .build();

  // 3. Simulate to get the required footprint & resource estimates
  const simResponse = await server.simulateTransaction(builtTx);

  if (
    SorobanRpc.Api.isSimulationError(simResponse)
  ) {
    const errMsg =
      "error" in simResponse
        ? String(simResponse.error)
        : "Transaction simulation failed";
    throw new Error(`Simulation failed: ${errMsg}`);
  }

  // 4. Assemble the transaction with simulation results
  const preparedTx = SorobanRpc.assembleTransaction(
    builtTx,
    simResponse,
  ).build();

  // 5. Sign with Freighter
  const txXDR = preparedTx.toXDR();
  const signResult = await signTransaction(txXDR, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (signResult.error) {
    throw new Error(`Freighter signing failed: ${signResult.error}`);
  }

  // 6. Re-hydrate signed transaction and submit
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    NETWORK_PASSPHRASE,
  );

  const sendResponse = await server.sendTransaction(signedTx);

  // 7. Poll for confirmation
  if (sendResponse.status === "PENDING") {
    let txResponse = await server.getTransaction(sendResponse.hash);

    while (txResponse.status === "NOT_FOUND") {
      await new Promise((r) => setTimeout(r, 2000));
      txResponse = await server.getTransaction(sendResponse.hash);
    }

    if (txResponse.status === "SUCCESS") {
      return txResponse.returnValue ?? null;
    } else {
      throw new Error(
        `Transaction failed with status: ${txResponse.status}`,
      );
    }
  } else if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction submission error`);
  }

  return null;
}

// ============================================================
//  PUBLIC API — Contract Method Wrappers
// ============================================================

/**
 * Creates a new funding proposal on-chain.
 * Maps to: `create_proposal(student_address, description, requested_funds, duration_ledgers) -> u64`
 */
export async function createProposal(
  studentAddress: string,
  description: string,
  requestedFunds: bigint,
  durationLedgers: number,
): Promise<number> {
  const result = await buildAndSubmitTx(studentAddress, "create_proposal", [
    addressToScVal(studentAddress),
    stringToScVal(description),
    i128ToScVal(requestedFunds),
    u32ToScVal(durationLedgers),
  ]);

  if (!result) throw new Error("No return value from create_proposal");
  return Number(StellarSdk.scValToNative(result));
}

/**
 * Casts a vote on a proposal.
 * Maps to: `cast_vote(student_address, proposal_id, support, vote_weight)`
 */
export async function castVote(
  studentAddress: string,
  proposalId: number,
  support: boolean,
  voteWeight: bigint,
): Promise<void> {
  await buildAndSubmitTx(studentAddress, "cast_vote", [
    addressToScVal(studentAddress),
    u64ToScVal(proposalId),
    boolToScVal(support),
    i128ToScVal(voteWeight),
  ]);
}

/**
 * Executes a proposal after its voting deadline has passed.
 * Maps to: `execute_proposal(executor, proposal_id)`
 */
export async function executeProposal(
  executorAddress: string,
  proposalId: number,
): Promise<void> {
  await buildAndSubmitTx(executorAddress, "execute_proposal", [
    addressToScVal(executorAddress),
    u64ToScVal(proposalId),
  ]);
}

/**
 * Issues a student credential (admin only).
 * Maps to: `issue_student_credential(admin, student_address)`
 */
export async function issueStudentCredential(
  adminAddress: string,
  studentAddress: string,
): Promise<void> {
  await buildAndSubmitTx(adminAddress, "issue_student_credential", [
    addressToScVal(adminAddress),
    addressToScVal(studentAddress),
  ]);
}

/**
 * Revokes a student credential (admin only).
 * Maps to: `revoke_credential(admin, student_address)`
 */
export async function revokeCredential(
  adminAddress: string,
  studentAddress: string,
): Promise<void> {
  await buildAndSubmitTx(adminAddress, "revoke_credential", [
    addressToScVal(adminAddress),
    addressToScVal(studentAddress),
  ]);
}

// ============================================================
//  READ-ONLY — Querying Contract State
// ============================================================

/**
 * Generic helper to read a contract storage entry via simulation.
 */
async function readContractValue(
  method: string,
  args: StellarSdk.xdr.ScVal[],
): Promise<StellarSdk.xdr.ScVal | null> {
  // We use a throwaway keypair for read-only simulations
  const tempKeypair = StellarSdk.Keypair.random();
  const tempAccount = new StellarSdk.Account(tempKeypair.publicKey(), "0");

  const tx = new StellarSdk.TransactionBuilder(tempAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TX_TIMEOUT_SEC)
    .build();

  const simResponse = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(simResponse)) {
    return null;
  }

  if (
    SorobanRpc.Api.isSimulationSuccess(simResponse) &&
    simResponse.result
  ) {
    return simResponse.result.retval;
  }

  return null;
}

/**
 * Fetches the total proposal count from the contract.
 */
export async function getProposalCount(): Promise<number> {
  try {
    // Read from contract storage directly via getLedgerEntries
    const instanceKey = StellarSdk.xdr.LedgerKey.contractData(
      new StellarSdk.xdr.LedgerKeyContractData({
        contract: new StellarSdk.Address(CONTRACT_ID).toScAddress(),
        key: StellarSdk.xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: StellarSdk.xdr.ContractDataDurability.persistent(),
      }),
    );

    // Fallback: try to fetch proposals iteratively
    let count = 0;
    for (let i = 1; i <= 100; i++) {
      try {
        const proposal = await getProposal(i);
        if (proposal) {
          count = i;
        } else {
          break;
        }
      } catch {
        break;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Fetches a single proposal by ID. Returns null if not found.
 */
export async function getProposal(
  proposalId: number,
): Promise<Proposal | null> {
  try {
    // Build a read-only call for a getter (if contract had one)
    // Since the contract doesn't expose a getter, we read ledger entries directly
    const contractAddress = new StellarSdk.Address(CONTRACT_ID);

    // Build the DataKey::Proposal(u64) enum variant key
    // The enum variant name is "Proposal" with a u64 value
    const dataKeyScVal = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.nativeToScVal("Proposal", { type: "symbol" }),
      StellarSdk.nativeToScVal(proposalId, { type: "u64" }),
    ]);

    const ledgerKey = StellarSdk.xdr.LedgerKey.contractData(
      new StellarSdk.xdr.LedgerKeyContractData({
        contract: contractAddress.toScAddress(),
        key: dataKeyScVal,
        durability: StellarSdk.xdr.ContractDataDurability.persistent(),
      }),
    );

    const response = await server.getLedgerEntries(ledgerKey);

    if (response.entries && response.entries.length > 0) {
      const entry = response.entries[0];
      // entry.val is already a parsed xdr.LedgerEntryData
      const contractData = entry.val.contractData();
      const val = contractData.val();
      const nativeVal = StellarSdk.scValToNative(val);

      return parseProposal(proposalId, nativeVal);
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch proposal #${proposalId}:`, error);
    return null;
  }
}

/**
 * Checks if a user has already voted on a proposal.
 */
export async function hasUserVoted(
  proposalId: number,
  userAddress: string,
): Promise<boolean> {
  try {
    const contractAddress = new StellarSdk.Address(CONTRACT_ID);

    // Build DataKey::HasVoted(u64, Address)
    const dataKeyScVal = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.nativeToScVal("HasVoted", { type: "symbol" }),
      StellarSdk.nativeToScVal(proposalId, { type: "u64" }),
      addressToScVal(userAddress),
    ]);

    const ledgerKey = StellarSdk.xdr.LedgerKey.contractData(
      new StellarSdk.xdr.LedgerKeyContractData({
        contract: contractAddress.toScAddress(),
        key: dataKeyScVal,
        durability: StellarSdk.xdr.ContractDataDurability.persistent(),
      }),
    );

    const response = await server.getLedgerEntries(ledgerKey);
    return !!(response.entries && response.entries.length > 0);
  } catch {
    return false;
  }
}

/**
 * Checks if an address is a registered DAO member.
 */
export async function isMember(address: string): Promise<boolean> {
  try {
    const contractAddress = new StellarSdk.Address(CONTRACT_ID);

    const dataKeyScVal = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.nativeToScVal("Member", { type: "symbol" }),
      addressToScVal(address),
    ]);

    const ledgerKey = StellarSdk.xdr.LedgerKey.contractData(
      new StellarSdk.xdr.LedgerKeyContractData({
        contract: contractAddress.toScAddress(),
        key: dataKeyScVal,
        durability: StellarSdk.xdr.ContractDataDurability.persistent(),
      }),
    );

    const response = await server.getLedgerEntries(ledgerKey);
    return !!(response.entries && response.entries.length > 0);
  } catch {
    return false;
  }
}

/**
 * Fetches all proposals from the contract (iterates from 1 to count).
 */
export async function getAllProposals(): Promise<Proposal[]> {
  const proposals: Proposal[] = [];
  for (let i = 1; i <= 100; i++) {
    try {
      const proposal = await getProposal(i);
      if (proposal) {
        proposals.push(proposal);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return proposals;
}

// --------------- Internal Helpers ---------------

function parseProposal(
  id: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
): Proposal {
  return {
    id,
    creator: String(raw.creator ?? raw.Creator ?? ""),
    description: String(raw.description ?? raw.Description ?? ""),
    requestedFunds: BigInt(raw.requested_funds ?? raw.RequestedFunds ?? 0),
    votesFor: BigInt(raw.votes_for ?? raw.VotesFor ?? 0),
    votesAgainst: BigInt(raw.votes_against ?? raw.VotesAgainst ?? 0),
    deadline: Number(raw.deadline ?? raw.Deadline ?? 0),
    status: parseStatus(raw.status ?? raw.Status),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStatus(raw: any): ProposalStatus {
  if (typeof raw === "string") return raw as ProposalStatus;
  // Handle enum variants from scValToNative
  if (Array.isArray(raw)) return raw[0] as ProposalStatus;
  return "Active" as ProposalStatus;
}
