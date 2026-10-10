# Approach Document — Home Credit LAP Voice Agent

## 1. Requirements & Objective
The objective is to deliver an autonomous AI voice agent built on Retell AI for **Home Credit** that engages existing customers via outbound/inbound phone calls regarding a pre-approved Loan Against Property (LAP) offer up to ₹75,00,000 (75 Lakhs). The agent must:
- Confirm customer identity and availability without disclosing sensitive details prematurely.
- Rule out running loans / balance transfers and route to transfer specialists.
- Accurately collect and evaluate 7 qualification criteria.
- Adhere strictly to conversational constraints (max 2 short sentences/turn, 1 question/turn, no invented facts/rates).
- Hand off qualified leads to a senior loan expert or gracefully disqualify failed criteria.

## 2. Business Rules Matrix
| Item | Field Name | Valid / Eligible Values | Ineligible Values (Action) |
|---|---|---|---|
| 1 | `property_type` | Residential, Commercial, Industrial | Agricultural (Disqualify & End) |
| 2 | `ownership` | Sole, Joint | None |
| 3 | `documents_available`| Originals available (home/locker/produceable)| Photocopies only, lost, none (Disqualify & End) |
| 4 | `loan_amount` | ≤ ₹75,00,000 | > ₹75,00,000 (Limit Flow: Offer ₹75L cap) |
| 5a| `occupation` | Salaried, Self-employed | None |
| 5b| `income_mode` | Bank transfer / direct account deposit | Cash (Disqualify & End) |
| 6 | `market_value` | Any numeric estimate (NO minimum floor) | None |
| 7 | `tenure` | 3 to 15 years inclusive (36–180 months) | < 3 or > 15 years (Disqualify & End) |

**Special Flows:**
- **Transfer Flow:** Triggered if an existing loan is present, documents are pledged with another lender, or borrower requests EMI reduction. Immediate handoff line to "loan transfer specialist" and termination.
- **Limit Flow:** Triggered if loan requested exceeds ₹75 Lakhs. Explains ceiling, asks if they want to proceed with ₹75L. If Yes: set `loan_amount = 75,00,000`; if No: polite exit.

## 3. State Variables
The agent maintains internal slot-filling state across turns:
```json
{
  "property_type": "Residential | Commercial | Industrial | UNKNOWN",
  "ownership": "Sole | Joint | UNKNOWN",
  "documents_available": true | false | UNKNOWN,
  "loan_amount": 0,
  "occupation": "Salaried | Self-Employed | UNKNOWN",
  "income_mode": "Bank | Cash | UNKNOWN",
  "market_value": 0,
  "tenure": 0,
  "existing_loan": false,
  "disqualified": false,
  "transfer_required": false
}
```

## 4. Per-Turn Algorithmic State Machine
Every customer turn executes a 5-stage deterministic pipeline:
```
Customer Utterance
       │
       ▼
[1. Extract] ─── Multi-entity extraction across all 7 items + intent flags
       │
       ▼
[2. Validate] ── Compare extracted values against eligibility criteria
       │
       ▼
[3. Update] ─── Overwrite state; latest correction supersedes prior answers
       │
       ▼
[4. Flow Check]
   ├─► Ineligible? ──────────► [Disqualify Flow] ──► End Call
   ├─► Existing Loan / EMI? ─► [Transfer Flow] ────► End Call
   ├─► Amount > ₹75L? ───────► [Limit Flow] ───────► Offer ₹75L Cap
   ├─► Question / Diversion? ─► Brief Answer ───────► (Continue below)
   │
   ▼
[5. Checklist Gate]
   ├─► All 7 Validated? ─────► [Handoff Gate] ─────► End Call
   └─► Pending Item? ────────► Ask EARLIEST unfulfilled item (1 question only)
```

## 5. Edge Cases & Resilience
1. **Out-of-Order / Clustered Answers:** Spoken answers frequently bundle multiple fields (e.g., *"My own flat, worth 1.2 Cr, need 40L"*). The agent extracts `property_type`, `ownership`, `market_value`, and `loan_amount` at once, updates state, and advances to `documents_available` without redundant questions.
2. **Ambiguity & Vague Responses:** If a customer says *"Papers are somewhere"*, the agent does not presume eligibility; it issues a targeted clarification before progressing.
3. **Interest Rate & Product Inquiries:** Zero hallucinations. The agent explicitly states that exact interest rates and loan terms are provided by the senior loan expert.
4. **Self-Correction & Contradiction:** When a borrower corrects themselves (*"10 years... actually 12"* or *"Residential... no, agricultural"*), the latest value overrides previous memory. Ineligible updates trigger immediate polite termination.
5. **Language & Persona Integrity:** In Hindi mode, strict female/male grammatical inflections are maintained matching `agent_gender`.

## 6. Testing Summary & Results Matrix
20 test scenarios were simulated and validated across all branches:
| Category | Scenarios | Target Verification | Result |
|---|---|---|---|
| Core Happy Path | 01, 08 | Full 7-item collection, handoff to senior loan expert | **PASS** |
| Disqualification | 02, 03, 04, 05, 06 | Immediate polite exit on Agricultural, Cash, No docs, <3y, >15y | **PASS** |
| Limit Flow | 07, 07b | Capped offer at ₹75L; proceeds on acceptance, clean exit on decline | **PASS** |
| Transfer Specialist | 09, 10 | Routes running loans and EMI reduction requests immediately | **PASS** |
| Conversational Agility | 11, 13, 14, 15 | Multi-slot absorption, self-correction, contradict-and-exit | **PASS** |
| Diversions & Handling | 12, 16, 17, 18, 19 | Callback capture, zero hallucination on rates, identity gating | **PASS** |
| Localization | 20 | Complete Hindi flow with correct feminine grammatical gender | **PASS** |
