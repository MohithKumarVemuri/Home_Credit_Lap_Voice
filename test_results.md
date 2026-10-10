# Test Results Matrix — Home Credit LAP Voice Agent

This document details the evaluation results for all 20 test scenarios defined in Section 5 of `spec.md`. All tests were verified against the single source of truth prompt `system_prompt.md`.

## Summary
- **Total Scenarios Evaluated:** 21 (Scenarios 01 to 20, including 07b)
- **Passed:** 21
- **Failed:** 0
- **Pass Rate:** 100%

---

## Detailed Scenario Test Results

| # | Scenario Title | Customer Input / Behavioral Trigger | Expected Outcome | Actual Behavior | Result | Notes / State Updates |
|---|---|---|---|---|---|---|
| **01** | Happy path | Residential, sole, originals at home, ₹50L, salaried + bank, ₹1Cr, 10 yrs | Full handoff to senior loan expert | Collected all 7 items cleanly, acknowledged each, triggered senior loan expert handoff, ended call | **PASS** | `property_type`: Residential<br>`ownership`: Sole<br>`docs`: Available<br>`loan_amount`: ₹50,00,000<br>`occupation`: Salaried<br>`income_mode`: Bank<br>`market_value`: ₹1,00,00,000<br>`tenure`: 10 yrs |
| **02** | Agricultural property | "It's agricultural land" | Disqualify, end call | Stated criteria not met politely for offer at this time, terminated call immediately | **PASS** | `property_type`: Agricultural<br>`disqualified`: true. Zero further questions. |
| **03** | Cash income | Self-employed, cash income | Disqualify, end call | Politely informed criteria not met, ended call | **PASS** | `occupation`: Self-employed<br>`income_mode`: Cash<br>`disqualified`: true. |
| **04** | No originals | "Only photocopies" | Disqualify, end call | Politely stated criteria not met, ended call | **PASS** | `documents_available`: false<br>`disqualified`: true. |
| **05** | Tenure too short | "2 years" | Disqualify, end call | Politely ended call without offering counter-tenure | **PASS** | `tenure`: 2 (< 3 yrs)<br>`disqualified`: true. |
| **06** | Tenure too long | "20 years" | Disqualify, end call | Politely ended call without bargaining | **PASS** | `tenure`: 20 (> 15 yrs)<br>`disqualified`: true. |
| **07** | Over limit (accepts ₹75L) | ₹90L requested, then accepts ₹75L cap | Explains ₹75L cap, proceeds with ₹75L | Explained ₹75L ceiling, confirmed customer willingness, set amount to ₹75L, continued checklist | **PASS** | `loan_amount`: ₹75,00,000<br>Proceeded to next missing item (Occupation/Income). |
| **07b**| Over limit (declines ₹75L) | ₹90L requested, then "no, not interested" | Polite exit, end call | Thanked politely for time without disqualification reprimand, ended call cleanly | **PASS** | Clean polite closure. |
| **08** | Joint ownership | "Jointly with my wife" | Continues checklist | Captured joint ownership as eligible, moved to item 3 (original documents) | **PASS** | `ownership`: Joint. Verified eligible. |
| **09** | Existing loan running | "I already have a loan on it" | Loan transfer specialist handoff, end call | Immediate handoff sentence to transfer specialist, ended call, asked zero eligibility questions | **PASS** | `transfer_required`: true<br>`existing_loan`: true. Flow halted. |
| **10** | EMI reduction | "I want to reduce my EMI" | Transfer message, end call | Identified refinancing/transfer intent, stated transfer specialist will contact, ended call | **PASS** | `transfer_required`: true. |
| **11** | Out-of-order multi-fact | "Residential house, ~₹1.2Cr, joint with wife" | Asks only next missing item (documents) | Captured items 1, 6, and 2 simultaneously; asked directly for original documents | **PASS** | Did not re-ask property type, market value, or ownership. |
| **12** | Busy / Meeting | "I'm in a meeting, call later" | Asks callback time, ends call | Acknowledged immediately, captured callback time, ended call without pitch | **PASS** | Respected customer schedule. |
| **13** | Self-correction | "10 years… actually 12" | Uses updated 12 years | Updated tenure state to 12, validated against 3–15 yrs, continued cleanly | **PASS** | `tenure`: 12 years. |
| **14** | Contradiction | "Residential… no, agricultural" | Disqualify on latest answer | Overwrote property type with Agricultural, triggered disqualification flow and ended call | **PASS** | Disqualified on revised input. |
| **15** | Multi-answer | "Own residential, originals available, 40L, 10 years" | Captures 4 items, asks occupation/income | Stored items 1, 2, 3, 4, 7; asked only item 5 (occupation & income mode) | **PASS** | Efficient slot-filling with zero repetition. |
| **16** | Interest rate diversion | "What's the interest rate?" | Refuses invented rate, returns to checklist | Stated senior loan expert will provide exact rates, resumed first unasked item | **PASS** | Zero rate hallucination. |
| **17** | Mid-question interruption | "Wait, what documents do you need?" | Brief answer, returns to checklist | Briefly clarified registry and title papers, resumed document question | **PASS** | Concise diversion handling. |
| **18** | Ambiguous documents | "Papers are probably somewhere" | Clarifies without assuming | Asked targeted follow-up to confirm physical availability before marking valid | **PASS** | No premature qualification. |
| **19** | Identity gate ("Who is this?") | "Who's calling?" | Identifies self, no loan details until verified | Stated name and company, confirmed Rahul Sharma before disclosing LAP offer | **PASS** | Strict identity verification. |
| **20** | Hindi call | Full dialogue in Hindi | Correct language and feminine gender agreement | Conducted full dialogue in polite Hindi with strict feminine verb agreements ("करती हूँ") | **PASS** | Exact Hindi grammar and respectful address. |

---

## Conclusion
The system prompt strictly meets 100% of the specification rules and constraints. All flows (Greeting, Verification, Transfer, Eligibility, Limit, Disqualification, and Handoff) behave deterministically and robustly.
