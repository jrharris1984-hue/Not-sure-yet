import { workflowPromptPolicy } from './workflowPromptPolicy';
import { applyPhotographicGuidance } from "./photographicGuidance";
import { protectModelPromptOrder } from "./modelPromptOrder";
import { estimatePromptTokens } from "./promptQuality";
import { PROMPT_BUDGET_WORDS } from "./promptPriority";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function containsTrigger(text, trigger) {
  return new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegex(trigger)}(?=$|[^\\p{L}\\p{N}_])`, "iu").test(text);
}

// The last text transform before preview and dispatch. Never trim selected details
// to meet a heuristic budget; report the finished length instead.
export function assembleFinalPrompts({ positive = "", negative = "", compiler = "standard",
  negativeStrategy = "text", photographic = false, loraTriggers = [], exact = false,
  budgetWords = null, workflowKind = "", promptStyle = "" } = {}) {
  const policy = workflowPromptPolicy({workflowKind, promptStyle, compiler});
  let result = { positive, negative };
  if (!exact && String(positive).trim()) {
    result = applyPhotographicGuidance({ ...result, negativeStrategy, enabled: photographic && policy.photographic });
    const missing = [], seen = new Set();
    for (const value of policy.imageLoras ? loraTriggers : []) {
      if (typeof value !== "string") continue;
      const trigger = value.trim(), key = trigger.toLowerCase();
      if (!trigger || seen.has(key)) continue;
      seen.add(key);
      if (!containsTrigger(result.positive, trigger)) missing.push(trigger);
    }
    result.positive = protectModelPromptOrder([...missing, result.positive].join(", "), compiler);
  }
  const words = String(result.positive).trim().split(/\s+/).filter(Boolean).length;
  const family = ["flux1_dev", "flux2_klein"].includes(compiler) ? "standard" : compiler;
  const budget = Number(budgetWords) > 0 ? Number(budgetWords) : PROMPT_BUDGET_WORDS[family] || PROMPT_BUDGET_WORDS.standard;
  return { ...result, assembly: { version: 1, compiler, task:policy.task, words,
    estimatedTokens: estimatePromptTokens(result.positive), budgetWords: budget,
    overBudgetWords: Math.max(0, words - budget), exact, truncated: false } };
}
