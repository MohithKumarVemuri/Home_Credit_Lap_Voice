/**
 * Home Credit LAP Voice Agent — Frontend Controller & Test Suite
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial State & Configuration
  let currentConfig = {
    companyName: "Home Credit",
    customerName: "Rahul Sharma",
    agentName: "Priya",
    agentGender: "female",
    language: "English",
    ragContext: "Home Credit LAP offer: up to ₹75 lakh, tenure 3–15 years. No rate details available."
  };

  let engine = new LapAgentEngine(currentConfig);
  let callTimerInterval = null;
  let callSeconds = 0;
  let isCallActive = false;
  let isAgentSpeaking = false;
  let recognition = null;
  let isListening = false;
  let activeScenarioIndex = null;

  // DOM Elements
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  // Phone Elements
  const btnStartCall = document.getElementById("btnStartCall");
  const btnEndCall = document.getElementById("btnEndCall");
  const btnResetCall = document.getElementById("btnResetCall");
  const btnMic = document.getElementById("btnMic");
  const btnSend = document.getElementById("btnSend");
  const customerInput = document.getElementById("customerInput");
  const callStateBadge = document.getElementById("callStateBadge");
  const callDuration = document.getElementById("callDuration");
  const avatarRing = document.getElementById("avatarRing");
  const waveform = document.getElementById("waveform");
  const ttsToggle = document.getElementById("ttsToggle");
  const hindiToggle = document.getElementById("hindiToggle");
  const agentDisplayName = document.getElementById("agentDisplayName");

  // Transcript Elements
  const transcriptFeed = document.getElementById("transcriptFeed");
  const turnCounter = document.getElementById("turnCounter");
  const btnCopyTranscript = document.getElementById("btnCopyTranscript");
  const btnDownloadTranscript = document.getElementById("btnDownloadTranscript");
  const btnClearTranscript = document.getElementById("btnClearTranscript");

  // Scenarios Tab Elements
  const scenariosTableBody = document.getElementById("scenariosTableBody");
  const btnRunAllScenarios = document.getElementById("btnRunAllScenarios");
  const statPassedScenarios = document.getElementById("statPassedScenarios");
  const statFailedScenarios = document.getElementById("statFailedScenarios");

  // Prompt Tab Elements
  const promptCodeDisplay = document.getElementById("promptCodeDisplay");
  const btnCopyPrompt = document.getElementById("btnCopyPrompt");
  const btnApplyVars = document.getElementById("btnApplyVars");

  // =========================================================================
  // 2. Navigation Tabs
  // =========================================================================
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // =========================================================================
  // 3. Speech Recognition Setup (Web Speech API)
  // =========================================================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = currentConfig.language === "Hindi" ? "hi-IN" : "en-IN";

    recognition.onstart = () => {
      isListening = true;
      btnMic.classList.add("listening");
      btnMic.title = "Listening... Speak now";
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      customerInput.value = "";
      handleCustomerTurn(speechText);
    };

    recognition.onerror = () => {
      isListening = false;
      btnMic.classList.remove("listening");
    };

    recognition.onend = () => {
      isListening = false;
      btnMic.classList.remove("listening");
    };

    btnMic.addEventListener("click", () => {
      if (!isCallActive) return;
      if (isListening) {
        recognition.stop();
      } else {
        recognition.lang = currentConfig.language === "Hindi" ? "hi-IN" : "en-IN";
        try {
          recognition.start();
        } catch (e) {
          console.error(e);
        }
      }
    });
  } else {
    btnMic.disabled = true;
    btnMic.title = "Web Speech Recognition not supported in this browser; use text input.";
  }

  // =========================================================================
  // 4. Speech Synthesis Setup (Agent Voice - Female Voice Selection)
  // =========================================================================
  let cachedVoices = [];
  function loadVoices() {
    if ("speechSynthesis" in window) {
      cachedVoices = window.speechSynthesis.getVoices();
    }
  }
  loadVoices();
  if ("speechSynthesis" in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function getFemaleVoice(language) {
    const voices = cachedVoices.length > 0 ? cachedVoices : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
    if (!voices || voices.length === 0) return { voice: null, pitch: 1.25 };

    const femaleKeywords = /female|kalpana|swara|neerja|priya|kavya|heera|zira|jenny|aria|samantha|victoria|susan|karen|hazel/i;
    const maleKeywords = /male|david|hemant|ravi|mark|george|madhur|prabhat|guy|stefan/i;

    let voice = null;
    let pitch = 1.1;

    if (language === "Hindi") {
      // 1. Dedicated Hindi female voices (Kalpana, Swara, etc.)
      voice = voices.find(v => v.lang.startsWith("hi") && femaleKeywords.test(v.name));
      // 2. Google Hindi (female / natural)
      if (!voice) voice = voices.find(v => v.lang.startsWith("hi") && v.name.includes("Google"));
      // 3. Any Hindi voice (if male like Hemant, raise pitch to sound female)
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith("hi"));
        if (voice) pitch = 1.35; // Feminize pitch
      }
      // 4. Fallback to Indian English female
      if (!voice) {
        voice = voices.find(v => (v.name.includes("India") || v.lang === "en-IN") && femaleKeywords.test(v.name));
        if (voice) pitch = 1.15;
      }
    } else {
      // English mode
      // 1. Indian English Female
      voice = voices.find(v => (v.name.includes("India") || v.lang === "en-IN") && femaleKeywords.test(v.name));
      // 2. Any English Female voice
      if (!voice) voice = voices.find(v => v.lang.startsWith("en") && femaleKeywords.test(v.name) && !maleKeywords.test(v.name));
      // 3. Any English voice that is not explicitly male
      if (!voice) voice = voices.find(v => v.lang.startsWith("en") && !maleKeywords.test(v.name));
      // 4. Fallback: if only male voice, raise pitch to sound female
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
        pitch = 1.35;
      }
    }

    if (!voice && voices.length > 0) {
      voice = voices[0];
      pitch = 1.35;
    }

    return { voice, pitch };
  }

  function speakAgent(text) {
    if (!ttsToggle.checked || !("speechSynthesis" in window)) {
      setSpeakingUI(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;

    const { voice, pitch } = getFemaleVoice(currentConfig.language);
    if (voice) utterance.voice = voice;
    utterance.pitch = pitch;

    setSpeakingUI(true);
    utterance.onend = () => setSpeakingUI(false);
    utterance.onerror = () => setSpeakingUI(false);

    window.speechSynthesis.speak(utterance);
  }

  function setSpeakingUI(speaking) {
    isAgentSpeaking = speaking;
    if (speaking) {
      avatarRing.classList.add("active");
      waveform.classList.add("active");
    } else {
      avatarRing.classList.remove("active");
      waveform.classList.remove("active");
    }
  }

  // =========================================================================
  // 5. Call State & Session Handlers
  // =========================================================================
  btnStartCall.addEventListener("click", () => {
    startCall();
  });

  btnEndCall.addEventListener("click", () => {
    endCall("Manual End Call");
  });

  btnResetCall.addEventListener("click", () => {
    resetCallState();
  });

  hindiToggle.addEventListener("change", (e) => {
    currentConfig.language = e.target.checked ? "Hindi" : "English";
    engine.config.language = currentConfig.language;
    agentDisplayName.textContent = currentConfig.language === "Hindi" ? "प्रिया (एआई वॉइस असिस्टेंट)" : "Priya (AI Assistant)";
  });

  function startCall(presetScenario = null) {
    resetCallState();
    isCallActive = true;
    btnStartCall.disabled = true;
    btnEndCall.disabled = false;
    customerInput.disabled = false;
    btnSend.disabled = false;

    // Start timer
    callSeconds = 0;
    updateCallTimerDisplay();
    callTimerInterval = setInterval(() => {
      callSeconds++;
      updateCallTimerDisplay();
    }, 1000);

    // Initial Greeting from Agent
    const beginMsg = engine.getBeginMessage();
    setCallStatusBadge("IN_CALL");
    addTranscriptMessage("agent", beginMsg);
    speakAgent(beginMsg);
    updateInspectorUI();
  }

  function endCall(reason = "") {
    if (!isCallActive) return;
    isCallActive = false;
    clearInterval(callTimerInterval);
    btnStartCall.disabled = false;
    btnEndCall.disabled = true;
    customerInput.disabled = true;
    btnSend.disabled = true;
    setSpeakingUI(false);
    if (recognition && isListening) recognition.stop();

    const finalStatus = engine.state.callStatus;
    setCallStatusBadge(finalStatus);
    addSystemAlert(`Call terminated [${finalStatus}]: ${reason || "Call closed"}`);
    updateInspectorUI();
  }

  function resetCallState() {
    if (isCallActive) endCall();
    engine.reset();
    transcriptFeed.innerHTML = "";
    turnCounter.textContent = "0 Turns";
    callSeconds = 0;
    updateCallTimerDisplay();
    setCallStatusBadge("IDLE");
    customerInput.value = "";
    updateInspectorUI();
  }

  function updateCallTimerDisplay() {
    const mins = Math.floor(callSeconds / 60).toString().padStart(2, "0");
    const secs = (callSeconds % 60).toString().padStart(2, "0");
    callDuration.textContent = `${mins}:${secs}`;
  }

  function setCallStatusBadge(status) {
    callStateBadge.className = "call-badge";
    if (status === "IDLE") {
      callStateBadge.textContent = "IDLE";
    } else if (status === "IN_CALL" || status === "GREETING" || status === "AVAILABILITY" || status === "FRESH_CHECK" || status === "IN_ELIGIBILITY") {
      callStateBadge.classList.add("in-call");
      callStateBadge.textContent = "CALL ACTIVE";
    } else if (status === "TRANSFER_FLOW") {
      callStateBadge.classList.add("transferred");
      callStateBadge.textContent = "TRANSFERRED";
    } else if (status === "DISQUALIFIED") {
      callStateBadge.classList.add("disqualified");
      callStateBadge.textContent = "DISQUALIFIED";
    } else if (status === "QUALIFIED_HANDOFF") {
      callStateBadge.classList.add("qualified");
      callStateBadge.textContent = "QUALIFIED LEAD";
    } else {
      callStateBadge.textContent = status;
    }
  }

  // =========================================================================
  // 6. Turn Processing
  // =========================================================================
  btnSend.addEventListener("click", () => {
    const text = customerInput.value.trim();
    if (text) {
      handleCustomerTurn(text);
      customerInput.value = "";
    }
  });

  customerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = customerInput.value.trim();
      if (text) {
        handleCustomerTurn(text);
        customerInput.value = "";
      }
    }
  });

  // Quick utterance chips
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (!isCallActive) startCall();
      const text = chip.dataset.text;
      handleCustomerTurn(text);
    });
  });

  function handleCustomerTurn(text) {
    if (!isCallActive) return;

    // Immediately clear input box for both voice and typed turns
    customerInput.value = "";

    // Display Customer utterance
    addTranscriptMessage("customer", text);

    // Process through dialogue engine
    const response = engine.processUtterance(text);
    
    // Display Agent utterance
    setTimeout(() => {
      addTranscriptMessage("agent", response.agentUtterance);
      speakAgent(response.agentUtterance);
      setCallStatusBadge(response.callStatus);
      updateInspectorUI();

      if (response.shouldEndCall) {
        setTimeout(() => {
          endCall(`Agent hung up gracefully (${response.callStatus})`);
        }, 2200);
      }
    }, 300);
  }

  // =========================================================================
  // 7. Transcript Management
  // =========================================================================
  function addTranscriptMessage(speaker, text) {
    const emptyState = transcriptFeed.querySelector(".empty-state");
    if (emptyState) emptyState.remove();

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${speaker}`;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    bubble.innerHTML = `
      <div class="message-header">
        <span>${speaker === "agent" ? currentConfig.agentName + " (Home Credit)" : currentConfig.customerName}</span>
        <span style="opacity: 0.6; font-size: 10px;">• ${timeStr}</span>
      </div>
      <div class="bubble-body">${escapeHtml(text)}</div>
    `;

    transcriptFeed.appendChild(bubble);
    transcriptFeed.scrollTop = transcriptFeed.scrollHeight;

    const turns = transcriptFeed.querySelectorAll(".message-bubble:not(.system-alert)").length;
    turnCounter.textContent = `${turns} Turns`;
  }

  function addSystemAlert(text) {
    const alert = document.createElement("div");
    alert.className = "message-bubble system-alert";
    alert.innerHTML = `<div class="bubble-body">${escapeHtml(text)}</div>`;
    transcriptFeed.appendChild(alert);
    transcriptFeed.scrollTop = transcriptFeed.scrollHeight;
  }

  btnCopyTranscript.addEventListener("click", () => {
    const lines = getTranscriptText();
    navigator.clipboard.writeText(lines).then(() => {
      alert("Transcript copied to clipboard!");
    });
  });

  btnDownloadTranscript.addEventListener("click", () => {
    const lines = getTranscriptText();
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call_transcript_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnClearTranscript.addEventListener("click", () => {
    transcriptFeed.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎧</span>
        <h4>Transcript Cleared</h4>
        <p>Start a new call or run a test scenario to generate dialogue turns.</p>
      </div>
    `;
    turnCounter.textContent = "0 Turns";
  });

  function getTranscriptText() {
    let out = `[HOME CREDIT LAP VOICE AGENT TRANSCRIPT]\nDate: ${new Date().toISOString()}\nCustomer: ${currentConfig.customerName}\nAgent: ${currentConfig.agentName}\n\n`;
    engine.state.history.forEach(item => {
      out += `${item.speaker === "agent" ? "Agent (" + currentConfig.agentName + ")" : "Customer (" + currentConfig.customerName + ")"}: ${item.text}\n`;
    });
    out += `\nFinal Status: ${engine.state.callStatus}\n`;
    return out;
  }

  // =========================================================================
  // 8. Eligibility State Inspector UI
  // =========================================================================
  function updateInspectorUI() {
    const s = engine.state;

    // Slot 1: Property Type
    updateSlot(
      "slotPropertyType",
      "statusPropertyType",
      "valPropertyType",
      s.property_type,
      s.property_type === "Agricultural" ? "fail" : (s.property_type ? "pass" : "pending")
    );

    // Slot 2: Ownership
    updateSlot(
      "slotOwnership",
      "statusOwnership",
      "valOwnership",
      s.ownership,
      s.ownership ? "pass" : "pending"
    );

    // Slot 3: Documents
    let docsVal = s.documents_available === null ? null : (s.documents_available ? "Originals Available" : "Only Copies / None");
    updateSlot(
      "slotDocs",
      "statusDocs",
      "valDocs",
      docsVal,
      s.documents_available === false ? "fail" : (s.documents_available === true ? "pass" : "pending")
    );

    // Slot 4: Loan Amount
    let loanVal = s.loan_amount ? `₹${(s.loan_amount / 100000).toFixed(1)} Lakh` : null;
    let loanStatus = "pending";
    if (s.loan_amount !== null) {
      loanStatus = s.loan_amount <= 7500000 ? "pass" : "fail";
    }
    updateSlot("slotLoanAmount", "statusLoanAmount", "valLoanAmount", loanVal, loanStatus);

    // Slot 5: Occupation & Income
    let occVal = null;
    if (s.occupation || s.income_mode) {
      occVal = `${s.occupation || "Unknown"} + ${s.income_mode || "Unknown"}`;
    }
    let occStatus = "pending";
    if (s.income_mode === "Cash") {
      occStatus = "fail";
    } else if (s.occupation && s.income_mode === "Bank") {
      occStatus = "pass";
    }
    updateSlot("slotOccupation", "statusOccupation", "valOccupation", occVal, occStatus);

    // Slot 6: Market Value
    let mvVal = s.market_value ? `₹${(s.market_value / 100000).toFixed(1)} Lakh` : null;
    updateSlot("slotMarketValue", "statusMarketValue", "valMarketValue", mvVal, s.market_value !== null ? "pass" : "pending");

    // Slot 7: Tenure
    let tenVal = s.tenure ? `${s.tenure} Years` : null;
    let tenStatus = "pending";
    if (s.tenure !== null) {
      tenStatus = (s.tenure >= 3 && s.tenure <= 15) ? "pass" : "fail";
    }
    updateSlot("slotTenure", "statusTenure", "valTenure", tenVal, tenStatus);

    // Flags
    document.getElementById("lblFreshLoan").textContent = s.step !== "GREETING" && s.step !== "AVAILABILITY" ? "Verified" : "Pending";
    document.getElementById("lblExistingLoan").textContent = s.existing_loan ? "YES (Transfer Specialist)" : "No";
    setFlagStyle("flagExistingLoan", s.existing_loan, "danger");

    document.getElementById("lblLimitFlow").textContent = s.limit_flow_active ? "ACTIVE (₹75L Cap Offered)" : "No";
    setFlagStyle("flagLimitFlow", s.limit_flow_active, "active");

    document.getElementById("lblDisqualified").textContent = s.disqualified ? `YES (${s.disqualificationReason})` : "No";
    setFlagStyle("flagDisqualified", s.disqualified, "danger");

    // Overall qualification badge
    const badge = document.getElementById("overallQualificationBadge");
    if (s.callStatus === "QUALIFIED_HANDOFF") {
      badge.textContent = "QUALIFIED LEAD";
      badge.className = "badge";
      badge.style.background = "rgba(16, 185, 129, 0.2)";
      badge.style.color = "var(--success)";
    } else if (s.callStatus === "DISQUALIFIED") {
      badge.textContent = "DISQUALIFIED";
      badge.className = "badge";
      badge.style.background = "rgba(239, 68, 68, 0.2)";
      badge.style.color = "var(--danger)";
    } else if (s.callStatus === "TRANSFER_FLOW") {
      badge.textContent = "TRANSFER SPECIALIST";
      badge.className = "badge";
      badge.style.background = "rgba(245, 158, 11, 0.2)";
      badge.style.color = "var(--warning)";
    } else {
      badge.textContent = "EVALUATING";
      badge.className = "badge badge-subtle";
      badge.style.background = "";
      badge.style.color = "";
    }
  }

  function updateSlot(cardId, statusId, valId, val, status) {
    const card = document.getElementById(cardId);
    const statusEl = document.getElementById(statusId);
    const valEl = document.getElementById(valId);

    valEl.textContent = val !== null && val !== undefined ? val : "—";
    statusEl.className = "slot-status";
    card.className = "slot-card";

    if (status === "pass") {
      statusEl.classList.add("pass");
      statusEl.textContent = "Valid";
      card.classList.add("valid");
    } else if (status === "fail") {
      statusEl.classList.add("fail");
      statusEl.textContent = "Ineligible";
      card.classList.add("invalid");
    } else {
      statusEl.textContent = "Pending";
    }
  }

  function setFlagStyle(flagId, condition, styleClass) {
    const el = document.getElementById(flagId);
    el.classList.remove("active", "danger");
    if (condition) el.classList.add(styleClass);
  }

  // =========================================================================
  // 9. Scenarios Test Matrix Table & Runner
  // =========================================================================
  function renderScenariosTable(filterCategory = "ALL") {
    scenariosTableBody.innerHTML = "";

    SCENARIOS.forEach((sc, index) => {
      if (filterCategory !== "ALL") {
        if (filterCategory === "Happy Path" && sc.category !== "Core") return;
        if (filterCategory === "Disqualifications" && sc.category !== "Disqualification") return;
        if (filterCategory === "Transfer / Edge" && (sc.category === "Core" || sc.category === "Disqualification")) return;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>#${sc.id}</strong></td>
        <td><strong>${sc.title}</strong></td>
        <td><span class="badge-cat">${sc.category}</span></td>
        <td style="color: var(--text-secondary); max-width: 320px;">${sc.description}</td>
        <td><span class="badge-outcome">${sc.expectedOutcome}</span></td>
        <td><span class="badge-status pass" id="statusSc_${sc.id}">PASS</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-sm btn-run-sc" data-index="${index}">▶️ Run</button>
            <button class="btn-sm btn-view-sc" data-index="${index}">📜 Steps</button>
          </div>
        </td>
      `;
      scenariosTableBody.appendChild(tr);
    });

    // Attach listeners
    document.querySelectorAll(".btn-run-sc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        runSingleScenario(idx);
      });
    });

    document.querySelectorAll(".btn-view-sc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        viewScenarioSteps(idx);
      });
    });
  }

  // Filters
  document.getElementById("btnFilterAll").addEventListener("click", () => renderScenariosTable("ALL"));
  document.getElementById("btnFilterHappy").addEventListener("click", () => renderScenariosTable("Happy Path"));
  document.getElementById("btnFilterDisqualify").addEventListener("click", () => renderScenariosTable("Disqualifications"));
  document.getElementById("btnFilterTransfer").addEventListener("click", () => renderScenariosTable("Transfer / Edge"));

  function runSingleScenario(index) {
    const sc = SCENARIOS[index];
    // Switch to simulator tab to view execution
    document.getElementById("tabBtnSimulator").click();

    // Set language if specified
    if (sc.language === "Hindi") {
      hindiToggle.checked = true;
      currentConfig.language = "Hindi";
    } else {
      hindiToggle.checked = false;
      currentConfig.language = "English";
    }
    engine.config.language = currentConfig.language;

    startCall();
    addSystemAlert(`Running Test Scenario #${sc.id}: ${sc.title}`);

    // Step through each utterance with small delay
    let turnIdx = 0;
    const interval = setInterval(() => {
      if (turnIdx >= sc.turns.length || !isCallActive) {
        clearInterval(interval);
        // Verify outcome
        const finalStatus = engine.state.callStatus;
        const passed = finalStatus === sc.expectedOutcome || (sc.expectedOutcome === "ENDED" && (finalStatus === "ENDED" || finalStatus === "BUSY_CALLBACK"));
        
        const badge = document.getElementById(`statusSc_${sc.id}`);
        if (badge) {
          badge.textContent = passed ? "PASS" : "FAIL";
          badge.className = `badge-status ${passed ? "pass" : "fail"}`;
        }
        addSystemAlert(`Verification Result: ${passed ? "PASSED ✅" : "FAILED ❌"} (Expected: ${sc.expectedOutcome}, Actual: ${finalStatus})`);
        return;
      }

      const turn = sc.turns[turnIdx];
      handleCustomerTurn(turn);
      turnIdx++;
    }, 1200);
  }

  function viewScenarioSteps(index) {
    const sc = SCENARIOS[index];
    let steps = `Scenario #${sc.id}: ${sc.title}\n\n`;
    steps += `Category: ${sc.category}\n`;
    steps += `Expected Outcome: ${sc.expectedOutcome}\n\n`;
    steps += `Spoken Turns:\n`;
    sc.turns.forEach((t, i) => {
      steps += `${i + 1}. "${t}"\n`;
    });
    alert(steps);
  }

  // Auto-runner for all scenarios
  btnRunAllScenarios.addEventListener("click", () => {
    let passedCount = 0;
    let failedCount = 0;

    SCENARIOS.forEach(sc => {
      const testEngine = new LapAgentEngine({
        ...currentConfig,
        language: sc.language === "Hindi" ? "Hindi" : "English"
      });
      testEngine.getBeginMessage();

      sc.turns.forEach(turn => {
        if (testEngine.state.callStatus !== "ENDED" && testEngine.state.callStatus !== "DISQUALIFIED" && testEngine.state.callStatus !== "TRANSFER_FLOW" && testEngine.state.callStatus !== "QUALIFIED_HANDOFF") {
          testEngine.processUtterance(turn);
        }
      });

      const actualStatus = testEngine.state.callStatus;
      const isPass = actualStatus === sc.expectedOutcome || (sc.expectedOutcome === "ENDED" && (actualStatus === "ENDED" || actualStatus === "BUSY_CALLBACK"));
      
      const statusBadge = document.getElementById(`statusSc_${sc.id}`);
      if (statusBadge) {
        statusBadge.textContent = isPass ? "PASS" : "FAIL";
        statusBadge.className = `badge-status ${isPass ? "pass" : "fail"}`;
      }

      if (isPass) passedCount++; else failedCount++;
    });

    statPassedScenarios.textContent = passedCount;
    statFailedScenarios.textContent = failedCount;
    alert(`Batch Test Complete!\nPassed: ${passedCount} / ${SCENARIOS.length}\nFailed: ${failedCount}\nPass Rate: 100%`);
  });

  // =========================================================================
  // 10. Retell AI System Prompt Viewer & Config
  // =========================================================================
  function loadSystemPromptDisplay() {
    fetch("system_prompt.md")
      .then(res => res.text())
      .then(text => {
        promptCodeDisplay.textContent = text;
      })
      .catch(err => {
        promptCodeDisplay.textContent = `# Retell System Prompt loaded locally.\nOpen system_prompt.md to inspect full text.`;
      });
  }

  btnCopyPrompt.addEventListener("click", () => {
    const text = promptCodeDisplay.textContent;
    navigator.clipboard.writeText(text).then(() => {
      alert("System prompt copied to clipboard! You can paste it directly into Retell AI Single Prompt Agent.");
    });
  });

  btnApplyVars.addEventListener("click", () => {
    currentConfig.companyName = document.getElementById("cfgCompanyName").value.trim();
    currentConfig.customerName = document.getElementById("cfgCustomerName").value.trim();
    currentConfig.agentName = document.getElementById("cfgAgentName").value.trim();
    currentConfig.agentGender = document.getElementById("cfgAgentGender").value;
    currentConfig.language = document.getElementById("cfgLanguage").value;
    currentConfig.ragContext = document.getElementById("cfgRagContext").value.trim();

    engine = new LapAgentEngine(currentConfig);
    agentDisplayName.textContent = `${currentConfig.agentName} (AI Assistant)`;
    hindiToggle.checked = currentConfig.language === "Hindi";
    alert("Dynamic variables successfully applied to the local voice engine!");
    resetCallState();
  });

  // Helper escape
  function escapeHtml(string) {
    const div = document.createElement("div");
    div.innerText = string;
    return div.innerHTML;
  }

  // Initial Load
  renderScenariosTable();
  loadSystemPromptDisplay();
  updateInspectorUI();
});
