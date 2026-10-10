# Test Scripts — Home Credit LAP Voice Agent

These test scripts are designed for natural vocal testing on **Retell AI** (or the included local voice simulator). They include natural spoken fillers ("umm", "yeah", "uh"), pauses, realistic hedging, interruptions, and everyday phrasing to rigorously test conversational robustness.

---

## Scenario 01: Happy Path
**Goal:** Verify complete end-to-end qualification and handoff when all 7 criteria are met.
- **Agent:** Hello, am I speaking with Rahul Sharma?
- **Customer:** Yeah, speaking. Who's this?
- **Agent:** Hi Rahul, I'm Priya calling from Home Credit. Is this a good time to talk for two minutes?
- **Customer:** Yeah, sure, I have a couple of minutes. What is it about?
- **Agent:** We're calling because, as one of our valued customers, you're eligible for a special Loan Against Property offer of up to seventy-five lakh rupees. I'd like to ask a few quick questions to check if it suits you.
- **Customer:** Okay, go ahead.
- **Agent:** Just to confirm, is this for a fresh loan, or do you already have a loan running on the property?
- **Customer:** No, it's completely clear, fresh loan only.
- **Agent:** Great. What type of property is it—residential, commercial, or industrial?
- **Customer:** It's my residential house in Delhi.
- **Agent:** Understood. Are you the sole owner of the property, or is it jointly owned?
- **Customer:** I am the sole owner, it's entirely in my name.
- **Agent:** Got it. Do you have the original property documents available for verification?
- **Customer:** Yes, absolutely, all original registry papers are right here at home.
- **Agent:** Perfect. How much loan amount are you looking for?
- **Customer:** Around fifty lakh rupees.
- **Agent:** Understood. And may I know your occupation, and whether your income is received in a bank account or cash?
- **Customer:** I work as a software engineer, so salaried, and my salary comes directly into my HDFC bank account.
- **Agent:** Thank you. What would be the approximate current market value of your property?
- **Customer:** Current market value should be around one crore.
- **Agent:** Got it. And what repayment tenure are you considering, between three and fifteen years?
- **Customer:** Let's keep it around ten years.
- **Agent:** Thank you so much, Rahul Sharma. Based on what you've shared, you're eligible to move forward. A senior loan expert will call you back shortly to share the exact interest rate and the next steps. Have a great day!
- **Outcome:** Full qualification, handoff triggered, call ends gracefully.

---

## Scenario 02: Agricultural Property
**Goal:** Verify immediate disqualification when property is agricultural.
- **Agent:** Hello, am I speaking with Rahul Sharma?
- **Customer:** Yes, speaking.
- **Agent:** Hi Rahul, I'm Priya calling from Home Credit. Is this a good time to talk for two minutes?
- **Customer:** Yeah, tell me quickly.
- **Agent:** We're calling because, as one of our valued customers, you're eligible for a special Loan Against Property offer of up to seventy-five lakh rupees. I'd like to ask a few quick questions to check if it suits you.
- **Customer:** Sure, ask.
- **Agent:** Just to confirm, is this for a fresh loan, or do you already have a loan running on the property?
- **Customer:** Fresh loan.
- **Agent:** Great. What type of property is it—residential, commercial, or industrial?
- **Customer:** Actually, it's agricultural land in Punjab, farming land basically.
- **Agent:** Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of Home Credit.
- **Outcome:** Polite disqualification, no further questions, call terminated.

---

## Scenario 03: Cash Income
**Goal:** Verify disqualification when income mode is cash.
- **Flow to Q5:** Passes items 1 to 4 (Residential, Sole, Originals available, ₹30L).
- **Agent:** And may I know your occupation, and whether your income is received in a bank account or cash?
- **Customer:** Well, I run my own retail grocery shop, self-employed, but all my customers pay in cash, so my income is purely cash.
- **Agent:** Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of Home Credit.
- **Outcome:** Polite disqualification due to cash income mode.

---

## Scenario 04: No Original Documents
**Goal:** Verify disqualification when original property documents are unavailable.
- **Flow to Q3:** Passes items 1 & 2 (Commercial shop, Joint).
- **Agent:** Do you have the original property documents available for verification?
- **Customer:** Ah, no, the originals got lost during shifting. I only have photocopies and xerox sets with me.
- **Agent:** Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of Home Credit.
- **Outcome:** Immediate polite disqualification.

