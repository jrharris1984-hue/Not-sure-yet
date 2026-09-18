// Prompt-string unit tests for foot-safeguard fix.
// Run: node --experimental-vm-modules /app/tests/prompt_foot_safeguard.mjs

import { buildPrompts } from "/app/frontend/src/lib/dna.js";
import { buildPonyPrompts } from "/app/frontend/src/lib/ponyPrompts.js";

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log("PASS:", msg); }
  else { failed++; console.log("FAIL:", msg); }
}

// -------- Venice: feet active --------
const dnaFeet = { feet: { sole_presentation: "sole showcase" } };
const p1 = buildPrompts(dnaFeet, {});
assert(p1.positive.includes("human foot anatomy not hand anatomy"), "Venice positive includes 'human foot anatomy not hand anatomy' when feet active");
assert(p1.positive.includes("toes shorter and thicker than fingers"), "Venice positive includes 'toes shorter and thicker than fingers'");
assert(p1.negative.includes("hands instead of feet"), "Venice negative includes 'hands instead of feet'");
assert(p1.negative.includes("fingers instead of toes"), "Venice negative includes 'fingers instead of toes'");
assert(p1.negative.includes("floating hand in frame"), "Venice negative includes 'floating hand in frame'");

// -------- Venice: feet empty --------
const dnaEmpty = { feet: {} };
const p2 = buildPrompts(dnaEmpty, {});
assert(!p2.positive.includes("human foot anatomy not hand anatomy"), "Venice positive does NOT include foot-anatomy line when feet empty (no pollution)");
assert(p2.negative.includes("hands instead of feet"), "Venice negative STILL includes 'hands instead of feet' when feet empty (always-on safeguard)");

// -------- Pony: feet active --------
const p3 = buildPonyPrompts(dnaFeet, {});
assert(p3.positive.includes("(five_toes, toenails, sole, heel, arch, ankle, human_feet, correct_foot_anatomy:1.3)"),
  "Pony positive includes weighted five_toes tag block");
assert(p3.negative.includes("hands_instead_of_feet"), "Pony negative includes 'hands_instead_of_feet'");
assert(p3.negative.includes("fingers_instead_of_toes"), "Pony negative includes 'fingers_instead_of_toes'");
assert(p3.negative.includes("palm_instead_of_sole"), "Pony negative includes 'palm_instead_of_sole'");

// -------- Pony: feet empty --------
const p4 = buildPonyPrompts(dnaEmpty, {});
assert(!p4.positive.includes("five_toes"), "Pony positive does NOT include five_toes when feet empty");

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed ? 1 : 0);
