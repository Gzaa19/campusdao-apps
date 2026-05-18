#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String,
};

// 1. Tipe Data untuk mengelola state DAO
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Executed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub creator: Address,
    pub description: String,
    pub requested_funds: i128,
    pub votes_for: i128,
    pub votes_against: i128,
    pub deadline: u32,
    pub status: ProposalStatus,
}

#[contracttype]
pub enum DataKey {
    Admin,
    TokenAddress,
    Member(Address),
    Proposal(u64),
    ProposalCount,
    HasVoted(u64, Address),
}

#[contract]
pub struct CampusDaoContract;

#[contractimpl]
impl CampusDaoContract {
    pub fn initialize(env: Env, admin: Address, token_address: Address) {
        assert!(
            !env.storage().instance().has(&DataKey::Admin),
            "DAO sudah diinisialisasi"
        );
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenAddress, &token_address);
        env.storage().instance().set(&DataKey::ProposalCount, &0u64);
    }

    pub fn issue_student_credential(env: Env, admin: Address, student_address: Address) {
        admin.require_auth();
        Self::verify_admin(&env, &admin);
        
        env.storage()
            .persistent()
            .set(&DataKey::Member(student_address.clone()), &true);
    }

    pub fn revoke_credential(env: Env, admin: Address, student_address: Address) {
        admin.require_auth();
        Self::verify_admin(&env, &admin);
        
        env.storage()
            .persistent()
            .remove(&DataKey::Member(student_address));
    }

    pub fn create_proposal(
        env: Env,
        student_address: Address,
        description: String,
        requested_funds: i128,
        duration_ledgers: u32,
    ) -> u64 {
        student_address.require_auth();
        Self::verify_member(&env, &student_address);
        
        assert!(requested_funds > 0, "Dana yang diminta harus lebih dari 0");

        let mut proposal_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCount)
            .unwrap_or(0);
        
        proposal_count += 1;
        let current_ledger = env.ledger().sequence();

        let new_proposal = Proposal {
            creator: student_address,
            description,
            requested_funds,
            votes_for: 0,
            votes_against: 0,
            deadline: current_ledger + duration_ledgers,
            status: ProposalStatus::Active,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_count), &new_proposal);
        env.storage()
            .instance()
            .set(&DataKey::ProposalCount, &proposal_count);

        proposal_count
    }

    pub fn cast_vote(
        env: Env,
        student_address: Address,
        proposal_id: u64,
        support: bool,
        vote_weight: i128, 
    ) {
        student_address.require_auth();
        Self::verify_member(&env, &student_address);

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("Proposal tidak ditemukan");

        assert!(
            proposal.status == ProposalStatus::Active,
            "Proposal tidak lagi aktif"
        );
        assert!(
            env.ledger().sequence() <= proposal.deadline,
            "Waktu voting telah habis"
        );

        let has_voted_key = DataKey::HasVoted(proposal_id, student_address.clone());
        assert!(
            !env.storage().persistent().has(&has_voted_key),
            "Mahasiswa sudah memberikan suara"
        );

        if support {
            proposal.votes_for += vote_weight;
        } else {
            proposal.votes_against += vote_weight;
        }

        env.storage().persistent().set(&has_voted_key, &true);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
    }

    pub fn execute_proposal(env: Env, executor: Address, proposal_id: u64) {
        executor.require_auth(); 

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("Proposal tidak ditemukan");

        assert!(
            proposal.status == ProposalStatus::Active,
            "Proposal sudah dieksekusi atau ditolak"
        );
        assert!(
            env.ledger().sequence() > proposal.deadline,
            "Masa voting belum selesai"
        );

        if proposal.votes_for > proposal.votes_against {
            proposal.status = ProposalStatus::Passed;
            
            let token_address: Address = env
                .storage()
                .instance()
                .get(&DataKey::TokenAddress)
                .unwrap();
            let token_client = token::Client::new(&env, &token_address);
            
            token_client.transfer(
                &env.current_contract_address(),
                &proposal.creator,
                &proposal.requested_funds,
            );
            
            proposal.status = ProposalStatus::Executed;
        } else {
            proposal.status = ProposalStatus::Rejected;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
    }

    fn verify_admin(env: &Env, address: &Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        assert!(admin == *address, "Hanya Admin yang dapat melakukan ini");
    }

    fn verify_member(env: &Env, address: &Address) {
        let is_member: bool = env
            .storage()
            .persistent()
            .get(&DataKey::Member(address.clone()))
            .unwrap_or(false);
        assert!(is_member, "Alamat ini bukan mahasiswa/anggota DAO aktif");
    }
}