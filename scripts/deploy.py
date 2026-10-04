import sys
import os
import json
from genlayer_py import create_client, studionet, create_account
from genlayer_py.types.transactions import TransactionStatus

def deploy_agent_fda():
    print("[*] Initializing deployment to GenLayer StudioNet (Chain ID: 61999)...")
    deployer = create_account()
    print(f"Deployer Address: {deployer.address}")

    client = create_client(chain=studionet, account=deployer)
    print("Funding deployer account with 5 GEN...")
    client.fund_account(deployer.address, 5 * 10**18)

    contract_path = os.path.join(os.path.dirname(__file__), "..", "contracts", "contract.py")
    with open(contract_path, "r", encoding="utf-8") as f:
        contract_code = f.read()

    print(f"Reading contract code from {contract_path} ({len(contract_code)} bytes)...")
    print("Deploying AgentFDA Intelligent Contract...")
    
    tx_hash = client.deploy_contract(code=contract_code)
    print(f"Deployment Transaction Hash: {tx_hash}")
    print("Waiting for transaction receipt on StudioNet...")

    receipt = client.wait_for_transaction_receipt(
        tx_hash,
        status=TransactionStatus.ACCEPTED,
        retries=60,
        interval=3000
    )

    print("\n--- DEPLOYMENT RECEIPT ---")
    contract_addr = (
        receipt.get("contract_address")
        or (receipt.get("data") and receipt["data"].get("contract_address"))
        or receipt.get("recipient_address")
        or receipt.get("to")
    )
    print(f"[SUCCESS] Contract Deployed Successfully!")
    print(f"Contract Address: {contract_addr}")
    print(f"Receipt details: {json.dumps({k: str(v) for k, v in receipt.items() if k not in ['genvm_result', 'data']}, indent=2)}")

    # Save to a record file
    deployment_record = {
        "network": "studionet",
        "chainId": 61999,
        "contractAddress": contract_addr,
        "txHash": tx_hash,
        "deployer": deployer.address,
    }
    out_file = os.path.join(os.path.dirname(__file__), "deployed_contract.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(deployment_record, f, indent=2)
    print(f"Saved deployment info to {out_file}")

    return contract_addr

if __name__ == "__main__":
    deploy_agent_fda()
