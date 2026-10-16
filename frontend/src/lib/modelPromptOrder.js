function groupedAt(text, index) {
  let depth = 0;
  for (let position = 0; position < index; position += 1) {
    if (text[position] === "\\") { position += 1; continue; }
    if ("([{".includes(text[position])) depth += 1;
    if (")]}".includes(text[position])) depth = Math.max(0, depth - 1);
  }
  return depth > 0;
}

// Only move standalone, unweighted score tags. Preserve weighted syntax and prose.
export function protectModelPromptOrder(positive = "", compiler = "") {
  if (compiler !== "pony") return positive;
  const tags = [], seen = new Set();
  const body = String(positive).replace(/(^|[,;]\s*)(score_\d+(?:_up)?)(?=\s*(?:[,;.]|$))/gi, (match, separator, tag, offset) => {
    if (groupedAt(String(positive), offset + separator.length)) return match;
    const key = tag.toLowerCase();
    if (!seen.has(key)) { seen.add(key); tags.push(tag); }
    return separator;
  });
  if (!tags.length) return positive;
  const rest = body.replace(/([,;])(?:\s*[,;])+/g, "$1").replace(/^[\s,;.]+/, "").replace(/[,;]\s*$/, "").trim();
  return [...tags, rest].filter(Boolean).join(", ");
}
