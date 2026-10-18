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
        self.default_response = "PATIENTS:120 ORR:0.75 SAE:0.02 P_VALUE:0.001"

    def render(self, url, mode="text"):
        if url in self.mock_responses:
            return self.mock_responses[url]
        return self.default_response


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
            instance.claimable_balances = {}
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
    mock_env.UserError = UserError
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
    assert trial_id == "1"
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

    # Step 4: Advance beyond 24 blocks cooling-off window (72s) and finalize settlement
    # Update timestamp
    mock_env.message_raw = {"datetime": "2026-10-16T15:00:00Z"}
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
    mock_env.message_raw = {"datetime": "2026-10-16T15:00:00Z"}
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
    supp_url = "https://supplemental-cro-audit.org/cart99_reviewed.json"

    app.appeal_verdict(trial_id, "Re-classified CRS Grade 1 non-serious under revised protocol.", supp_url)
    trial_disp = json.loads(app.get_trial(trial_id))
    assert trial_disp["status"] == 6  # STATUS_DISPUTED

    # Appellate review finds safety verified but efficacy still marginal -> APPEAL_UPHELD_INCONCLUSIVE
    mock_env.nondet.web.mock_responses[supp_url] = "Verified SAE rate 3.5%, efficacy 55%"
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "APPEAL_UPHELD_INCONCLUSIVE",
        "reason": "Safety limits honored upon re-adjudication, but efficacy falls short of 70%."
    }

    app.adjudicate_appeal(trial_id)

    trial_final = json.loads(app.get_trial(trial_id))
    assert trial_final["status"] == 5  # STATUS_SETTLED_INCONCLUSIVE
    assert trial_final["verdict"] == "TRIAL_INCONCLUSIVE"

    # Payout is 50/50 split of escrow (0.5 GEN each) and bond returned to appellant
    cro_transfers = mock_env.get_contract_at(cro).transfers
    sponsor_transfers = mock_env.get_contract_at(sponsor).transfers

    assert any(t["value"] == 500_000_000_000_000_000 for t in cro_transfers)
    assert any(t["value"] == 500_000_000_000_000_000 for t in sponsor_transfers)
    assert any(t["value"] == bond for t in cro_transfers)


def test_agent_fda_unresolved_on_unreachable_evidence():
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    sponsor = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    cro = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_env.message.sender_address = sponsor
    mock_env.message.value = 1_000_000_000_000_000_000
    trial_id = app.create_trial_grant("UNRESOLVED-DRUG", 5, 60, 6000)

    mock_env.message.sender_address = cro
    app.submit_trial_data(trial_id, "https://dead-link-404.com/cohort", "https://dead-link-404.com/dsmb")

    # Both links unreachable
    mock_env.nondet.web.mock_responses = {}
    mock_env.nondet.web.default_response = ""

    mock_env.message.sender_address = cro
    app.adjudicate_milestone(trial_id)

    trial_unres = json.loads(app.get_trial(trial_id))
    assert trial_unres["status"] == 8  # STATUS_UNRESOLVED
    assert "UNRESOLVED_FETCH_FAILED" in trial_unres["verdict"]

    # Finalize must be rejected
    with pytest.raises(Exception) as exc:
        app.finalize_settlement(trial_id)
    assert "Cannot settle trial in an unresolved error state" in str(exc.value)


def test_contract_method_signatures_appeal_flow():
    """
    Verifies that the contract method signatures strictly match the specification:
    - appeal_verdict(self, trial_id: str, dispute_reason: str, supplemental_audit_url: str)
    - adjudicate_appeal(self, trial_id: str) with NO extra arguments.
    """
    import inspect
    setup_gl_mock()
    import contract

    # 1. Verify appeal_verdict signature has supplemental_audit_url
    sig_appeal = inspect.signature(contract.Contract.appeal_verdict)
    appeal_params = list(sig_appeal.parameters.keys())
    assert appeal_params == ["self", "trial_id", "dispute_reason", "supplemental_audit_url"], (
        f"appeal_verdict signature mismatch! Expected ['self', 'trial_id', 'dispute_reason', 'supplemental_audit_url'], got {appeal_params}"
    )

    # 2. Verify adjudicate_appeal signature (strictly trial_id only, no extra arguments)
    sig_adjudicate = inspect.signature(contract.Contract.adjudicate_appeal)
    adjudicate_params = list(sig_adjudicate.parameters.keys())
    assert adjudicate_params == ["self", "trial_id"], (
        f"adjudicate_appeal signature mismatch! Expected ['self', 'trial_id'], got {adjudicate_params}"
    )