---

## Scenario 05: Tenure Too Short (< 3 years)
**Goal:** Verify disqualification for tenure under 3 years without bargaining.
- **Flow to Q7:** Passes items 1 to 6.
- **Agent:** What repayment tenure are you considering, between three and fifteen years?
- **Customer:** I want to pay it off very quickly, so just two years.
- **Agent:** Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of Home Credit.
- **Outcome:** Disqualified, no counter-offer.

---

## Scenario 06: Tenure Too Long (> 15 years)
**Goal:** Verify disqualification for tenure over 15 years without bargaining.
- **Flow to Q7:** Passes items 1 to 6.
- **Agent:** What repayment tenure are you considering, between three and fifteen years?
- **Customer:** I need smaller installments, so can we do twenty years?
- **Agent:** Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of Home Credit.
- **Outcome:** Disqualified immediately.

---

## Scenario 07: Over Limit — Accepts ₹75L Cap
**Goal:** Verify limit flow explanation and graceful continuation when borrower accepts ₹75L cap.
- **Flow to Q4:** Passes items 1 to 3.
- **Agent:** How much loan amount are you looking for?
- **Customer:** I was looking for around ninety lakh rupees.
- **Agent:** This offer is available for up to seventy-five lakh rupees. Would you like to proceed with the maximum amount of seventy-five lakh?
- **Customer:** Hmm, okay, yes, seventy-five lakh will also work for me.
- **Agent:** Understood. And may I know your occupation, and whether your income is received in a bank account or cash?
- **Customer:** Salaried, bank credit.
- **Outcome:** Loan amount set to ₹75,00,000, flow continues to missing items.

---

## Scenario 07b: Over Limit — Declines ₹75L Cap
**Goal:** Verify clean exit when customer refuses the ₹75L ceiling.
- **Flow to Q4:** Passes items 1 to 3.
- **Agent:** How much loan amount are you looking for?
- **Customer:** I need ninety lakh minimum.
- **Agent:** This offer is available for up to seventy-five lakh rupees. Would you like to proceed with the maximum amount of seventy-five lakh?
- **Customer:** No, seventy-five is too less for my project, so not interested.
- **Agent:** I understand. Thank you so much for your time, and thank you for being a valued customer of Home Credit. Have a wonderful day!
- **Outcome:** Polite end without disqualification insult.

---

## Scenario 08: Joint Ownership
**Goal:** Verify that joint ownership is eligible and seamlessly accepted.
- **Flow to Q2:** Passes property type (Residential).
- **Agent:** Are you the sole owner of the property, or is it jointly owned?
- **Customer:** It's jointly owned with my wife.
- **Agent:** Understood. Do you have the original property documents available for verification?
- **Customer:** Yes, originals are in our safe.
- **Outcome:** Joint ownership accepted, proceeds to Q3.

---

## Scenario 09: Existing Running Loan (Transfer Trigger)
**Goal:** Verify transfer specialist routing when property has an active loan.
- **Agent:** Just to confirm, is this for a fresh loan, or do you already have a loan running on the property?
- **Customer:** Actually, I already have an active loan running on it with another bank.
- **Agent:** Thank you for sharing that. Since there's an existing loan, a loan transfer specialist will contact you shortly to help. Thank you for your time.
- **Outcome:** Transfer flow triggers, no checklist questions asked, call ends.

---

## Scenario 10: EMI Reduction Request (Transfer Trigger)
**Goal:** Verify balance transfer / EMI reduction triggers transfer specialist.
- **Agent:** We're calling because, as one of our valued customers, you're eligible for a special Loan Against Property offer of up to seventy-five lakh rupees. I'd like to ask a few quick questions to check if it suits you.
- **Customer:** Can you help reduce my current home loan EMI? I want a lower interest rate to bring down monthly payments.
- **Agent:** Thank you for sharing that. Since there's an existing loan, a loan transfer specialist will contact you shortly to help. Thank you for your time.
- **Outcome:** Transfer flow triggered immediately.

---

