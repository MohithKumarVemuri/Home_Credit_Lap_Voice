/**
 * State Engine & Dialogue Manager for Home Credit LAP Voice Agent
 * Implements the single source of truth business logic defined in system_prompt.md & spec.md
 */

class LapAgentEngine {
  constructor(config = {}) {
    this.config = {
      companyName: config.companyName || "Home Credit",
      customerName: config.customerName || "Rahul Sharma",
      agentName: config.agentName || "Priya",
      agentGender: config.agentGender || "female",
      language: config.language || "English",
      ragContext: config.ragContext || "Home Credit LAP offer: up to ₹75 lakh, tenure 3–15 years. No rate details available.",
      ...config
    };
    this.reset();
  }

  reset() {
    this.state = {
      callStatus: "IDLE", // IDLE, IN_CALL, BUSY_CALLBACK, TRANSFER_FLOW, LIMIT_FLOW, DISQUALIFIED, QUALIFIED_HANDOFF, ENDED
      step: "GREETING",
      previousStep: null,
      pendingQuestion: null,

      // 7 Eligibility Data Points
      property_type: null,        // 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural'
      ownership: null,            // 'Sole' | 'Joint'
      documents_available: null,  // true | false
      loan_amount: null,          // number (in INR)
      occupation: null,           // 'Salaried' | 'Self-employed'
      income_mode: null,          // 'Bank' | 'Cash'
      market_value: null,         // number (in INR)
      tenure: null,               // number (in years, 3..15 eligible)

      // Flags
      existing_loan: false,
      disqualified: false,
      disqualificationReason: null,
      transfer_required: false,
      transferReason: null,
      limit_flow_active: false,
      requested_excess_amount: null,
      callback_time: null,

      // History
      history: []
    };
  }

  getBeginMessage() {
    this.state.callStatus = "IN_CALL";
    this.state.step = "GREETING";
    if (this.config.language === "Hindi") {
      return `नमस्ते, क्या मेरी बात ${this.config.customerName} जी से हो रही है?`;
    }
    return `Hello, am I speaking with ${this.config.customerName}?`;
  }

