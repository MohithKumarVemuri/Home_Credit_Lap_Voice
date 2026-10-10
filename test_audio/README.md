# Test Audio Directory (`test_audio/`)

This directory is designated for the 8 live human audio recordings conducted via **Retell AI Web Call**.

## Files Mapping (8 Live Test Calls)

| # | Audio Filename | Matching Transcript | Scenario & Business Rule Tested |
|---|---|---|---|
| **01** | `01_Happy_Path.wav` *(or `Happy_Path.wav`)* | `transcripts/01_Happy_Path.txt` | Complete 7-Slot Qualification & Senior Loan Expert Handoff |
| **02** | `02_Busy_Rescheduling.wav` *(or `Busy_Rescheduling.wav`)* | `transcripts/02_Busy_Rescheduling.txt` | Customer Busy / Callback Time Captured (Saturday 3:15 PM) |
| **03** | `03_Wrong_Person.wav` *(or `Wrong_Person.wav`)* | `transcripts/03_Wrong_Person.txt` | Identity Gate & Wrong Number Verification |
| **04** | `04_Existing_Loan.wav` *(or `Exsisting_Loan.wav`)* | `transcripts/04_Existing_Loan.txt` | Loan Transfer Flow Trigger (Transfer Specialist Handoff) |
| **05** | `05_No_Documents.wav` *(or `No_Documents.wav`)* | `transcripts/05_No_Documents.txt` | No Original Property Documents Disqualification Gate |
| **06** | `06_Maximum_Amount.wav` *(or `Maximum_Amount.wav`)* | `transcripts/06_Maximum_Amount.txt` | Over-Limit Flow (₹1 Cr requested &rarr; ₹75L offered & declined) |
| **07** | `07_Income_Type.wav` *(or `Income_Type.wav`)* | `transcripts/07_Income_Type.txt` | Cash Income Disqualification Gate |
| **08** | `08_Loan_Tenure.wav` *(or `Loan_Tenure.wav`)* | `transcripts/08_Loan_Tenure.txt` | Tenure Exceeding Limit (16 years > 15 years disqualified) |

---

## Retell AI Web Call Source
- **Platform:** Retell AI (Single Prompt Agent)
- **Agent:** Home Credit LAP Voice Qualifier
- **Format:** High-Definition `.wav` Audio (16kHz / 48kHz mono/stereo)