## Scenario 11: Out-of-Order Multi-Fact Utterance
**Goal:** Ensure multiple facts in one turn are extracted, validated, and agent asks *only* the next unasked item.
- **Customer Utterance at Start:** "Look, it's a residential house, worth about one point two crore, and I own it jointly with my wife. What's next?"
- **Captured Silently:**
  - `property_type`: Residential
  - `market_value`: ₹1.2 Crore
  - `ownership`: Joint
- **Agent Response:** Thank you. Do you have the original property documents available for verification?
- **Outcome:** Does not re-ask property type, ownership, or market value; directly asks documents.

---

## Scenario 12: Customer Busy / In a Meeting
**Goal:** Capture callback time with context and end call respectfully without sales pitch.
- **Agent:** Is this a good time to talk for two minutes?
- **Customer:** Hey, I'm currently driving and heading into a meeting, can't talk right now.
- **Agent:** Certainly, I understand. What would be a convenient time for us to call you back?
- **Customer:** Call me tomorrow afternoon around three PM.
- **Agent:** Understood, we'll call you tomorrow around three PM. Thank you for your time, Rahul, and have a good day!
- **Outcome:** Captures callback time, ends call cleanly without pitching loan.

---

## Scenario 13: Mid-Stream Self-Correction
**Goal:** Confirm the agent accepts the updated value over the earlier one.
- **Agent:** What repayment tenure are you considering, between three and fifteen years?
- **Customer:** I'd say ten years... wait, actually make it twelve years so my monthly installment is comfortable.
- **Agent:** Got it, twelve years.
- **Outcome:** State stores `tenure: 12`, evaluates 12 against 3–15 range (eligible).

---

## Scenario 14: Direct Contradiction / Ineligible Overwrite
**Goal:** Verify that a self-correction to an ineligible category disqualifies immediately.
- **Agent:** What type of property is it—residential, commercial, or industrial?
- **Customer:** It's residential... no, wait, actually it's agricultural farmland registered under rural quota.
- **Agent:** Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of Home Credit.
- **Outcome:** Disqualified based on latest updated answer.

---

## Scenario 15: Compound Multi-Answer
**Goal:** Verify state machine absorbs 4 facts at once and only asks the missing 5th item.
- **Customer:** It is my own residential flat, original papers are with me, I need forty lakh, and I want it for ten years.
- **Captured Silently:**
  - `property_type`: Residential
  - `ownership`: Sole
  - `documents_available`: Yes
  - `loan_amount`: ₹40,00,000
  - `tenure`: 10 years
- **Next Unanswered Item:** Occupation & income mode.
- **Agent Response:** Got it. May I know your occupation, and whether your income is received in a bank account or cash?
- **Customer:** I am salaried and salary comes in bank.
- **Agent Response:** Thank you. What would be the approximate current market value of your property?
- **Customer:** Around seventy lakh.
- **Outcome:** Reaches handoff gate cleanly with zero repetitive queries.

---

## Scenario 16: Interest Rate Diversion
**Goal:** Verify agent refuses to fabricate interest rates and smoothly returns to checklist.
- **Customer:** Before I answer, what is your exact interest rate? Is it eight percent or nine percent?
- **Agent:** The exact interest rate will be shared by our senior loan expert after this preliminary check. For now, let me complete a few basic questions. What type of property is it?
- **Outcome:** No made-up rate, explains loan expert will provide rate, returns to first missing item.

---

## Scenario 17: Mid-Question Interruption
**Goal:** Answer user's procedural interruption concisely, then resume question.
- **Agent:** Do you have the original property documents...
- **Customer:** Wait, what specific documents do you guys need for this?
- **Agent:** Usually title deeds, registry papers, and tax receipts are verified by our team. Do you have the original property documents available?
- **Outcome:** Short helpful answer, immediately resumes item 3.

---

## Scenario 18: Ambiguous Documents ("Papers are somewhere")
**Goal:** Do not assume eligibility; ask clarifying follow-up until confirmed.
- **Agent:** Do you have the original property documents available for verification?
- **Customer:** Hmm, well, the papers are probably somewhere in the house or ancestral locker, I think.
- **Agent:** To proceed, will you be able to produce the original documents for physical verification when requested?
- **Customer:** Yes, yes, I definitely have the originals and can take them out anytime.
- **Agent:** Perfect. How much loan amount are you looking for?
- **Outcome:** Clarified without guessing, proceeds smoothly.

