import pytest
import json
import os
import sys

# Ensure contracts directory is reachable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))


# ---------------------------------------------------------------------------
# Simulated GenLayer Environment for robust local pytest execution
# ---------------------------------------------------------------------------
class SimulatedAddress:
    def __init__(self, hex_addr: str):
        self.as_hex = hex_addr.lower()

    def __str__(self):
        return self.as_hex

    def __eq__(self, other):
        return str(self).lower() == str(other).lower()


class MockTransferContract:
    def __init__(self, address):
        self.address = str(address)
        self.transfers = []

    def emit_transfer(self, value):
        self.transfers.append({"to": self.address, "value": value})
        return True


class MockReturn:
    def __init__(self, calldata):
        self.calldata = calldata


class MockMessage:
    def __init__(self, sender_address="0x1111111111111111111111111111111111111111", value=0):
        self.sender_address = sender_address
        self.value = value

    @property
    def sender(self):
        return self.sender_address

    @sender.setter
    def sender(self, val):
        self.sender_address = val


class MockNondetWeb:
    def __init__(self):
        self.mock_responses = {}

    def render(self, url, mode="text"):
        if url in self.mock_responses:
            return self.mock_responses[url]
        return "PATIENTS:120 ORR:0.75 SAE:0.02 P_VALUE:0.001"


class MockNondet:
    def __init__(self):
        self.web = MockNondetWeb()
        self.llm_response = {
            "canary": "CANARY_AGENT_FDA_SAFETY_V1",
            "verdict": "MILESTONE_APPROVED",
            "confidence": 98,
            "measured_efficacy_pct": 75,
            "measured_sae_pct": 2,
            "reason": "Phase II endpoint met with high efficacy and acceptable safety profile."
        }

    def exec_prompt(self, prompt, response_format="json"):
        return self.llm_response


class MockVM:
    class Return:
        def __init__(self, calldata):
            self.calldata = calldata

    def run_nondet(self, leader_fn, validator_fn):
        leader_res = leader_fn()
        valid = validator_fn(self.Return(leader_res))
        assert valid, "Validator function failed on leader result"
        return leader_res


class MockGenLayerEnv:
    def __init__(self):
        self.message = MockMessage()
        self.nondet = MockNondet()
        self.vm = MockVM()
        self.contracts = {}

    def get_contract_at(self, address):
        addr_str = str(address).lower()
        if addr_str not in self.contracts:
            self.contracts[addr_str] = MockTransferContract(addr_str)
        return self.contracts[addr_str]


def setup_gl_mock():
    import types
    mock_env = MockGenLayerEnv()

    gl_module = types.ModuleType("genlayer")

    class UserError(Exception):
        pass

    class ContractStorageBase:
        def __new__(cls, *args, **kwargs):
            instance = super().__new__(cls)
            instance.trials = {}
            instance.trial_ids = []
            return instance

    gl_module.UserError = UserError
    gl_module.Address = SimulatedAddress
    gl_module.bigint = lambda x: int(x)
    gl_module.u8 = lambda x: int(x)
    gl_module.u32 = lambda x: int(x)
    gl_module.u64 = lambda x: int(x)
    gl_module.u256 = lambda x: int(x)
    gl_module.TreeMap = dict
    gl_module.DynArray = list
    gl_module.allow_storage = lambda cls: cls
    gl_module.Contract = ContractStorageBase

    # Decorators
    class PublicDecorator:
        def view(self, fn): return fn
        def write(self, fn): return fn
        class WriteClass:
            def __call__(self, fn): return fn
            def payable(self, fn): return fn
        write = WriteClass()

    mock_public = PublicDecorator()
    mock_env.Contract = ContractStorageBase
    mock_env.public = mock_public
    gl_module.gl = mock_env

    sys.modules["genlayer"] = gl_module
    if "contract" in sys.modules:
        del sys.modules["contract"]

    return mock_env


