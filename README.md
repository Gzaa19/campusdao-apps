# CampusDAO

![Stellar](https://img.shields.io/badge/Stellar-Soroban-black?style=for-the-badge&logo=stellar)
![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=nextdotjs)

CampusDAO is a decentralized smart contract solution built on the **Stellar blockchain** using the **Soroban SDK**. This platform is designed specifically for academic environments and student community service programs. It securely manages funding proposals, verifies active student memberships, and facilitates a transparent, immutable voting process. By leveraging the efficiency of the Stellar network, the contract ensures that project funds are distributed automatically and trustlessly only when a democratic quorum is met.

## Project Vision

Our vision is to revolutionize how academic and student community projects are funded and managed by:

* **Decentralizing Funding Allocation:** Moving away from opaque, centralized campus bureaucracies to a transparent, student-governed system.
* **Ensuring Transparency:** Providing a public, immutable ledger of all proposals, votes, and fund disbursements that cannot be altered or manipulated.
* **Automating Trust:** Using smart contracts to automatically release funds (via Stellar tokens) only when a democratic consensus is reached, eliminating intermediaries.
* **Fostering Accountability:** Ensuring only verified, active students hold voting power and governance rights.

## Key Features

* **Credential Management:** Administrators can issue and revoke DAO access for active students using decentralized on-chain storage.
* **Proposal Creation:** Verified members can submit detailed funding proposals (e.g., for rural development or student projects) specifying the requested funds and voting deadlines.
* **Secure Voting Mechanism:** Members can cast their votes on active proposals with strict anti-double-voting logic enforced at the smart contract level.
* **Automated Execution:** The system automatically executes and transfers funding directly to the proposal creator's wallet if the required voting quorum is met by the specified ledger deadline.
* **AI Analysis Integration:** Proposals can be automatically analyzed using an AI API to provide a quality score, executive summary, and actionable improvement suggestions.

## Tech Stack

- **Smart Contract:** Rust (Soroban SDK)
- **Frontend Framework:** Next.js 15+ (App Router), React 19
- **Styling:** Tailwind CSS, shadcn/ui, framer-motion
- **State Management:** Zustand
- **Web3 Integration:** `@stellar/stellar-sdk`, `@stellar/freighter-api`

---

## Deployed Smart Contract Details

> **CONTRACT ID:** `CCFFNPDND6L6GHSOCBZUX35Y52K6MBGV2EKONDT7VSULGTYGRG5IQSM3`
> **NETWORK:** Stellar Mainnet (Soroban)
> **ADMIN:** `GBAMRU7IH5YEU7P3BB2IPO5FNRCEARFFWRFB7OINVWEE2GCAWHLOA23I`

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. [Node.js](https://nodejs.org/en/) (v18 or higher) & `npm`
2. [Rust](https://www.rust-lang.org/tools/install) & `cargo`
3. [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup#install-the-stellar-cli)
4. [Freighter Wallet](https://www.freighter.app/) Browser Extension

---

## Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/your-username/campusdao-apps.git
cd campusdao-apps
```

**2. Add Rust WebAssembly Target**
Soroban smart contracts are compiled to WebAssembly (Wasm). You must install the `wasm32v1-none` target:
```bash
rustup target add wasm32v1-none
```

**3. Install Frontend Dependencies**
```bash
cd frontend
npm install
```

**4. Environment Variables**
Inside the `frontend` folder, duplicate the `.env.example` file and rename it to `.env`. Fill in the values (if you are deploying your own contract, update the `NEXT_PUBLIC_CONTRACT_ID`):
```env
NEXT_PUBLIC_SOROBAN_RPC_URL=https://mainnet.sorobanrpc.com
NEXT_PUBLIC_SOROBAN_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
NEXT_PUBLIC_CONTRACT_ID=YOUR_MAINNET_CONTRACT_ID_HERE
NEXT_PUBLIC_NETWORK=mainnet
```

---

## Running the Frontend Locally

From within the `frontend` directory, start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Smart Contract Operations (Optional)

If you wish to compile and deploy your own instance of the DAO smart contract, follow these steps from the root `campusdao-apps` directory.

**1. Build the Contract**
```bash
stellar contract build
```
*(This will generate the `campusdao.wasm` file inside `target/wasm32v1-none/release/`)*

**2. Generate a Stellar Identity (if you don't have one)**
```bash
stellar keys generate admin --network mainnet
```

**3. Deploy the Contract to Mainnet**
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/campusdao.wasm \
  --source admin \
  --network mainnet
```
*(Copy the generated Contract ID starting with `C...`)*

**4. Initialize the Contract**
The DAO needs to know who the `admin` is and which token acts as the treasury funding asset (e.g., native XLM). Replace `<YOUR_NEW_CONTRACT_ID>` and `<YOUR_ADMIN_PUBLIC_KEY>`:
```bash
stellar contract invoke \
  --id <YOUR_NEW_CONTRACT_ID> \
  --source admin \
  --network mainnet \
  -- \
  initialize \
  --admin <YOUR_ADMIN_PUBLIC_KEY> \
  --token_address CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
```
*Note: The `token_address` above is the native XLM SAC contract on Mainnet. Once initialized, update your `frontend/.env` with the new Contract ID and restart the frontend server.*

---

## User Workflow & App Usage Guide

### 1. Connecting Wallet
- Open the application and click **"Hubungkan Dompet" (Connect Wallet)** in the top right corner.
- Approve the connection request in your Freighter extension. Ensure Freighter is set to the **Mainnet** network.

### 2. Admin Credentialing (Access Control)
By default, standard wallets cannot create proposals or vote. An Admin must issue them a credential.
- Navigate to the **Admin** tab.
- Enter a student's public key (e.g., `G...`) into the **Issue Credential** field.
- Click **Berikan Kredensial (Issue Credential)** and sign the transaction in Freighter. 
- *Note: If you are the Admin testing the app, you must issue a credential to your own wallet address first to unlock DAO features.*

### 3. Creating a Proposal
- Navigate to the **Dasbor (Dashboard)**.
- Click **+ Proposal Baru (+ New Proposal)**.
- Fill out the project description, the requested funds in XLM, and the voting duration (in ledgers; 1 ledger ≈ 5 seconds).
- Click **Kirim Proposal (Submit Proposal)** and sign the transaction. 

### 4. Voting on Proposals
- On the Dashboard, locate an **Active** proposal and click on it.
- Review the proposal details (and run the AI Analysis if desired).
- Click **Setuju (Approve)** or **Tolak (Reject)**. 
- Sign the transaction. *Note: You can only vote once per proposal.*

### 5. Executing Proposals
- Once a proposal's deadline has passed (the ledger countdown reaches 0), the proposal becomes executable if it has more "Setuju" (Approve) votes than "Tolak" (Reject) votes.
- Any member can click the **Eksekusi & Transfer Dana (Execute & Transfer Funds)** button on the proposal details page.
- The smart contract will automatically evaluate the votes, update the status to "Executed", and securely transfer the requested XLM from the smart contract's token balance directly to the proposal creator's wallet.

---

## Troubleshooting

* **`UnreachableCodeReached` Error when creating a proposal:** Your wallet address has not been registered as an active DAO member. Ask the Admin to issue you a credential via the Admin page.
* **`TxFailed` / Freighter Error:** Ensure your Freighter wallet is set to **Mainnet** and that your account is funded with real XLM.
* **Missing Freighter Extension:** The app will prompt you if Freighter is not detected in your browser. Please install it and refresh the page.

---

*Built for the future of decentralized academic funding.*