---

## Scenario 19: Caller Identity Verification ("Who is this?")
**Goal:** Do not disclose offer or loan details until customer identity is confirmed.
- **Agent:** Hello, am I speaking with Rahul Sharma?
- **Customer:** Who's calling? Why are you calling my number?
- **Agent:** I am Priya calling from Home Credit for Rahul Sharma regarding an exclusive offer for our valued customers. May I confirm if I'm speaking with Rahul Sharma?
- **Customer:** Yes, this is Rahul.
- **Agent:** Thank you, Rahul. Is this a good time to talk for two minutes?
- **Outcome:** Identities established before loan details mentioned.

---

## Scenario 20: Hindi Call Flow
**Goal:** Complete flow in Hindi with strict feminine grammatical gender ("करती हूँ", "बताती हूँ") and polite tone.
- **Agent:** नमस्ते, क्या मेरी बात राहुल शर्मा जी से हो रही है?
- **Customer:** हाँ, मैं राहुल बोल रहा हूँ।
- **Agent:** नमस्ते राहुल जी, मैं होम क्रेडिट से प्रिया बात कर रही हूँ। क्या आपसे दो मिनट बात करने का यह सही समय है?
- **Customer:** हाँ, बताइए क्या बात है?
- **Agent:** हम आपको इसलिए कॉल कर रहे हैं क्योंकि हमारे सम्मानित ग्राहक होने के नाते आप पिचहत्तर लाख रुपये तक के प्री-एप्रूव्ड लोन अगेंस्ट प्रॉपर्टी ऑफर के पात्र हैं। मैं कुछ आसान सवाल पूछना चाहती हूँ।
- **Customer:** ठीक है, पूछिए।
- **Agent:** बस यह कन्फर्म करना था, क्या यह नए लोन के लिए है या प्रॉपर्टी पर पहले से कोई लोन चल रहा है?
- **Customer:** नहीं, यह बिलकुल नया लोन है, कोई लोन नहीं है।
- **Agent:** धन्यवाद। यह किस प्रकार की संपत्ति है—रिहायशी, व्यावसायिक, या औद्योगिक?
- **Customer:** यह हमारा रहने का मकान है, रेजिडेंशियल।
- **Agent:** समझा। क्या आप इसके अकेले मालिक हैं या यह जॉइंट ओनरशिप में है?
- **Customer:** यह सिर्फ मेरे नाम पर है, सोल ओनर हूँ।
- **Agent:** बहुत बढ़िया। क्या वेरिफिकेशन के लिए प्रॉपर्टी के मूल दस्तावेज यानी ओरिजिनल पेपर्स उपलब्ध हैं?
- **Customer:** हाँ, सारे ओरिजिनल पेपर्स घर पर ही हैं।
- **Agent:** आपको कितने लोन की आवश्यकता है?
- **Customer:** लगभग चालीस लाख रुपये।
- **Agent:** धन्यवाद। आप क्या काम करते हैं, और आपकी आय बैंक खाते में आती है या कैश में?
- **Customer:** मैं प्राइवेट नौकरी करता हूँ और सैलरी बैंक खाते में आती है।
- **Agent:** धन्यवाद। आपकी संपत्ति का वर्तमान बाजार मूल्य लगभग कितना होगा?
- **Customer:** करीब अस्सी लाख रुपये होगा।
- **Agent:** ठीक है। और तीन से पंद्रह साल के बीच आप कितने साल की अवधि रखना चाहेंगे?
- **Customer:** दस साल की अवधि सही रहेगी।
- **Agent:** बहुत-बहुत धन्यवाद, राहुल शर्मा जी। आपकी जानकारी के अनुसार आप आगे बढ़ने के पात्र हैं। हमारे सीनियर लोन एक्सपर्ट जल्द ही आपको कॉल करके ब्याज दर और आगे की प्रक्रिया बताएंगे। आपका दिन शुभ हो!
- **Outcome:** Complete Hindi flow adhering strictly to agent gender agreement and courteous demeanor.