# ---------------------------------------------------------------------------
# UNIT TESTS: Full Coverage for AgentFDA Lifecycle, Adjudication, Biohazard & Appeals
# ---------------------------------------------------------------------------

def test_agent_fda_approved_lifecycle():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    sponsor = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    cro = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    # Step 1: Sponsor locks milestone grant
    mock_env.message.sender_address = sponsor
    escrow_amount = 1_000_000_000_000_000_000  # 1 GEN
    mock_env.message.value = escrow_amount

    trial_id = app.create_trial_grant(
        "CTX-904 Oncology Kinase Inhibitor",
        5,  # max 5% SAE
        60, # min 60% efficacy
        6000
    )
    assert trial_id == 1
    assert app.total_grant_locked == escrow_amount

    # Step 2: CRO claims trial & submits cohort logs
    mock_env.message.sender_address = cro
    cohort_url = "https://clinicaltrials-data.org/ctx904/cohort_phase2.json"
    dsmb_url = "https://dsmb-audit.org/reports/ctx904_safety_q3.txt"
    app.submit_trial_data(trial_id, cohort_url, dsmb_url)

    trial_data = json.loads(app.get_trial(trial_id))
    assert trial_data["status"] == 1  # STATUS_IN_TRIAL
    assert trial_data["investigator"] == str(cro).lower()

    # Step 3: Mock AI Review Board -> 75% ORR, 2% SAE (Safe & Effective)
    mock_env.nondet.web.mock_responses[cohort_url] = "PATIENTS:120 ORR:0.75 SAE:0.02 P_VALUE:0.001"
    mock_env.nondet.web.mock_responses[dsmb_url] = "DSMB SAFETY AUDIT: Zero unexpected toxicities. SAE rate 2.0%."
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "MILESTONE_APPROVED",
        "confidence": 98,
        "measured_efficacy_pct": 75,
        "measured_sae_pct": 2,
        "reason": "Phase II endpoint met with high efficacy and acceptable safety profile."
    }

    mock_env.message.sender_address = sponsor
    app.adjudicate_milestone(trial_id)

    trial_mid = json.loads(app.get_trial(trial_id))
    assert trial_mid["status"] == 2  # AWAITING_PAYOUT
    assert trial_mid["verdict"] == "MILESTONE_APPROVED"
    assert len(trial_mid["evidence_hash"]) == 64
    assert trial_mid["measured_efficacy_pct"] == 75
    assert trial_mid["measured_sae_pct"] == 2

    # Step 4: Advance beyond 24 blocks cooling-off window and finalize settlement
    app.trial_counter += 25
    app.finalize_settlement(trial_id)

    trial_final = json.loads(app.get_trial(trial_id))
    assert trial_final["status"] == 3  # STATUS_SETTLED_APPROVED
    assert app.total_grant_locked == 0
    assert app.total_trials_settled == 1

    # Verify CRO received 100% payout
    cro_transfers = mock_env.get_contract_at(cro).transfers
    assert len(cro_transfers) == 1
    assert cro_transfers[0]["value"] == escrow_amount