  // Comprehensive Indian currency parsing (digits, words, Lakhs, Crores, Hindi Devanagari)
  parseIndianAmount(text) {
    if (!text) return null;
    // Strip commas, currency symbols, and trailing dots for digit matching (e.g. 75,00,000. -> 7500000)
    const cleanText = text.replace(/[₹$,]/g, "");
    const lower = cleanText.toLowerCase();

    // Check for crore
    const crMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores|करोड़)/);
    if (crMatch) {
      return Math.round(parseFloat(crMatch[1]) * 10000000);
    }

    // Check for lakh with digits (e.g. 50L, 75 lakh, 1.2 lakh, 75lac)
    const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|lakh|lakhs|lac|lacs|लाख)/);
    if (lakhMatch) {
      return Math.round(parseFloat(lakhMatch[1]) * 100000);
    }

    // Words & Hindi Devanagari amounts
    const amountMap = [
      { pattern: /two\s*crore|do\s*crore|दो\s*करोड़/i, val: 20000000 },
      { pattern: /one\s*(?:point\s*two|\.2)\s*crore|1\.2\s*cr/i, val: 12000000 },
      { pattern: /one\s*crore|ek\s*crore|एक\s*करोड़/i, val: 10000000 },
      { pattern: /ninety\s*lakh|nabbe\s*lakh|नब्बे\s*लाख/i, val: 9000000 },
      { pattern: /eighty\s*lakh|assi\s*lakh|अस्सी\s*लाख/i, val: 8000000 },
      { pattern: /seventy[- ]five\s*lakh|pichhattar\s*lakh|पिचहत्तर\s*लाख/i, val: 7500000 },
      { pattern: /seventy\s*lakh|sattar\s*lakh|सत्तर\s*लाख/i, val: 7000000 },
      { pattern: /sixty\s*lakh|saath\s*lakh|साठ\s*लाख/i, val: 6000000 },
      { pattern: /fifty\s*lakh|pachaas\s*lakh|पचास\s*लाख/i, val: 5000000 },
      { pattern: /forty[- ]five\s*lakh|paintalis\s*lakh|पैंतालीस\s*लाख/i, val: 4500000 },
      { pattern: /forty\s*lakh|chaalis\s*lakh|चालीस\s*लाख/i, val: 4000000 },
      { pattern: /thirty[- ]five\s*lakh|paintis\s*lakh|पैंतीस\s*लाख/i, val: 3500000 },
      { pattern: /thirty\s*lakh|tees\s*lakh|तीस\s*लाख/i, val: 3000000 },
      { pattern: /twenty[- ]five\s*lakh|pachees\s*lakh|पच्चीस\s*लाख/i, val: 2500000 },
      { pattern: /twenty\s*lakh|bees\s*lakh|बीस\s*लाख/i, val: 2000000 },
      { pattern: /fifteen\s*lakh|pandrah\s*lakh|पंद्रह\s*लाख/i, val: 1500000 },
      { pattern: /ten\s*lakh|das\s*lakh|दस\s*लाख/i, val: 1000000 }
    ];

    for (const item of amountMap) {
      if (item.pattern.test(lower)) return item.val;
    }

    // Plain digits (e.g. 5000000, 7500000, 2500000)
    const rawNumber = lower.match(/\b\d{5,8}\b/);
    if (rawNumber) return parseInt(rawNumber[0], 10);

    // If pending question is loan_amount or market_value and the user gave short digits:
    // e.g. "75" -> 75,00,000, "25" -> 25,00,000, "50" -> 50,00,000
    if (this.state.pendingQuestion === "loan_amount" || this.state.pendingQuestion === "market_value") {
      const shortMatch = lower.match(/\b(\d{1,2})\b/);
      if (shortMatch) {
        const val = parseInt(shortMatch[1], 10);
        if (val >= 5 && val <= 75) return val * 100000;
        if (val === 1 || val === 2) return val * 10000000; // 1 cr or 2 cr
      }
    }

    return null;
  }

  // Tenure parsing in years
  parseTenure(text) {
    const lower = text.toLowerCase();

    // Check self-correction pattern: "X ... actually Y"
    const corrMatch = lower.match(/(?:actually|make it|changed to|no)\s+(\d+)\s*(?:years?|yrs?|साल)?/i);
    if (corrMatch) return parseInt(corrMatch[1], 10);

    // Self correction words: e.g. "actually twelve"
    if (/(?:actually|make it)\s+(?:twelve|12)/i.test(lower)) return 12;
    if (/(?:actually|make it)\s+(?:ten|10)/i.test(lower)) return 10;
    if (/(?:actually|make it)\s+(?:fifteen|15)/i.test(lower)) return 15;

    // Check months (e.g. 36 months = 3 yrs)
    const monthMatch = lower.match(/(\d+)\s*(?:months?|mahine|महीने)/i);
    if (monthMatch) return Math.round(parseInt(monthMatch[1], 10) / 12);

    // Number word mappings
    const tenureWords = [
      { pattern: /\btwenty\b|\b20\b|\bbees\b|बीस/i, val: 20 },
      { pattern: /\bfifteen\b|\b15\b|\bpandrah\b|पंद्रह/i, val: 15 },
      { pattern: /\btwelve\b|\b12\b|\bbaarah\b|बारह/i, val: 12 },
      { pattern: /\bten\b|\b10\b|\bdas\b|दस/i, val: 10 },
      { pattern: /\beight\b|\b8\b|\baath\b|आठ/i, val: 8 },
      { pattern: /\bseven\b|\b7\b|\bsaat\b|सात/i, val: 7 },
      { pattern: /\bfive\b|\b5\b|\bpaanch\b|पाँच/i, val: 5 },
      { pattern: /\bthree\b|\b3\b|\bteen\b|तीन/i, val: 3 },
      { pattern: /\btwo\b|\b2\b|\bdo\b|दो/i, val: 2 },
      { pattern: /\bone\b|\b1\b|\bek\b|एक/i, val: 1 }
    ];

    for (const tw of tenureWords) {
      if (tw.pattern.test(lower)) return tw.val;
    }

    const numMatch = lower.match(/\b(\d+)\s*(?:years?|yrs?|साल)?\b/);
    if (numMatch) return parseInt(numMatch[1], 10);

    return null;
  }

  // Multi-slot extraction engine
  extractFacts(utterance) {
    const text = utterance.toLowerCase();
    const extracted = {};

    // 1. Property Type
    if (text.includes("agricultural") || text.includes("agriculture") || text.includes("farmland") || text.includes("kheti") || text.includes("कृषि") || text.includes("खेती") || text.includes("खेत")) {
      extracted.property_type = "Agricultural";
    } else if (text.includes("residential") || text.includes("house") || text.includes("flat") || text.includes("apartment") || text.includes("ghar") || text.includes("मकान") || text.includes("घर") || text.includes("रिहायशी") || text.includes("रेजिडेंशियल") || text.includes("आवासीय")) {
      extracted.property_type = "Residential";
    } else if (text.includes("commercial") || text.includes("shop") || text.includes("office") || text.includes("dukan") || text.includes("दुकान") || text.includes("व्यावसायिक") || text.includes("कमर्शियल")) {
      extracted.property_type = "Commercial";
    } else if (text.includes("industrial") || text.includes("factory") || text.includes("godown") || text.includes("warehouse") || text.includes("औद्योगिक") || text.includes("इंडस्ट्रियल") || text.includes("कारखाना")) {
      extracted.property_type = "Industrial";
    }

    // 2. Ownership
    if (text.includes("joint") || text.includes("jointly") || text.includes("wife") || text.includes("brother") || text.includes("partner") || text.includes("father") || text.includes("family") || text.includes("जॉइंट") || text.includes("साझा") || text.includes("पत्नी") || text.includes("भाई")) {
      extracted.ownership = "Joint";
    } else if (text.includes("sole") || text.includes("only mine") || text.includes("own name") || text.includes("single owner") || text.includes("my own") || text.includes("own house") || text.includes("own flat") || text.includes("अकेला") || text.includes("मेरे नाम") || text.includes("खुद का") || text.includes("सिर्फ मेरा") || text.includes("मेरा ही") || (this.state.pendingQuestion === "ownership" && (text.includes("mine") || text.includes("only me") || text.includes("single")))) {
      extracted.ownership = "Sole";
    }

    // 3. Original documents
    if (text.includes("only photocopies") || text.includes("only photocopy") || text.includes("photocopies") || text.includes("xerox") || text.includes("lost") || text.includes("don't have originals") || text.includes("no originals") || text.includes("not available") || text.includes("फोटोकॉपी")) {
      extracted.documents_available = false;
    } else if (text.includes("original") || text.includes("originals") || text.includes("at home") || text.includes("in locker") || text.includes("safe") || text.includes("produce") || text.includes("registry") || text.includes("ओरिजिनल") || text.includes("असली") || text.includes("कागज़") || text.includes("दस्तावेज") || text.includes("घर पर हैं") || (this.state.pendingQuestion === "documents_available" && (text.includes("yes") || text.includes("available") || text.includes("ready") || text.includes("have") || text.includes("हाँ") || text.includes("हैं")))) {
      extracted.documents_available = true;
    }

    // 4. Occupation
    if (text.includes("salaried") || text.includes("software") || text.includes("job") || text.includes("service") || text.includes("employee") || text.includes("नौकरी") || text.includes("जॉब") || text.includes("सैलरीड") || text.includes("सैलरी")) {
      extracted.occupation = "Salaried";
    } else if (text.includes("self-employed") || text.includes("self employed") || text.includes("business") || text.includes("shopkeeper") || text.includes("consultant") || text.includes("खुद का") || text.includes("दुकानदार") || text.includes("बिजनेस") || text.includes("व्यापार") || text.includes("धंधा") || text.includes("सेल्फ एम्प्लॉयड")) {
      extracted.occupation = "Self-employed";
    }

    // 5. Income mode
    if (text.includes("cash") || text.includes("नकद") || text.includes("कैश") || text.includes("नगद")) {
      extracted.income_mode = "Cash";
    } else if (text.includes("bank") || text.includes("account") || text.includes("credited") || text.includes("transfer") || text.includes("खाते में") || text.includes("बैंक") || text.includes("अकाउंट") || text.includes("खाता")) {
      extracted.income_mode = "Bank";
    }

    // 6. Tenure
    const tenureVal = this.parseTenure(utterance);
    if (tenureVal !== null) {
      if (text.includes("year") || text.includes("yr") || text.includes("month") || text.includes("साल") || text.includes("tenure") || this.state.pendingQuestion === "tenure") {
        extracted.tenure = tenureVal;
      }
    }

    // 7. Amounts (Market Value vs Loan Amount)
    const amountVal = this.parseIndianAmount(utterance);
    if (amountVal !== null) {
      if (text.includes("worth") || text.includes("value") || text.includes("market") || text.includes("मूल्य") || this.state.pendingQuestion === "market_value") {
        extracted.market_value = amountVal;
      } else if (text.includes("need") || text.includes("looking for") || text.includes("loan amount") || text.includes("loan of") || this.state.pendingQuestion === "loan_amount") {
        extracted.loan_amount = amountVal;
      } else {
        if (this.state.loan_amount === null && amountVal <= 10000000) {
          extracted.loan_amount = amountVal;
        } else if (this.state.market_value === null && amountVal >= 5000000) {
          extracted.market_value = amountVal;
        }
      }
    }

    return extracted;
  }

  processUtterance(utterance) {
    const rawText = utterance.trim();
    const text = rawText.toLowerCase();
    this.state.history.push({ speaker: "customer", text: rawText, timestamp: new Date() });

    // ------------------------------------------------------------------------
    // A. TRANSFER FLOW TRIGGER (CAN TRIGGER AT ANY POINT)
    // ------------------------------------------------------------------------
    const hasNegation = (
      text.includes("no existing loan") ||
      text.includes("no running loan") ||
      text.includes("no loan") ||
      text.includes("without any loan") ||
      text.includes("कोई लोन नहीं") ||
      text.includes("नया लोन")
    );

    const isLoanTransferIntent = !hasNegation && (
      text.includes("already have a loan") ||
      text.includes("already have an active loan") ||
      text.includes("existing loan") ||
      text.includes("running on the property") ||
      text.includes("running on this house") ||
      text.includes("reduce my emi") ||
      text.includes("lower emi") ||
      text.includes("balance transfer") ||
      text.includes("loan transfer") ||
      text.includes("transfer my loan") ||
      text.includes("transfer loan") ||
      text.includes("loan on it") ||
      text.includes("पहले से लोन") ||
      text.includes("ईएमआई कम")
    );

    if (isLoanTransferIntent) {
      this.state.existing_loan = true;
      this.state.transfer_required = true;
      this.state.callStatus = "TRANSFER_FLOW";
      this.state.step = "ENDED";
      const reply = this.config.language === "Hindi"
        ? `यह जानकारी साझा करने के लिए धन्यवाद। चूंकि संपत्ति पर पहले से लोन है, इसलिए हमारे लोन ट्रांसफर स्पेशलिस्ट इस बारे में सहायता के लिए आपसे जल्द ही संपर्क करेंगे। आपके समय के लिए धन्यवाद।`
        : `Thank you for sharing that. Since there's an existing loan, a loan transfer specialist will contact you shortly to help. Thank you for your time.`;
      return this.respond(reply, true);
    }

    // ------------------------------------------------------------------------
    // B. LIMIT FLOW ACTIVE DECISION (Borrower asked > ₹75L)
    // ------------------------------------------------------------------------
    if (this.state.limit_flow_active) {
      if (text.includes("yes") || text.includes("sure") || text.includes("work for me") || text.includes("okay") || text.includes("fine") || text.includes("proceed") || text.includes("हाँ") || text.includes("चलेगा")) {
        this.state.limit_flow_active = false;
        this.state.loan_amount = 7500000; // Proceed with ₹75L cap
        return this.askNextQuestion("Understood, proceeding with seventy-five lakh rupees.");
      } else if (text.includes("no") || text.includes("not interested") || text.includes("too less") || text.includes("nahi") || text.includes("नहीं")) {
        this.state.limit_flow_active = false;
        this.state.callStatus = "ENDED";
        const reply = this.config.language === "Hindi"
          ? `मैं समझ सकती हूँ। आपके समय के लिए बहुत-बहुत धन्यवाद, और ${this.config.companyName} का सम्मानित ग्राहक बनने के लिए शुक्रिया। आपका दिन शुभ हो!`
          : `I understand. Thank you so much for your time, and thank you for being a valued customer of ${this.config.companyName}. Have a wonderful day!`;
        return this.respond(reply, true);
      } else {
        const reply = this.config.language === "Hindi"
          ? `यह ऑफर अधिकतम पिचहत्तर लाख रुपये तक उपलब्ध है। क्या आप पिचहत्तर लाख के साथ आगे बढ़ना चाहेंगे? कृपया हाँ या ना में बताएं।`
          : `This offer is available for up to seventy-five lakh rupees. Would you like to proceed with the maximum amount of seventy-five lakh? Please let me know yes or no.`;
        return this.respond(reply);
      }
    }

    // ------------------------------------------------------------------------
    // C. STEP: CAPTURE CALLBACK TIME (IF CURRENTLY WAITING FOR TIME)
    // ------------------------------------------------------------------------
    if (this.state.step === "CAPTURE_CALLBACK") {
      this.state.callback_time = rawText;
      this.state.callStatus = "ENDED";
      const reply = this.config.language === "Hindi"
        ? `समझा, हम दिए गए समय पर आपको दोबारा कॉल करेंगे। समय देने के लिए धन्यवाद ${this.config.customerName} जी, आपका दिन शुभ हो!`
        : `Understood, we have noted your callback preference. Thank you for your time, ${this.config.customerName}, and have a wonderful day!`;
      return this.respond(reply, true);
    }

    // ------------------------------------------------------------------------
    // D. GLOBAL BUSY / RESCHEDULE TRIGGER (CAN TRIGGER AT ANY POINT)
    // ------------------------------------------------------------------------
    const isBusyIntent = (
      text.includes("meeting") ||
      text.includes("busy") ||
      text.includes("driving") ||
      text.includes("call later") ||
      text.includes("call me later") ||
      text.includes("call back") ||
      text.includes("can't talk") ||
      text.includes("cant talk") ||
      text.includes("not a good time") ||
      text.includes("not free") ||
      text.includes("व्यस्त") ||
      text.includes("बीज़ी") ||
      text.includes("बिज़ी") ||
      text.includes("बिजी") ||
      text.includes("बीजी") ||
      text.includes("बाद में कॉल") ||
      text.includes("बाद में बात") ||
      text.includes("बाद में") ||
      text.includes("समय नहीं") ||
      text.includes("टाइम नहीं") ||
      text.includes("फ्री नहीं")
    );

    if (isBusyIntent) {
      this.state.step = "CAPTURE_CALLBACK";
      this.state.callStatus = "BUSY_CALLBACK";
      const reply = this.config.language === "Hindi"
        ? `बिल्कुल, मैं समझ सकती हूँ। आपको दोबारा कॉल करने का कौन सा समय सुविधाजनक रहेगा?`
        : `Certainly, I understand. What would be a convenient time for us to call you back?`;
      return this.respond(reply);
    }

    // ------------------------------------------------------------------------
    // E. STEP 1: GREETING + VERIFY
    // ------------------------------------------------------------------------
    if (this.state.step === "GREETING") {
      if (text.includes("who is this") || text.includes("who's calling") || text.includes("why are you calling") || text.includes("कौन बोल रहा")) {
        const reply = this.config.language === "Hindi"
          ? `मैं ${this.config.companyName} से ${this.config.agentName} बात कर रही हूँ। क्या मेरी बात ${this.config.customerName} जी से हो रही है?`
          : `I am ${this.config.agentName} calling from ${this.config.companyName} for ${this.config.customerName} regarding an exclusive offer for our valued customers. May I confirm if I'm speaking with ${this.config.customerName}?`;
        return this.respond(reply);
      }
      if (text.includes("wrong number") || text.includes("not available") || text.includes("not rahul") || text.includes("गलत नंबर")) {
        this.state.callStatus = "ENDED";
        const reply = this.config.language === "Hindi"
          ? `माफ़ कीजियेगा, धन्यवाद।`
          : `I apologize for the disturbance. Thank you and have a good day!`;
        return this.respond(reply, true);
      }

      // Customer identity confirmed -> Step 2: Availability
      this.state.step = "AVAILABILITY";
      const reply = this.config.language === "Hindi"
        ? `नमस्ते ${this.config.customerName} जी, मैं ${this.config.companyName} से ${this.config.agentName} बात कर रही हूँ। क्या आपसे दो मिनट बात करने का यह सही समय है?`
        : `Hi ${this.config.customerName}, I'm ${this.config.agentName} calling from ${this.config.companyName}. Is this a good time to talk for two minutes?`;
      return this.respond(reply);
    }

    // ------------------------------------------------------------------------
    // F. STEP 2: AVAILABILITY CONFIRMED
    // ------------------------------------------------------------------------
    if (this.state.step === "AVAILABILITY") {
      // Customer confirmed available -> Deliver Offer and Ask Fresh Loan Check
      this.state.step = "FRESH_CHECK";
      const reply = this.config.language === "Hindi"
        ? `हम आपको इसलिए कॉल कर रहे हैं क्योंकि हमारे सम्मानित ग्राहक होने के नाते आप पिचहत्तर लाख रुपये तक के प्री-एप्रूव्ड लोन अगेंस्ट प्रॉपर्टी ऑफर के पात्र हैं। बस यह कन्फर्म करना था, क्या यह नए लोन के लिए है या प्रॉपर्टी पर पहले से कोई लोन चल रहा है?`
        : `We're calling because, as one of our valued customers, you're eligible for a special Loan Against Property offer of up to seventy-five lakh rupees. Just to confirm, is this for a fresh loan, or do you already have a loan running on the property?`;
      return this.respond(reply);
    }

    // ------------------------------------------------------------------------
    // G. STEP 3 & 4: FRESH VS RUNNING LOAN CONFIRMATION
    // ------------------------------------------------------------------------
    if (this.state.step === "FRESH_CHECK") {
      this.state.step = "IN_ELIGIBILITY";
      // Proceed into slot filling and eligibility check below
    }

    // ------------------------------------------------------------------------
    // G. DIVERSIONS & INTERRUPTIONS
    // ------------------------------------------------------------------------
    if (text.includes("interest rate") || text.includes("what rate") || text.includes("roi") || text.includes("ब्याज दर")) {
      const diversionPrefix = this.config.language === "Hindi"
        ? `ब्याज दर की सटीक जानकारी प्रारंभिक जांच के बाद हमारे सीनियर लोन एक्सपर्ट द्वारा दी जाएगी।`
        : `The exact interest rate will be shared by our senior loan expert after this preliminary check.`;
      return this.askNextQuestion(diversionPrefix);
    }

    if (text.includes("what documents") || text.includes("which documents") || text.includes("कौन से कागज़") || text.includes("कौन से दस्तावेज")) {
      const diversionPrefix = this.config.language === "Hindi"
        ? `आमतौर पर रजिस्ट्री पेपर्स और टाइटल डीड्स की जांच की जाती है।`
        : `Usually title deeds, registry papers, and tax receipts are verified by our team.`;
      return this.askNextQuestion(diversionPrefix);
    }

    if (text.includes("am i eligible") || text.includes("eligible or not") || text.includes("check my eligibility") || text.includes("क्या मैं पात्र")) {
      const eligibilityPrefix = this.config.language === "Hindi"
        ? `मैं अभी आपकी पात्रता की ही जांच कर रही हूँ। बस कुछ और विवरण चाहिए—`
        : `I'm checking your eligibility right now. I just need a few more quick details to confirm—`;
      return this.askNextQuestion(eligibilityPrefix);
    }

    // ------------------------------------------------------------------------
    // H. EXTRACT FACTS ACROSS ALL SLOTS
    // ------------------------------------------------------------------------
    const facts = this.extractFacts(rawText);

    if (facts.property_type !== undefined) this.state.property_type = facts.property_type;
    if (facts.ownership !== undefined) this.state.ownership = facts.ownership;
    if (facts.documents_available !== undefined) this.state.documents_available = facts.documents_available;
    if (facts.loan_amount !== undefined) this.state.loan_amount = facts.loan_amount;
    if (facts.occupation !== undefined) this.state.occupation = facts.occupation;
    if (facts.income_mode !== undefined) this.state.income_mode = facts.income_mode;
    if (facts.market_value !== undefined) this.state.market_value = facts.market_value;
    if (facts.tenure !== undefined) this.state.tenure = facts.tenure;

    // ------------------------------------------------------------------------
    // I. DISQUALIFICATION CHECKS (FAIL FAST)
    // ------------------------------------------------------------------------
    // Item 1: Property Type (Agricultural)
    if (this.state.property_type === "Agricultural") {
      return this.triggerDisqualification("Agricultural property is not eligible.");
    }

    // Item 3: Original Documents
    if (this.state.documents_available === false) {
      return this.triggerDisqualification("Original property documents are required.");
    }

    // Item 5: Income Mode (Cash)
    if (this.state.income_mode === "Cash") {
      return this.triggerDisqualification("Income in cash is not eligible.");
    }

    // Item 7: Tenure (<3 or >15 yrs)
    if (this.state.tenure !== null && (this.state.tenure < 3 || this.state.tenure > 15)) {
      return this.triggerDisqualification(`Tenure of ${this.state.tenure} years is outside 3–15 years.`);
    }

    // Item 4: Loan amount > ₹75L -> LIMIT FLOW
    if (this.state.loan_amount !== null && this.state.loan_amount > 7500000) {
      this.state.limit_flow_active = true;
      this.state.requested_excess_amount = this.state.loan_amount;
      this.state.loan_amount = null; // Await confirmation
      const reply = this.config.language === "Hindi"
        ? `यह ऑफर अधिकतम पिचहत्तर लाख रुपये तक के लिए उपलब्ध है। क्या आप पिचहत्तर लाख की अधिकतम राशि के साथ आगे बढ़ना चाहेंगे?`
        : `This offer is available for up to seventy-five lakh rupees. Would you like to proceed with the maximum amount of seventy-five lakh?`;
      return this.respond(reply);
    }

    // ------------------------------------------------------------------------
    // J. CHECK IF ALL 7 ARE ANSWERED & PASS -> HANDOFF GATE
    // ------------------------------------------------------------------------
    if (this.isAllEligible()) {
      this.state.callStatus = "QUALIFIED_HANDOFF";
      this.state.step = "ENDED";
      const reply = this.config.language === "Hindi"
        ? `बहुत-बहुत धन्यवाद, ${this.config.customerName} जी। आपकी जानकारी के अनुसार आप आगे बढ़ने के पात्र हैं। हमारे सीनियर लोन एक्सपर्ट जल्द ही आपको कॉल करके ब्याज दर और आगे की प्रक्रिया बताएंगे। आपका दिन शुभ हो!`
        : `Thank you so much, ${this.config.customerName}. Based on what you've shared, you're eligible to move forward. A senior loan expert will call you back shortly to share the exact interest rate and the next steps. Have a great day!`;
      return this.respond(reply, true);
    }

    // ------------------------------------------------------------------------
    // K. ASK EARLIEST MISSING CHECKLIST ITEM
    // ------------------------------------------------------------------------
    return this.askNextQuestion();
  }

  isAllEligible() {
    return (
      (this.state.property_type === "Residential" || this.state.property_type === "Commercial" || this.state.property_type === "Industrial") &&
      (this.state.ownership === "Sole" || this.state.ownership === "Joint") &&
      this.state.documents_available === true &&
      this.state.loan_amount !== null && this.state.loan_amount <= 7500000 &&
      (this.state.occupation === "Salaried" || this.state.occupation === "Self-employed") &&
      this.state.income_mode === "Bank" &&
      this.state.market_value !== null &&
      this.state.tenure !== null && this.state.tenure >= 3 && this.state.tenure <= 15
    );
  }

  triggerDisqualification(reason) {
    this.state.disqualified = true;
    this.state.disqualificationReason = reason;
    this.state.callStatus = "DISQUALIFIED";
    this.state.step = "ENDED";
    const reply = this.config.language === "Hindi"
      ? `यह जानकारी साझा करने के लिए धन्यवाद। दुर्भाग्य से, आप इस समय इस विशेष ऑफर के मानदंडों को पूरा नहीं करते हैं। आपके समय के लिए धन्यवाद, और ${this.config.companyName} का सम्मानित ग्राहक बनने के लिए शुक्रिया।`
      : `Thank you for sharing that. Unfortunately, you don't meet the criteria for this specific offer at this time. I appreciate your time, and thank you for being a valued customer of ${this.config.companyName}.`;
    return this.respond(reply, true);
  }

  askNextQuestion(prefixMessage = "") {
    const isHindi = this.config.language === "Hindi";
    let ack = prefixMessage;

    // Pick earliest missing item
    if (this.state.property_type === null) {
      this.state.pendingQuestion = "property_type";
      const q = isHindi
        ? `${ack ? ack + " " : ""}यह किस प्रकार की संपत्ति है—रिहायशी, व्यावसायिक, या औद्योगिक?`
        : `${ack ? ack + " " : "Great. "}What type of property is it—residential, commercial, or industrial?`;
      return this.respond(q);
    }

    if (this.state.ownership === null) {
      this.state.pendingQuestion = "ownership";
      const q = isHindi
        ? `${ack ? ack + " " : ""}क्या आप इसके अकेले मालिक हैं या यह जॉइंट ओनरशिप में है?`
        : `${ack ? ack + " " : "Understood. "}Are you the sole owner of the property, or is it jointly owned?`;
      return this.respond(q);
    }

    if (this.state.documents_available === null) {
      this.state.pendingQuestion = "documents_available";
      const q = isHindi
        ? `${ack ? ack + " " : ""}क्या वेरिफिकेशन के लिए प्रॉपर्टी के मूल दस्तावेज यानी ओरिजिनल पेपर्स उपलब्ध हैं?`
        : `${ack ? ack + " " : "Got it. "}Do you have the original property documents available for verification?`;
      return this.respond(q);
    }

    if (this.state.loan_amount === null) {
      this.state.pendingQuestion = "loan_amount";
      const q = isHindi
        ? `${ack ? ack + " " : ""}आपको लगभग कितने लोन की आवश्यकता है?`
        : `${ack ? ack + " " : "Perfect. "}How much loan amount are you looking for?`;
      return this.respond(q);
    }

    if (this.state.occupation === null || this.state.income_mode === null) {
      this.state.pendingQuestion = "occupation_income";
      let q;
      if (this.state.occupation === null && this.state.income_mode === null) {
        q = isHindi
          ? `${ack ? ack + " " : ""}आप क्या काम करते हैं, और आपकी आय बैंक खाते में आती है या कैश में?`
          : `${ack ? ack + " " : "Understood. "}May I know your occupation, and whether your income is received in a bank account or cash?`;
      } else if (this.state.income_mode === null) {
        q = isHindi
          ? `${ack ? ack + " " : ""}और आपकी आय बैंक खाते में प्राप्त होती है या नकद में?`
          : `${ack ? ack + " " : "Understood. "}And is your income received in a bank account or in cash?`;
      } else {
        q = isHindi
          ? `${ack ? ack + " " : ""}और आप क्या काम करते हैं—नौकरी या खुद का व्यवसाय?`
          : `${ack ? ack + " " : "Understood. "}And may I know your occupation—salaried or self-employed?`;
      }
      return this.respond(q);
    }

    if (this.state.market_value === null) {
      this.state.pendingQuestion = "market_value";
      const q = isHindi
        ? `${ack ? ack + " " : ""}आपकी संपत्ति का वर्तमान अनुमानित बाजार मूल्य कितना होगा?`
        : `${ack ? ack + " " : "Thank you. "}What would be the approximate current market value of your property?`;
      return this.respond(q);
    }

    if (this.state.tenure === null) {
      this.state.pendingQuestion = "tenure";
      const q = isHindi
        ? `${ack ? ack + " " : ""}और तीन से पंद्रह साल के बीच आप कितने साल की पुनर्भुगतान अवधि रखना चाहेंगे?`
        : `${ack ? ack + " " : "Got it. "}And what repayment tenure are you considering, between three and fifteen years?`;
      return this.respond(q);
    }

    // All answered -> verify handoff
    if (this.isAllEligible()) {
      return this.processUtterance("");
    }
  }

  respond(text, shouldEndCall = false) {
    this.state.history.push({ speaker: "agent", text, shouldEndCall, timestamp: new Date() });
    return {
      agentUtterance: text,
      shouldEndCall,
      callStatus: this.state.callStatus,
      stateSnapshot: { ...this.state }
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = LapAgentEngine;
}
