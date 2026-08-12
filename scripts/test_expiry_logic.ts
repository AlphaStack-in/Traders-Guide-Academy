import { getNextExpiry, getValidExpiries, getPreviousTradingDay, isExchangeHoliday } from "../src/lib/expiry";

function runExpiryTests() {
  console.log("=== RUNNING OFFICIAL EXCHANGE EXPIRY CALENDAR TEST SUITE (v1.0.4) ===\n");

  // Reference Date: Wednesday, Aug 12, 2026 at 10:30 AM IST (05:00 UTC)
  const testDate = new Date("2026-08-12T05:00:00Z");

  // 1. NIFTY (Current NSE Specification: Tuesday Weekly Expiry)
  const niftyRes = getNextExpiry({ instrument: "NIFTY", referenceDate: testDate });
  console.log("1. Nifty Expiry:", niftyRes.expiryDate, `(${niftyRes.formattedExpiry})`);
  if (niftyRes.expiryDate !== "2026-08-18") {
    throw new Error(`Nifty Expiry Test Failed: Expected 2026-08-18 (Tuesday), got ${niftyRes.expiryDate}`);
  }
  console.log("✓ NIFTY Test PASS — Official Tuesday weekly index option expiry verified");

  // 1b. NIFTY Holiday Adjustment Test
  // Suppose Aug 25, 2026 is Id-e-Milad holiday: getPreviousTradingDay should return Mon Aug 24, 2026
  const holidayTue = new Date("2026-08-25T05:00:00Z");
  if (!isExchangeHoliday(holidayTue)) {
    throw new Error("Holiday test error: 2026-08-25 should be flagged as exchange holiday!");
  }
  const adjustedTue = getPreviousTradingDay(holidayTue);
  const adjustedTueStr = adjustedTue.toISOString().slice(0, 10);
  console.log("1b. Nifty Tuesday Holiday Adjustment (Aug 25 -> Aug 24):", adjustedTueStr);
  if (adjustedTueStr !== "2026-08-24") {
    throw new Error(`Nifty Holiday Test Failed: Expected 2026-08-24, got ${adjustedTueStr}`);
  }
  console.log("✓ NIFTY Holiday Test PASS — Holiday falling on Tuesday rolls back to Monday trading day");

  // 2. BANKNIFTY (NSE Specification: Discontinued Weekly, Monthly Last Thursday Only)
  const bankNiftyRes = getNextExpiry({ instrument: "BANK_NIFTY", referenceDate: testDate });
  console.log("2. Bank Nifty Expiry:", bankNiftyRes.expiryDate, `(${bankNiftyRes.formattedExpiry})`);
  if (bankNiftyRes.expiryDate !== "2026-08-27") {
    throw new Error(`Bank Nifty Expiry Test Failed: Expected monthly 2026-08-27, got ${bankNiftyRes.expiryDate}`);
  }
  if (bankNiftyRes.upcomingExpiries.some((e) => e.isWeekly)) {
    throw new Error("Bank Nifty Test Failed: Weekly expiries were generated for Bank Nifty!");
  }
  console.log("✓ BANKNIFTY Test PASS — Weekly expiries omitted; monthly last Thursday (2026-08-27) verified");

  // 3. MIDCPNIFTY (NSE Specification: Discontinued Weekly, Monthly Last Monday Only)
  const midcapRes = getNextExpiry({ instrument: "MIDCAP_NIFTY", referenceDate: testDate });
  console.log("3. Midcap Nifty Expiry:", midcapRes.expiryDate, `(${midcapRes.formattedExpiry})`);
  if (midcapRes.expiryDate !== "2026-08-31") {
    throw new Error(`Midcap Nifty Expiry Test Failed: Expected monthly 2026-08-31, got ${midcapRes.expiryDate}`);
  }
  if (midcapRes.upcomingExpiries.some((e) => e.isWeekly)) {
    throw new Error("Midcap Nifty Test Failed: Weekly expiries were generated for Midcap Nifty!");
  }
  console.log("✓ MIDCPNIFTY Test PASS — Weekly expiries omitted; monthly last Monday (2026-08-31) verified");

  // 4. SENSEX (BSE Specification: Friday Weekly Expiry)
  const sensexRes = getNextExpiry({ instrument: "SENSEX", referenceDate: testDate });
  console.log("4. Sensex Expiry:", sensexRes.expiryDate, `(${sensexRes.formattedExpiry})`);
  if (sensexRes.expiryDate !== "2026-08-14") {
    throw new Error(`Sensex Expiry Test Failed: Expected 2026-08-14 (Friday), got ${sensexRes.expiryDate}`);
  }
  console.log("✓ SENSEX Test PASS — Official Friday weekly index option expiry verified");

  // 5. INDIVIDUAL STOCKS (NSE Specification: Monthly Last Thursday)
  const stockResTCS = getNextExpiry({ instrument: "STOCK", stockSymbol: "TCS", referenceDate: testDate });
  const stockResRVNL = getNextExpiry({ instrument: "STOCK", stockSymbol: "RVNL", referenceDate: testDate });
  console.log("5. Stock Expiry (TCS & RVNL):", stockResTCS.expiryDate, `(${stockResTCS.formattedExpiry})`);
  if (stockResTCS.expiryDate !== "2026-08-27" || stockResRVNL.expiryDate !== "2026-08-27") {
    throw new Error(`Stock Expiry Test Failed: Expected 2026-08-27, got ${stockResTCS.expiryDate}`);
  }
  console.log("✓ STOCK Test PASS — Monthly last Thursday derivative contract expiry (2026-08-27) verified");

  // 6. Instrument Switching Sequence Test
  const seqNifty = getNextExpiry({ instrument: "NIFTY", referenceDate: testDate }).expiryDate;
  const seqBank = getNextExpiry({ instrument: "BANK_NIFTY", referenceDate: testDate }).expiryDate;
  const seqMidcap = getNextExpiry({ instrument: "MIDCAP_NIFTY", referenceDate: testDate }).expiryDate;
  const seqSensex = getNextExpiry({ instrument: "SENSEX", referenceDate: testDate }).expiryDate;
  const seqStock = getNextExpiry({ instrument: "STOCK", stockSymbol: "RELIANCE", referenceDate: testDate }).expiryDate;

  console.log("\n6. Instrument Switching Expiry Table:");
  console.log(`   NIFTY        -> ${seqNifty} (Tuesday Weekly)`);
  console.log(`   BANK_NIFTY   -> ${seqBank} (Monthly Thursday)`);
  console.log(`   MIDCAP_NIFTY -> ${seqMidcap} (Monthly Monday)`);
  console.log(`   SENSEX       -> ${seqSensex} (Friday Weekly)`);
  console.log(`   STOCK        -> ${seqStock} (Monthly Thursday)`);

  if (seqNifty === seqBank || seqBank === seqMidcap || seqMidcap === seqSensex) {
    throw new Error("Instrument switching failed to produce distinct valid expiries for categories!");
  }
  console.log("✓ Instrument Switching Test PASS — Dynamic recalculation produces correct contract expiries!");

  console.log("\n=== ALL OFFICIAL EXCHANGE EXPIRY TESTS PASSED ===\n");
}

runExpiryTests();
