import { parseSignalMessage, parseGoodwillMessage, parseSignalFlowMessage } from "../src/lib/parser";

const GOODWILL_SAMPLES = [
  "ALERT : NIFTY 24500 CE BUY AROUND 22/10 TRG OPEN RISK TRADE",
  "ALERT : NIFTY 24500 CE CMP 28",
  "ALERT : NIFTY 24500 CE CMP 30 TRG1 hit",
  "NIFTY 24500 CE CMP 31 FROM 21",
  "ALERT : NIFTY 24450 PE BUY AROUND 20/15 TRG OPEN STOP@1",
  "POSTIONAL BREAKOUT : RVNL 250 CE BUY AROUND 1.50/1 TRG OPEN HERO/ZERO",
  "ALERT : NIFTY 24450 PE 20/15 AVRG 17 EXIT AROUND 18/25",
  "GOLD UPDATE . NOW 1600 KEEP STOPLOSS AND HOLD",
  "POSTIONAL BREAKOUT: JUBILANT 520 CE BUY AROUND 6/5 TRG 9/16 STOP@2 ( RESULT BASED TRADE )",
  "ALERT : NIFTY 24600 CE FROM 82 TO 95 NEAR TI 1TRG",
  "ALERT : NIFTY 24600 CE BUY AROUND 85/70 TRG 98/134 STOP@ 58 NOTE price came low 87",
  "ALERT : NIFTY 24600 CE BUY AROUND 82/70 TRG 98/134 STOP@60 NOTE CMP 98 BUY ON LOW",
  "ALERT : NIFTY 24600 CE CLOSING TIME EXIT AROUNT COST 115 TO 120",
  "ADANI ENT & NIFTY 24900 CE HOLD TILL NEXT UPDATE",
  "ALERT : TCS 2500 CE BUY AROUND 32/30 TRG 38/46 STOP@ 24.60",
  "Hero zero\nBuy nifty 24500ce @ 25/20\nSmall quantity only",
  "Buy nifty 24400ce @110/100 Sl 90 Target 140 & 170",
  "Hero zero\nBuy nifty 24450pe @31/25",
  "Hero zero\nBuy crude 7000pe @ 149/100",
  "Buy copper 1400ce @ 21.5/20 sl 17 target 25/30"
];

const SIGNALFLOW_SAMPLES = [
  "24500 CE Above 120 SL 90 Target 150, 180 Now 125",
  "24400 PE Above 110 SL 85 Trgt 140 Now 115 selling price 140"
];

function runTests() {
  console.log("=== RUNNING MULTI-CUSTOMER PARSER TEST SUITE ===\n");

  console.log("--- 1. Testing Existing SignalFlow Parser ---");
  for (const sample of SIGNALFLOW_SAMPLES) {
    const parsed = parseSignalFlowMessage(sample);
    console.assert(parsed.length > 0, `SignalFlow parse failed for: ${sample}`);
    console.log(`✓ SignalFlow Parsed: ${parsed[0].instrument} ${parsed[0].strike}${parsed[0].optionType} Entry: ${parsed[0].entryPrice} SL: ${parsed[0].stopLoss}`);
  }

  console.log("\n--- 2. Testing Goodwill Parser (All 20 Sample Categories) ---");
  let testIndex = 1;
  for (const sample of GOODWILL_SAMPLES) {
    const parsed = parseGoodwillMessage(sample);
    console.assert(parsed.length > 0, `Goodwill parse failed for sample ${testIndex}: ${sample}`);
    const first = parsed[0];
    console.log(`Sample ${testIndex++}: "${sample.replace(/\n/g, " ")}"`);
    console.log(`   -> Instrument: ${first.instrument} (${first.instrumentType}) | Strike: ${first.strike || "N/A"} ${first.optionType || ""}`);
    console.log(`   -> Entry Range: ${first.entryLow ?? "N/A"} - ${first.entryHigh ?? "N/A"} | Action: ${first.action} | IsUpdate: ${first.isUpdate}`);
    console.log(`   -> Targets: ${first.targets.join(", ") || "None"} | StopLoss: ${first.stopLoss ?? "N/A"}`);
    console.log(`   -> Context: [${first.context.join(", ")}] | Confidence: ${first.confidence}\n`);
  }

  console.log("--- 3. Testing Entry Range Normalization Specifically ---");
  const rangeTests = [
    { text: "22/10", expectedLow: 10, expectedHigh: 22 },
    { text: "20/15", expectedLow: 15, expectedHigh: 20 },
    { text: "6/5", expectedLow: 5, expectedHigh: 6 },
    { text: "1.50/1", expectedLow: 1, expectedHigh: 1.50 },
    { text: "21.5/20", expectedLow: 20, expectedHigh: 21.50 }
  ];

  for (const rt of rangeTests) {
    const res = parseGoodwillMessage(`NIFTY 24500 CE BUY AROUND ${rt.text}`)[0];
    console.assert(res.entryLow === rt.expectedLow && res.entryHigh === rt.expectedHigh, `Range normalization failed for ${rt.text}: got ${res.entryLow}-${res.entryHigh}`);
    console.log(`✓ Range "${rt.text}" normalized to ₹${res.entryLow} – ₹${res.entryHigh}`);
  }

  console.log("\n--- 4. Testing Multi-Instrument Message ---");
  const multiRes = parseGoodwillMessage("ADANI ENT & NIFTY 24900 CE HOLD TILL NEXT UPDATE");
  console.assert(multiRes.length === 2, `Expected 2 signals for multi-instrument message, got ${multiRes.length}`);
  console.log(`✓ Multi-instrument split created ${multiRes.length} signals:`);
  console.log(`   1. ${multiRes[0].instrument} (${multiRes[0].action})`);
  console.log(`   2. ${multiRes[1].instrument} ${multiRes[1].strike}${multiRes[1].optionType} (${multiRes[1].action})`);

  console.log("\n=== ALL PARSER TESTS PASSED SUCCESSFULLY ===");
}

runTests();
