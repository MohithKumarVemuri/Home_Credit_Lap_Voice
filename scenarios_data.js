/**
 * Scenarios Data for Home Credit LAP Voice Agent
 * Defines all 20 test scenarios with conversational turns and expected validation flags
 */

const SCENARIOS = [
  {
    id: "01",
    title: "Happy Path (Full Qualification)",
    category: "Core",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Residential house, sole owner, original documents ready, ₹50L loan, salaried with bank deposit, ₹1Cr market value, 10 years tenure.",
    turns: [
      "Yeah, speaking. Who is this?",
      "Yeah, sure, I have a couple of minutes.",
      "Fresh loan, no existing loan on it.",
      "It is my residential house.",
      "Sole owner, only in my name.",
      "Yes, all original papers are at home.",
      "Around fifty lakh rupees.",
      "I am salaried, and my salary comes in my bank account.",
      "Current market value is about one crore.",
      "Ten years."
    ]
  },
  {
    id: "02",
    title: "Agricultural Land Disqualification",
    category: "Disqualification",
    expectedOutcome: "DISQUALIFIED",
    description: "Property is agricultural land; triggers immediate polite disqualification.",
    turns: [
      "Yes, speaking.",
      "Sure, go on.",
      "Fresh loan.",
      "Actually, it's agricultural land."
    ]
  },
  {
    id: "03",
    title: "Cash Income Disqualification",
    category: "Disqualification",
    expectedOutcome: "DISQUALIFIED",
    description: "Self-employed customer receiving all income in cash; triggers immediate disqualification.",
    turns: [
      "Yes, Rahul here.",
      "Yes, I have two minutes.",
      "Fresh loan.",
      "Residential flat.",
      "Sole owner.",
      "Original papers are available.",
      "Thirty lakh rupees.",
      "I am self-employed with a shop, but all income is in cash."
    ]
  },
  {
    id: "04",
    title: "No Original Documents",
    category: "Disqualification",
    expectedOutcome: "DISQUALIFIED",
    description: "Original documents lost or only photocopies available; triggers immediate disqualification.",
    turns: [
      "Speaking.",
      "Yes, tell me.",
      "Fresh loan.",
      "Commercial shop.",
      "Jointly owned with my brother.",
      "No, originals were lost, I only have photocopies and xerox."
    ]
  },
  {
    id: "05",
    title: "Tenure Too Short (< 3 Years)",
    category: "Disqualification",
    expectedOutcome: "DISQUALIFIED",
    description: "Customer requests 2 years repayment tenure; disqualified without bargaining.",
    turns: [
      "Yes.",
      "Yes.",
      "Fresh loan.",
      "Residential.",
      "Sole owner.",
      "Original papers ready.",
      "Twenty-five lakh.",
      "Salaried, received in bank.",
      "Sixty lakh.",
      "I want to repay in two years."
    ]
  },
  {
    id: "06",
    title: "Tenure Too Long (> 15 Years)",
    category: "Disqualification",
    expectedOutcome: "DISQUALIFIED",
    description: "Customer requests 20 years repayment tenure; disqualified immediately.",
    turns: [
      "Yes.",
      "Sure.",
      "Fresh loan.",
      "Residential house.",
      "Sole owner.",
      "Originals available.",
      "Forty lakh.",
      "Salaried in bank.",
      "Eighty lakh.",
      "Can we do twenty years?"
    ]
  },
  {
    id: "07",
    title: "Over Limit — Accepts ₹75L Cap",
    category: "Limit Flow",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer asks for ₹90L, agent explains ₹75L ceiling, customer accepts ₹75L cap and completes checklist.",
    turns: [
      "Yes, speaking.",
      "Yes.",
      "Fresh loan.",
      "Residential.",
      "Sole owner.",
      "Available at home.",
      "I need ninety lakh rupees.",
      "Yes, seventy-five lakh works for me.",
      "Salaried, bank transfer.",
      "Two crore.",
      "Ten years."
    ]
  },
  {
    id: "07b",
    title: "Over Limit — Declines ₹75L Cap",
    category: "Limit Flow",
    expectedOutcome: "ENDED",
    description: "Customer asks for ₹90L, agent offers ₹75L cap, customer refuses and call ends politely.",
    turns: [
      "Speaking.",
      "Yes.",
      "Fresh loan.",
      "Commercial office.",
      "Sole owner.",
      "Originals are with me.",
      "Ninety lakh rupees minimum.",
      "No, seventy-five is too less for my project, not interested."
    ]
  },
  {
    id: "08",
    title: "Joint Ownership Accepted",
    category: "Core",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Property jointly owned with wife is valid and eligible.",
    turns: [
      "Yes, speaking.",
      "Sure.",
      "Fresh loan.",
      "Residential.",
      "It is jointly owned with my wife.",
      "Yes, original papers are at home.",
      "Forty-five lakh.",
      "Salaried, bank credit.",
      "Ninety lakh.",
      "Seven years."
    ]
  },
  {
    id: "09",
    title: "Existing Running Loan (Transfer Trigger)",
    category: "Transfer Flow",
    expectedOutcome: "TRANSFER_FLOW",
    description: "Customer already has a running loan; routed to loan transfer specialist and call terminated.",
    turns: [
      "Yes, speaking.",
      "Yes, tell me.",
      "I already have an existing loan running on this house with another bank."
    ]
  },
  {
    id: "10",
    title: "EMI Reduction Request (Transfer Trigger)",
    category: "Transfer Flow",
    expectedOutcome: "TRANSFER_FLOW",
    description: "Customer requests to reduce existing EMI; routed directly to transfer specialist.",
    turns: [
      "Yes, Rahul here.",
      "Yes, but can you help reduce my EMI on my current home loan?"
    ]
  },
  {
    id: "11",
    title: "Out-of-Order Multi-Slot Utterance",
    category: "Conversational Agility",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer provides property type, market value, and ownership in single turn; agent only asks next missing items.",
    turns: [
      "Speaking.",
      "Yes, go ahead.",
      "Look, it's a residential house, worth about 1.2 crore, and I own it jointly with my wife. Clean fresh loan.",
      "Yes, original registry papers are available.",
      "Sixty lakh.",
      "Self-employed consultant, income in bank.",
      "Eight years."
    ]
  },
  {
    id: "12",
    title: "Customer Busy / Meeting",
    category: "Call Flow",
    expectedOutcome: "ENDED",
    description: "Customer is driving / in a meeting; agent asks convenient callback time and ends call without pitch.",
    turns: [
      "Yeah, speaking.",
      "I'm in a meeting right now, can't talk.",
      "Call me tomorrow at 4 PM."
    ]
  },
  {
    id: "13",
    title: "Self-Correction on Tenure",
    category: "Conversational Agility",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer initially says 10 years then corrects to 12 years; latest value is accepted.",
    turns: [
      "Yes, speaking.",
      "Yes.",
      "Fresh loan.",
      "Residential.",
      "Sole owner.",
      "Originals available.",
      "Thirty-five lakh.",
      "Salaried, in bank.",
      "Seventy lakh.",
      "Ten years… actually make it twelve years."
    ]
  },
  {
    id: "14",
    title: "Contradiction to Ineligible Overwrite",
    category: "Conversational Agility",
    expectedOutcome: "DISQUALIFIED",
    description: "Customer says residential then contradicts to agricultural; latest ineligible value disqualifies.",
    turns: [
      "Yes, speaking.",
      "Yes.",
      "Fresh loan.",
      "Residential… no, wait, actually it is agricultural land."
    ]
  },
  {
    id: "15",
    title: "Compound 4-Fact Multi-Answer",
    category: "Conversational Agility",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer answers property type, ownership, docs, loan amount, and tenure together; agent asks only occupation/income.",
    turns: [
      "Yes, speaking.",
      "Yes, go ahead.",
      "Look, it's my own residential house, originals are available at home, I need forty lakh, and I want ten years tenure. No running loan on it.",
      "Salaried software professional, income credited to bank.",
      "Eighty lakh."
    ]
  },
  {
    id: "16",
    title: "Interest Rate Diversion Handling",
    category: "Diversion",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer interrupts asking for interest rate; agent explains loan expert will provide rate and resumes checklist.",
    turns: [
      "Speaking.",
      "What is your exact interest rate?",
      "Fresh loan.",
      "Residential.",
      "Sole owner.",
      "Yes, available.",
      "Fifty lakh.",
      "Salaried in bank.",
      "One crore.",
      "Five years."
    ]
  },
  {
    id: "17",
    title: "Mid-Question Interruption Handling",
    category: "Diversion",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer asks what documents are needed mid-question; agent clarifies concisely and resumes question.",
    turns: [
      "Yes.",
      "Yes.",
      "Fresh loan.",
      "Residential.",
      "Sole owner.",
      "Wait, what documents do you need?",
      "Yes, I have the original registry.",
      "Thirty lakh.",
      "Salaried in bank.",
      "Sixty lakh.",
      "Five years."
    ]
  },
  {
    id: "18",
    title: "Ambiguous Documents Clarified",
    category: "Resilience",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer says 'papers are probably somewhere'; agent confirms availability before qualifying.",
    turns: [
      "Yes, speaking.",
      "Yes.",
      "Fresh loan.",
      "Commercial shop.",
      "Sole owner.",
      "Papers are probably somewhere in my locker or at home.",
      "Yes, definitely, originals are in my safe locker and I can produce them.",
      "Fifty lakh.",
      "Self-employed, received in bank.",
      "One crore.",
      "Ten years."
    ]
  },
  {
    id: "19",
    title: "Caller Identity Gate",
    category: "Security",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Customer asks 'Who is this?'; agent introduces identity without leaking offer before customer verifies.",
    turns: [
      "Who's calling?",
      "Yes, I'm Rahul Sharma.",
      "Okay, sure.",
      "Fresh loan.",
      "Residential.",
      "Sole owner.",
      "Yes, originals available.",
      "Forty lakh.",
      "Salaried in bank.",
      "Seventy-five lakh.",
      "Seven years."
    ]
  },
  {
    id: "20",
    title: "Hindi Call Flow (Strict Feminine Grammar)",
    category: "Localization",
    language: "Hindi",
    expectedOutcome: "QUALIFIED_HANDOFF",
    description: "Full flow conducted in Hindi using accurate feminine verb forms ('करती हूँ', 'बताती हूँ').",
    turns: [
      "हाँ, मैं राहुल बोल रहा हूँ।",
      "हाँ, बताइए क्या बात है?",
      "नहीं, यह नया लोन है।",
      "रिहायशी मकान है।",
      "अकेला मालिक हूँ, सिर्फ मेरे नाम है।",
      "हाँ, ओरिजिनल पेपर्स घर पर हैं।",
      "पचास लाख रुपये।",
      "प्राइवेट नौकरी करता हूँ और सैलरी बैंक में आती है।",
      "एक करोड़ रुपये।",
      "दस साल।"
    ]
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = SCENARIOS;
}
