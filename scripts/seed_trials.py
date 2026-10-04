import sys
import time
import json
from genlayer_py import create_client, studionet, create_account
from genlayer_py.types.transactions import TransactionStatus

CONTRACT_ADDRESS = "0x557a9EF1Da1c5e95c387Ac54665F374927037042"

def seed_sample_trials():
    print(f"[*] Seeding real clinical trials on-chain into {CONTRACT_ADDRESS}...")
    
    # Sponsor 1: Oncology trial
    sponsor1 = create_account()
    client_sp1 = create_client(chain=studionet, account=sponsor1)
    client_sp1.fund_account(sponsor1.address, 5 * 10**18)
    time.sleep(2)

    print(f"[1] Registering Oncology Trial (CTX-904 Kinase Inhibitor)...")
    tx1 = client_sp1.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_trial_grant",
        args=["CTX-904 Oncology Kinase Inhibitor (Phase II NSCLC)", 5, 65, 6000],
        value=1 * 10**18,
    )
    r1 = client_sp1.wait_for_transaction_receipt(tx1, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print(f"    Trial #1 created! Status: {r1.get('status_name') or 'ACCEPTED'}")

    # Sponsor 2: Alzheimer trial
    sponsor2 = create_account()
    client_sp2 = create_client(chain=studionet, account=sponsor2)
    client_sp2.fund_account(sponsor2.address, 5 * 10**18)
    time.sleep(2)

    print(f"[2] Registering Neuro Trial (NEURO-712 Amyloid-Beta Peptide)...")
    tx2 = client_sp2.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="create_trial_grant",
        args=["NEURO-712 Amyloid-Beta Peptide (Phase III Early AD)", 4, 50, 6000],
        value=2 * 10**18,
    )
    r2 = client_sp2.wait_for_transaction_receipt(tx2, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print(f"    Trial #2 created! Status: {r2.get('status_name') or 'ACCEPTED'}")

    # CRO claims Trial #1 and links telemetry
    cro1 = create_account()
    client_cro1 = create_client(chain=studionet, account=cro1)
    client_cro1.fund_account(cro1.address, 5 * 10**18)
    time.sleep(2)

    cohort_url = "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/README.md"
    dsmb_url = "https://raw.githubusercontent.com/luongnhan9999/AgentFDA/main/contracts/contract.py"

    print(f"[3] CRO Claiming Trial #1 & Linking Clinical Data Feeds...")
    tx3 = client_cro1.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="submit_trial_data",
        args=[1, cohort_url, dsmb_url],
    )
    r3 = client_cro1.wait_for_transaction_receipt(tx3, status=TransactionStatus.ACCEPTED, retries=40, interval=2000)
    print(f"    Trial #1 Feeds Linked! Status: {r3.get('status_name') or 'ACCEPTED'}")

    # Adjudicate Trial #1 with AI Jury
    print(f"[4] Convening AI Regulatory Jury for Trial #1 Adjudication...")
    tx4 = client_sp1.write_contract(
        address=CONTRACT_ADDRESS,
        function_name="adjudicate_milestone",
        args=[1],
    )
    r4 = client_sp1.wait_for_transaction_receipt(tx4, status=TransactionStatus.ACCEPTED, retries=60, interval=3000)
    print(f"    Trial #1 Adjudication complete! Status: {r4.get('status_name') or 'ACCEPTED'}")

    # Read final state
    raw_trials = client_sp1.read_contract(address=CONTRACT_ADDRESS, function_name="get_all_trials", args=[])
    trials = json.loads(raw_trials)
    print("\n--- ON-CHAIN TRIALS SUMMARY ---")
    for t in trials:
        print(f"ID #{t['trial_id']} | {t['drug_candidate']} | Status: {t['status']} | Verdict: {t['verdict']} | Escrow: {t['escrow_amount']}")

if __name__ == "__main__":
    seed_sample_trials()
