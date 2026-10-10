# spec.md — Home Credit LAP Voice Agent (SalesAgents AI Assignment)

## 1. Goal
Deliver an AI voice agent (built on **Retell AI**) for "Home Credit" that calls existing customers about a pre-approved Loan Against Property (LAP) offer (up to ₹75,00,000), collects 7 eligibility data points, applies business rules, and hands qualified leads to a senior loan expert.

## 2. Deliverables
1. `system_prompt.md` — final system prompt (already drafted, refine only if tests fail)
2. `test_audio/` — one recording per scenario (recorded from Retell, by the human)
3. `transcripts/` — one transcript per recording
4. `approach.md` — short approach doc (optional, recommended)
5. `test_results.md` — scenario table with pass/fail

## 3. Source of truth: business rules
Flow: Greeting → Verify → Busy? (callback time, end) → Offer → Existing loan/EMI check (transfer, end) → 7 questions → Handoff.

| # | Item | Eligible | Not eligible |
|---|---|---|---|
| 1 | Property type | Residential, Commercial, Industrial | Agricultural |
| 2 | Ownership | Sole, Joint | — |
| 3 | Original documents | Available | Not available |
| 4 | Loan amount | ≤ ₹75L | >₹75L → explain limit, ask to proceed with ₹75L |
| 5 | Occupation + income mode | Salaried/Self-employed + Bank | Cash |
| 6 | Market value | Capture only. NO minimum | — |
| 7 | Tenure | 3–15 years | <3 or >15 |

Rules:
- Any ineligible answer at any point → polite "doesn't meet criteria for this offer at this time" → end call.
- Existing loan or EMI reduction → "loan transfer specialist will contact you shortly" → end call.
- Out-of-order answers are stored and never re-asked.
- Handoff only after all 7 answered and all passed: "senior loan expert will call back shortly with exact interest rates."
- Never invent interest rates or product facts. Use `additional_context_from_rag` only.
- Prompt variables: company_name, customer_name, agent_name, agent_gender (strict), current_date, current_day, current_time, additional_context_from_rag, language_to_speak (English/Hindi), conversation_history, customer_utterance.

## 4. Phases

### Phase 1 — Review prompt
- [ ] Read `system_prompt.md` against section 3. Fix any rule mismatch.
- [ ] Confirm every variable appears as `{{variable}}`.
- Done when: every rule in section 3 maps to a line in the prompt.

### Phase 2 — Retell setup (human does this)
- [ ] Sign up at retellai.com (free trial) → Create Agent → **Single Prompt Agent**.
- [ ] Paste `system_prompt.md` into the prompt field.
- [ ] Add begin message: `Hello, am I speaking with {{customer_name}}?`
- [ ] Enable the built-in **End Call** function.
- [ ] Pick a professional voice matching `agent_gender`.
- [ ] Choose language (English; also test Hindi if available).
- [ ] In the web-call test panel, set dynamic variables: company_name=Home Credit, customer_name=Rahul Sharma, agent_name=Priya, agent_gender=female, language_to_speak=English, current_date/day/time = today's values, additional_context_from_rag = a short product blurb (e.g. "Home Credit LAP offer: up to ₹75 lakh, tenure 3–15 years. No rate details available.").
- Note: Retell supplies conversation history and the latest utterance automatically; the variables stay in the prompt for clarity.

### Phase 3 — Test scripts
Create `test_scripts.md`: for each scenario in section 5, a short natural-speech script (with fillers, hedges, interruptions) for the human to read aloud as the customer.

### Phase 4 — Test calls (human does this)
- [ ] Run each scenario in section 5 as a Retell web call. Talk naturally.
- [ ] Download recording + transcript per call. Name files `NN_scenario.mp3` / `NN_scenario.txt`.
- [ ] Log result in `test_results.md` (pass/fail, notes).

### Phase 5 — Fix loop
- [ ] For each failure, edit `system_prompt.md` minimally, paste into Retell, re-run only affected scenarios plus 1 happy path (regression).
- Done when: all scenarios pass.

### Phase 6 — Approach doc
`approach.md` (max 1 page): requirements → rules → state variables → per-turn algorithm (extract → validate → update → ask first missing) → edge cases → testing summary with results table.

### Phase 7 — Submit
Package: system prompt text, recordings, transcripts, approach doc (optional).

## 5. Test matrix
| # | Scenario | Customer says | Expected |
|---|---|---|---|
| 01 | Happy path | Residential, sole, originals at home, ₹50L, salaried + bank, ₹1Cr, 10 yrs | Full handoff |
| 02 | Agricultural | "It's agricultural land" | Disqualify, end |
| 03 | Cash income | Self-employed, cash | Disqualify, end |
| 04 | No originals | "Only photocopies" | Disqualify, end |
| 05 | Tenure too short | 2 years | Disqualify |
| 06 | Tenure too long | 20 years | Disqualify |
| 07 | Over limit | ₹90L, then "yes" | Explains ₹75L cap, continues with ₹75L |
| 07b | Over limit, declines | ₹90L, then "no" | Polite end |
| 08 | Joint ownership | "Jointly with my wife" | Continues |
| 09 | Existing loan | "I already have a loan on it" | Transfer message, end |
| 10 | EMI reduction | "I want to reduce my EMI" | Transfer message, end |
| 11 | Out-of-order | "Residential house, ~₹1.2Cr, joint with wife" | Asks only next missing (documents) |
| 12 | Busy | "I'm in a meeting" | Asks callback time, ends |
| 13 | Self-correction | "10 years… actually 12" | Uses 12 |
| 14 | Contradiction | "Residential… no, agricultural" | Disqualify (latest answer) |
| 15 | Multi-answer | "Own residential, originals available, 40L, 10 years" | Captures all, asks only occupation/income, then market value |
| 16 | Interest rate diversion | "What's the interest rate?" | No invented rate, expert will share, returns to checklist |
| 17 | Mid-question interruption | "Wait, what documents do you need?" | Brief answer, returns to question |
| 18 | Ambiguous docs | "Papers are probably somewhere" | Clarifies, doesn't assume |
| 19 | Who is this | "Who's calling?" | Identifies self, no loan details until verified |
| 20 | Hindi call (if supported) | Full flow in Hindi | Correct language and gender forms |

## 6. Constraints
- No invented minimum market value.
- No invented interest rates or fees.
- One question per turn; max 2 short sentences per turn.
- Never qualify before all 7 items are answered.
- Never ask for Aadhaar, PAN, OTP, or bank details.

## 7. Definition of done
- All scenarios in section 5 pass.
- Recordings + transcripts exist for each.
- `system_prompt.md` is final and matches what is pasted in Retell.
