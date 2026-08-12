import { getNextExpiry } from "../src/lib/expiry";

function runExpiryTests() {
  console.log("=== RUNNING DYNAMIC EXPIRY & INSTRUMENT LOGIC TEST SUITE ===\n");

  // Wednesday, Aug 12, 2026 at 10:30 AM IST (05:00 UTC) — before 15:30 IST market cutoff
  const testDate = new Date("2026-08-12T05:00:00Z");

  // A. Nifty Expiry (Thursday)
  const niftyRes = getNextExpiry("NIFTY", testDate);
  console.log("A. Nifty Expiry:", niftyRes.expiryDate, `(${niftyRes.formattedExpiry})`);
  if (niftyRes.expiryDate !== "2026-08-13") {
    throw new Error(`Nifty Expiry Test Failed: Expected 2026-08-13, got ${niftyRes.expiryDate}`);
  }
  console.log("✓ Test A PASS — Nifty weekly Thursday expiry (2026-08-13) verified");

  // B. Sensex Expiry (Friday)
  const sensexRes = getNextExpiry("SENSEX", testDate);
  console.log("B. Sensex Expiry:", sensexRes.expiryDate, `(${sensexRes.formattedExpiry})`);
  if (sensexRes.expiryDate !== "2026-08-14") {
    throw new Error(`Sensex Expiry Test Failed: Expected 2026-08-14, got ${sensexRes.expiryDate}`);
  }
  console.log("✓ Test B PASS — Sensex weekly Friday expiry (2026-08-14) verified");

  // C. Bank Nifty Expiry (Wednesday before cutoff)
  const bankNiftyRes = getNextExpiry("BANK_NIFTY", testDate);
  console.log("C. Bank Nifty Expiry:", bankNiftyRes.expiryDate, `(${bankNiftyRes.formattedExpiry})`);
  if (bankNiftyRes.expiryDate !== "2026-08-12") {
    throw new Error(`Bank Nifty Expiry Test Failed: Expected 2026-08-12, got ${bankNiftyRes.expiryDate}`);
  }
  console.log("✓ Test C PASS — Bank Nifty weekly Wednesday expiry (2026-08-12) verified");

  // D. Midcap Nifty Expiry (Monday)
  const midcapRes = getNextExpiry("MIDCAP_NIFTY", testDate);
  console.log("D. Midcap Nifty Expiry:", midcapRes.expiryDate, `(${midcapRes.formattedExpiry})`);
  if (midcapRes.expiryDate !== "2026-08-17") {
    throw new Error(`Midcap Nifty Expiry Test Failed: Expected 2026-08-17, got ${midcapRes.expiryDate}`);
  }
  console.log("✓ Test D PASS — Midcap Nifty weekly Monday expiry (2026-08-17) verified");

  // E. Stock Expiry (Monthly Last Thursday: Aug 27, 2026)
  const stockRes = getNextExpiry("STOCK", testDate, "RVNL");
  console.log("E. Stock Expiry (RVNL):", stockRes.expiryDate, `(${stockRes.formattedExpiry})`);
  if (stockRes.expiryDate !== "2026-08-27") {
    throw new Error(`Stock Expiry Test Failed: Expected 2026-08-27, got ${stockRes.expiryDate}`);
  }
  console.log("✓ Test E PASS — Stock monthly last Thursday expiry (2026-08-27) verified");

  // F. Instrument Switching Dynamics
  const seqNifty = getNextExpiry("NIFTY", testDate).expiryDate;
  const seqSensex = getNextExpiry("SENSEX", testDate).expiryDate;
  const seqMidcap = getNextExpiry("MIDCAP_NIFTY", testDate).expiryDate;
  const seqStock = getNextExpiry("STOCK", testDate, "TCS").expiryDate;

  if (seqNifty === seqSensex || seqSensex === seqMidcap || seqMidcap === seqStock) {
    throw new Error("Instrument switching failed to produce distinct expiries for different categories!");
  }
  console.log("✓ Test F PASS — Instrument switching recalculates distinct valid expiries dynamically");

  console.log("\n=== ALL DYNAMIC EXPIRY TESTS PASSED ===\n");
}

runExpiryTests();