def test_appeal_verdict_signature_and_argument_validation():
    """
    Verifies runtime enforcement of appeal_verdict arguments:
    - Requires supplemental_audit_url (missing argument raises TypeError)
    - Rejects invalid URL format (raises gl.UserError)
    - Records supplemental_evidence_url on-chain when valid arguments are supplied.
    """
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    sponsor = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    cro = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_env.message.sender_address = sponsor
    mock_env.message.value = 1_000_000_000_000_000_000
    trial_id = app.create_trial_grant("ONCO-SIG-CHECK", 5, 70, 6000)

    mock_env.message.sender_address = cro
    cohort_url = "https://clinicaltrials.org/onco/cohort.json"
    dsmb_url = "https://dsmb.org/onco/safety.txt"
    app.submit_trial_data(trial_id, cohort_url, dsmb_url)

    # Adjudicate to reach AWAITING_PAYOUT
    mock_env.nondet.web.mock_responses[cohort_url] = "EFFICACY:40% SAE:8%"
    mock_env.nondet.web.mock_responses[dsmb_url] = "Toxicity observed."
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "SAFETY_TERMINATED",
        "confidence": 92,
        "measured_efficacy_pct": 40,
        "measured_sae_pct": 8,
        "reason": "Excess SAE rate detected.",
    }
    app.adjudicate_milestone(trial_id)

    # 1. Missing supplemental_audit_url must raise TypeError
    mock_env.message.sender_address = cro
    mock_env.message.value = 100_000_000_000_000_000  # 10% bond
    with pytest.raises(TypeError):
        # Calling with only 2 arguments instead of 3
        app.appeal_verdict(trial_id, "Missing supplemental URL parameter test")  # type: ignore

    # 2. Invalid non-HTTP/HTTPS supplemental_audit_url must raise gl.UserError
    with pytest.raises(contract.gl.UserError) as exc_url:
        app.appeal_verdict(trial_id, "Valid justification provided here", "ftp://invalid-evidence.org/data")
    assert "Valid supplemental audit URL required" in str(exc_url.value)

    # 3. Valid appeal with all arguments must succeed and record supplemental_evidence_url
    valid_supp_url = "https://independent-dsmb.org/re-audit/onco_sig_checked.json"
    app.appeal_verdict(trial_id, "Pathology re-classified adverse event as unrelated to trial candidate.", valid_supp_url)

    t = app.trials[trial_id]
    assert t.status == contract.STATUS_DISPUTED
    assert t.supplemental_evidence_url == valid_supp_url
    assert t.dispute_bond == 100_000_000_000_000_000


def test_adjudicate_appeal_signature_and_no_extra_arguments():
    """
    Verifies that adjudicate_appeal strictly takes only trial_id:
    - Passing an extra argument raises TypeError
    - Calling with only trial_id renders the bound supplemental_evidence_url without extra params.
    """
    mock_env = setup_gl_mock()
    import contract
    contract.gl = mock_env

    app = contract.Contract()
    sponsor = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    cro = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_env.message.sender_address = sponsor
    mock_env.message.value = 1_000_000_000_000_000_000
    trial_id = app.create_trial_grant("ONCO-EXTRA-ARG-CHECK", 5, 70, 6000)

    mock_env.message.sender_address = cro
    app.submit_trial_data(trial_id, "https://trials.org/data", "https://dsmb.org/audit")

    mock_env.nondet.web.mock_responses["https://trials.org/data"] = "EFFICACY:40% SAE:8%"
    mock_env.nondet.web.mock_responses["https://dsmb.org/audit"] = "Toxicity observed."
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "SAFETY_TERMINATED",
        "confidence": 90,
        "measured_efficacy_pct": 40,
        "measured_sae_pct": 8,
        "reason": "Exceeded safety threshold.",
    }
    app.adjudicate_milestone(trial_id)

    mock_env.message.sender_address = cro
    mock_env.message.value = 100_000_000_000_000_000
    supp_url = "https://independent-dsmb.org/re-audit/resolved.json"
    app.appeal_verdict(trial_id, "Adverse event re-classified after unblinded review.", supp_url)

    # 1. Calling adjudicate_appeal with extra arguments must raise TypeError
    with pytest.raises(TypeError):
        # Extra argument passed to adjudicate_appeal
        app.adjudicate_appeal(trial_id, supp_url)  # type: ignore

    # 2. Calling with strictly trial_id succeeds and uses the bound supplemental URL
    mock_env.nondet.web.mock_responses[supp_url] = "CONFIRMED: SAE 2.5%, Efficacy 72%"
    mock_env.nondet.llm_response = {
        "canary": "CANARY_AGENT_FDA_SAFETY_V1",
        "verdict": "APPEAL_UPHELD_APPROVED",
        "reason": "Supplemental audit verified safety compliance and endpoint clearance.",
    }

    app.adjudicate_appeal(trial_id)

    t = app.trials[trial_id]
    assert t.status == contract.STATUS_SETTLED_APPROVED
    assert t.verdict == "MILESTONE_APPROVED"