def test_agent_fda_safety_terminated_on_high_sae():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    sponsor = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    cro = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_env.message.sender_address = sponsor
    escrow_amount = 1_000_000_000_000_000_000
    mock_env.message.value = escrow_amount

    trial_id = app.create_trial_grant("NEURO-712 Alzheimer Peptide", 4, 50, 6000)

    mock_env.message.sender_address = cro
    cohort_url = "https://clinicaltrials-data.org/neuro712/cohort.json"
    dsmb_url = "https://dsmb-audit.org/reports/neuro712_safety.txt"
    app.submit_trial_data(trial_id, cohort_url, dsmb_url)

    # Mock AI Review Board -> SAE 12% > Max allowable 4% -> Terminated!
    mock_env.nondet.web.mock_responses[cohort_url] = "SAE_RATE: 0.12 PATIENTS:80"
    mock_env.nondet.web.mock_responses[dsmb_url] = "ACUTE TOXICITY: Multiple brain edema incidents reported."
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "SAFETY_TERMINATED",
        "confidence": 99,
        "measured_efficacy_pct": 55,
        "measured_sae_pct": 12,
        "reason": "High neuro-toxicity and multiple acute brain edema events detected."
    }

    mock_env.message.sender_address = sponsor
    app.adjudicate_milestone(trial_id)

    trial_mid = json.loads(app.get_trial(trial_id))
    assert trial_mid["status"] == 2  # AWAITING_PAYOUT
    assert trial_mid["verdict"] == "SAFETY_TERMINATED"
    assert trial_mid["measured_sae_pct"] == 12

    # Finalize settlement refunds sponsor 100%
    app.trial_counter += 25
    app.finalize_settlement(trial_id)

    trial_final = json.loads(app.get_trial(trial_id))
    assert trial_final["status"] == 4  # STATUS_SETTLED_BIOHAZARD

    sponsor_transfers = mock_env.get_contract_at(sponsor).transfers
    assert len(sponsor_transfers) == 1
    assert sponsor_transfers[0]["value"] == escrow_amount


def test_agent_fda_appeal_inconclusive_settlement():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    sponsor = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    cro = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_env.message.sender_address = sponsor
    escrow_amount = 1_000_000_000_000_000_000
    mock_env.message.value = escrow_amount

    trial_id = app.create_trial_grant("CAR-T-99 Immunotherapy", 5, 70, 6000)

    mock_env.message.sender_address = cro
    cohort_url = "https://clinicaltrials-data.org/cart99/cohort.json"
    dsmb_url = "https://dsmb-audit.org/reports/cart99_safety.txt"
    app.submit_trial_data(trial_id, cohort_url, dsmb_url)

    # Initial adjudication: safety terminated
    mock_env.nondet.web.mock_responses[cohort_url] = "RESPONSE:45% SAE:7%"
    mock_env.nondet.web.mock_responses[dsmb_url] = "CRS Grade 3 observed"
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "SAFETY_TERMINATED",
        "confidence": 95,
        "measured_efficacy_pct": 45,
        "measured_sae_pct": 7,
        "reason": "Elevated Cytokine Release Syndrome above 5% threshold."
    }

    mock_env.message.sender_address = cro
    app.adjudicate_milestone(trial_id)

    # CRO stakes 10% appeal bond within cooling window
    mock_env.message.sender_address = cro
    bond = 100_000_000_000_000_000  # 0.1 GEN
    mock_env.message.value = bond

    app.appeal_verdict(trial_id, "Re-classified CRS Grade 1 non-serious under revised protocol.")
    trial_disp = json.loads(app.get_trial(trial_id))
    assert trial_disp["status"] == 6  # STATUS_DISPUTED

    # Appellate review finds safety verified but efficacy still marginal -> APPEAL_UPHELD_INCONCLUSIVE
    supp_url = "https://supplemental-cro-audit.org/cart99_reviewed.json"
    mock_env.nondet.web.mock_responses[supp_url] = "Verified SAE rate 3.5%, efficacy 55%"
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "APPEAL_UPHELD_INCONCLUSIVE",
        "reason": "Safety limits honored upon re-adjudication, but efficacy falls short of 70%."
    }

    app.adjudicate_appeal(trial_id, supp_url)

    trial_final = json.loads(app.get_trial(trial_id))
    assert trial_final["status"] == 5  # STATUS_SETTLED_INCONCLUSIVE
    assert trial_final["verdict"] == "TRIAL_INCONCLUSIVE"

    # Payout is 50/50 split of escrow (0.5 GEN each) and bond forfeited to sponsor
    cro_transfers = mock_env.get_contract_at(cro).transfers
    sponsor_transfers = mock_env.get_contract_at(sponsor).transfers

    assert any(t["value"] == 500_000_000_000_000_000 for t in cro_transfers)
    assert any(t["value"] == 500_000_000_000_000_000 for t in sponsor_transfers)
    assert any(t["value"] == bond for t in sponsor_transfers)
