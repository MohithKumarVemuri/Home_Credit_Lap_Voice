/**
 * Command-Line Scenario Test Runner
 * Runs all 21 test scenarios through the state engine and validates business logic assertions
 */

const LapAgentEngine = require("./state_engine.js");
const SCENARIOS = require("./scenarios_data.js");

console.log("================================================================================");
console.log("🧪 Home Credit LAP Voice Agent — Automated Test Runner");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

SCENARIOS.forEach(sc => {
  const engine = new LapAgentEngine({
    companyName: "Home Credit",
    customerName: "Rahul Sharma",
    agentName: "Priya",
    agentGender: "female",
    language: sc.language || "English"
  });

  // Begin message
  engine.getBeginMessage();

  // Process turns
  sc.turns.forEach(turn => {
    if (
      engine.state.callStatus !== "ENDED" &&
      engine.state.callStatus !== "DISQUALIFIED" &&
      engine.state.callStatus !== "TRANSFER_FLOW" &&
      engine.state.callStatus !== "QUALIFIED_HANDOFF"
    ) {
      engine.processUtterance(turn);
    }
  });

  const actualStatus = engine.state.callStatus;
  const isPass = actualStatus === sc.expectedOutcome || (sc.expectedOutcome === "ENDED" && (actualStatus === "ENDED" || actualStatus === "BUSY_CALLBACK"));

  const statusSymbol = isPass ? "✅ PASS" : "❌ FAIL";
  console.log(`[#${sc.id.padEnd(3)}] ${sc.title.padEnd(38)} | Expected: ${sc.expectedOutcome.padEnd(18)} | Actual: ${actualStatus.padEnd(18)} | ${statusSymbol}`);

  if (isPass) passed++; else failed++;
});

console.log("\n================================================================================");
console.log(`📊 Test Results: ${passed}/${SCENARIOS.length} Scenarios Passed (${Math.round((passed / SCENARIOS.length) * 100)}% Pass Rate)`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 All 21 scenarios passed successfully against system_prompt.md rules!");
  process.exit(0);
}
