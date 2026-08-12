import { parseSignalMessage } from "../src/lib/parser";
import { resolveInstrument } from "../src/lib/instruments";

function runTests() {
  console.log("=== RUNNING INSTRUMENT DETECTION TEST SUITE ===");

  // 1. Explicit NIFTY with full signal
  const input1 = "NIFTY 24450 PE BUY ABOVE 15 SL 1 TARGETS 155,170";
  const res1 = parseSignalMessage(input1)[0];
  console.log("\nTest 1 (Explicit NIFTY signal):", input1);
  console.log("  Parsed Instrument:", res1.instrument);
  console.log("  Confidence:", res1.confidence);
  console.log("  Warnings:", res1.warnings);
  if (res1.instrument !== "NIFTY") throw new Error(`Test 1 Failed: Expected NIFTY, got ${res1.instrument}`);
  if (res1.confidence !== "HIGH") throw new Error(`Test 1 Failed: Expected HIGH confidence, got ${res1.confidence}`);
  if (res1.warnings.some((w: string) => w.includes("defaulted to Nifty"))) {
    throw new Error(`Test 1 Failed: Produced false warning: ${res1.warnings.join(", ")}`);
  }
  console.log("✓ Test 1 PASS — Explicit NIFTY parsed with HIGH confidence and 0 false warnings");

  // 2. Explicit NIFTY simple
  const input2 = "NIFTY 24500 CE BUY ABOVE 100 SL 80 TARGETS 150";
  const res2 = parseSignalMessage(input2)[0];
  if (res2.instrument !== "NIFTY") throw new Error(`Test 2 Failed: Expected NIFTY, got ${res2.instrument}`);
  console.log("✓ Test 2 PASS — Explicit NIFTY simple verified");

  // 3. Explicit SENSEX
  const input3 = "SENSEX 82000 CE BUY ABOVE 300 SL 200 TARGETS 500";
  const res3 = parseSignalMessage(input3)[0];
  if (res3.instrument !== "SENSEX") throw new Error(`Test 3 Failed: Expected SENSEX, got ${res3.instrument}`);
  console.log("✓ Test 3 PASS — Explicit SENSEX verified");

  // 4. Explicit SENSEX PE
  const input4 = "SENSEX 80000 PE BUY ABOVE 250 SL 150 TARGETS 400";
  const res4 = parseSignalMessage(input4)[0];
  if (res4.instrument !== "SENSEX") throw new Error(`Test 4 Failed: Expected SENSEX, got ${res4.instrument}`);
  console.log("✓ Test 4 PASS — Explicit SENSEX PE verified");

  // 5. Strike Range fallback (NIFTY range: 24450)
  const res5 = resolveInstrument("24450 PE", 24450);
  if (res5.instrument !== "NIFTY" || res5.detectedBy !== "STRIKE_RANGE") {
    throw new Error(`Test 5 Failed: Expected NIFTY via STRIKE_RANGE, got ${res5.instrument} (${res5.detectedBy})`);
  }
  console.log("✓ Test 5 PASS — Strike range detection (24450 -> NIFTY) verified");

  // 6. Strike Range fallback (SENSEX range: 82000)
  const res6 = resolveInstrument("82000 CE", 82000);
  if (res6.instrument !== "SENSEX" || res6.detectedBy !== "STRIKE_RANGE") {
    throw new Error(`Test 6 Failed: Expected SENSEX via STRIKE_RANGE, got ${res6.instrument} (${res6.detectedBy})`);
  }
  console.log("✓ Test 6 PASS — Strike range detection (82000 -> SENSEX) verified");

  // 7. Ambiguous message without explicit instrument and strike out of bounds
  const res7 = resolveInstrument("500 CE", 500);
  if (res7.detectedBy !== "UNRESOLVED") {
    throw new Error(`Test 7 Failed: Expected UNRESOLVED, got ${res7.detectedBy}`);
  }
  console.log("✓ Test 7 PASS — Ambiguous strike handling (500 CE -> UNRESOLVED, no silent default) verified");

  console.log("\n=== ALL INSTRUMENT DETECTION TESTS PASSED ===\n");
}

runTests();
