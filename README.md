# Home Credit LAP Voice Agent — Retell AI Qualification Platform

An autonomous, multi-turn AI voice agent platform built for **Home Credit India** to qualify existing customers for a pre-approved **Loan Against Property (LAP)** offer of up to **₹75,00,000 (75 Lakhs)**.

This project implements the single source of truth business logic defined in `system_prompt.md` and `approach.md`, evaluated across live human phone calls conducted on **Retell AI**.

---

## 🌟 Key Features & Live Demo

- **Live Retell AI Agent (Interactive Orb):** [Test Call Priya / Monika Live on Retell AI](https://agent.retellai.com/orb/agent_b9740a70ac2775d29a08a0b8ff?token=13d66d58da761949ca2c2783ade28de4)
- **Single Source of Truth Prompt (`system_prompt.md`):** Strict implementation of all 7 eligibility business rules, transfer flows, limit flows, disqualification gates, and handoff criteria across 11 Retell dynamic variables.
- **9 Live Human Voice Test Calls:** Completed on Retell AI across core flows (Happy path, Busy callback, Wrong number, Existing loan transfer, Document verification, Over-limit cap, Cash income rejection, Tenure bounds, and Dynamic Hindi language switch with Agricultural land disqualification).
- **Sequential Multi-Slot Extraction:** Extracts out-of-order data, updates state, and never re-asks answered items; asks only the earliest unfulfilled checklist item.

---

## 📁 Repository Structure

```
home-credit-lap-voice-agent/
│
├── system_prompt.md            # Final single source of truth Retell system prompt
├── approach.md                 # Architecture, state machine algorithm & resilience doc
├── test_results.md             # Verification matrix with pass/fail evaluations
├── test_scripts.md             # Natural dialogue scripts for testing
├── README.md                   # Project overview & execution guide (this file)
│
├── transcripts/                # 9 live call transcripts matching Retell human audio
│   ├── 01_Happy_Path.txt
│   ├── 02_Busy_Rescheduling.txt
│   ├── 03_Wrong_Person.txt
│   ├── 04_Existing_Loan.txt
│   ├── 05_No_Documents.txt
│   ├── 06_Maximum_Amount.txt
│   ├── 07_Income_Type.txt
│   ├── 08_Loan_Tenure.txt
│   └── 09_Hindi_Agricultural_Disqualification.txt
│
└── test_audio/                 # Designated folder for Retell live .wav recordings
    └── README.md
```

---

## 🌐 Deploying to Retell AI (Cloud Web Calls)

To deploy the voice agent on Retell AI and record live human audio calls:

### 1. Create a Retell Agent
1. Sign in to [retellai.com](https://retellai.com) (or create a free trial account).
2. Click **Create Agent** &rarr; Select **Single Prompt Agent**.
3. Set Agent Name: `Home Credit LAP Voice Qualifier`.

### 2. Configure System Prompt
1. Copy the full content of [`system_prompt.md`](system_prompt.md) (or use the one-click copy button in the local web portal under *Retell & Prompt* tab).
2. Paste it into Retell's **Prompt** textarea.

### 3. Configure Agent Settings
- **Begin Message:**
  ```
  Hello, am I speaking with {{customer_name}}?
  ```
- **Voice Selection:** Select a professional female voice matching `agent_gender=female` (e.g. ElevenLabs Indian English or Azure Female).
- **Tools:** Enable the built-in **End Call** tool function.

### 4. Set Dynamic Test Variables
In Retell's web-call test panel, supply the following variables:
```json
{
  "company_name": "Home Credit",
  "customer_name": "Rahul Sharma",
  "agent_name": "Priya",
  "agent_gender": "female",
  "language_to_speak": "English",
  "current_date": "2026-10-09",
  "current_day": "Friday",
  "current_time": "12:30 PM",
  "additional_context_from_rag": "Home Credit LAP offer: up to ₹75 lakh, tenure 3–15 years. No rate details available."
}
```

### 5. Execute Test Calls & Record Audio
1. Click **Web Call** in Retell AI.
2. Read aloud the customer script from [`test_scripts.md`](test_scripts.md) for the target scenario.
3. Once the call concludes, go to **Call History** &rarr; Download the audio recording (`.mp3`).
4. Save the recording into `test_audio/NN_scenario.mp3`.
5. Export the transcript into `transcripts/NN_scenario.txt`.

---

## 📋 7 Business Rules Checklist

| # | Item | Eligible Values | Ineligible Values (Action) |
|---|---|---|---|
| **1** | Property Type | Residential, Commercial, Industrial | Agricultural &rarr; *Disqualify & End* |
| **2** | Ownership | Sole, Joint | None |
| **3** | Original Documents | Available for physical verification | Photocopies only / Lost / None &rarr; *Disqualify & End* |
| **4** | Loan Amount | Up to ₹75,00,000 | > ₹75,00,000 &rarr; *Limit Flow: Offer ₹75L Cap* |
| **5** | Occupation + Income Mode | Salaried / Self-Employed + Bank deposit | Cash &rarr; *Disqualify & End* |
| **6** | Market Value | Estimate captured (NO minimum floor) | None |
| **7** | Tenure | 3 to 15 years inclusive (36–180 months) | < 3 or > 15 years &rarr; *Disqualify & End* |

### Special Flows
- **Transfer Flow:** Triggered if customer has an existing running loan, wishes to lower EMI, or documents are with another lender. Agent delivers: *"Thank you for sharing that. Since there's an existing loan, a loan transfer specialist will contact you shortly to help. Thank you for your time."* and ends call immediately.
- **Limit Flow:** Triggered if loan requested exceeds ₹75 Lakh. Agent asks: *"This offer is available for up to seventy-five lakh rupees. Would you like to proceed with the maximum amount of seventy-five lakh?"* If yes &rarr; proceeds with ₹75L; if no &rarr; polite exit.
- **Handoff Gate:** Triggered only when all 7 criteria are answered and validated: *"A senior loan expert will call you back shortly to share the exact interest rate and the next steps."*

---

## 📊 Test Matrix Summary

| # | Scenario | Scenario Trigger | Expected Outcome | CLI Test |
|---|---|---|---|---|
| **01** | Happy Path | Residential, Sole, Originals, ₹50L, Salaried+Bank, ₹1Cr, 10y | `QUALIFIED_HANDOFF` | ✅ PASS |
| **02** | Agricultural | "It's agricultural land" | `DISQUALIFIED` | ✅ PASS |
| **03** | Cash Income | Self-employed, Cash income | `DISQUALIFIED` | ✅ PASS |
| **04** | No Originals | "Only photocopies and xerox" | `DISQUALIFIED` | ✅ PASS |
| **05** | Tenure Too Short | 2 years | `DISQUALIFIED` | ✅ PASS |
| **06** | Tenure Too Long | 20 years | `DISQUALIFIED` | ✅ PASS |
| **07** | Over Limit (Accepts) | ₹90L, then accepts ₹75L cap | `QUALIFIED_HANDOFF` | ✅ PASS |
| **07b**| Over Limit (Declines) | ₹90L, then declines ₹75L cap | `ENDED` | ✅ PASS |
| **08** | Joint Ownership | "Jointly with my wife" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **09** | Existing Loan | "I already have a loan running on it" | `TRANSFER_FLOW` | ✅ PASS |
| **10** | EMI Reduction | "Can you help reduce my EMI?" | `TRANSFER_FLOW` | ✅ PASS |
| **11** | Out-of-Order | "Residential, ~₹1.2Cr, joint with wife" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **12** | Busy / Meeting | "In a meeting, call tomorrow 4 PM" | `ENDED` (Callback) | ✅ PASS |
| **13** | Self-Correction | "10 years... actually 12" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **14** | Contradiction | "Residential... no, agricultural" | `DISQUALIFIED` | ✅ PASS |
| **15** | Multi-Answer | 4 facts supplied in single turn | `QUALIFIED_HANDOFF` | ✅ PASS |
| **16** | Interest Rate Diversion | "What is your interest rate?" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **17** | Interruption | "Wait, what documents do you need?" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **18** | Ambiguous Docs | "Papers are probably somewhere" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **19** | Identity Verification | "Who is calling?" | `QUALIFIED_HANDOFF` | ✅ PASS |
| **20** | Hindi Call | Complete dialogue in Hindi (fem. grammar) | `QUALIFIED_HANDOFF` | ✅ PASS |

---

## 🛠️ Technology & Platform
- **Voice Platform:** Retell AI (Single Prompt Agent Architecture)
- **Voice Engine:** Indian English High-Fidelity Female Voice (Priya)
- **Telephony & Audio:** WebRTC / Web Call Full-Duplex Audio
- **Runtime Variables:** Retell Dynamic Variables (`company_name`, `customer_name`, `agent_name`, `agent_gender`, etc.)
