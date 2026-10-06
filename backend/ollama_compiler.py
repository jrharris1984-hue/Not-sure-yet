"""Conservative checks for optional Ollama wording of a resolved prompt."""
import re

def normalized(text):
    return re.sub(r'\s+', ' ', text).strip().lower()

def clauses(text):
    text = re.sub(r'\b(?:Appearance|Wearing|Pose and framing|Additional selected details|scenario|scene|lighting|camera|style):\s*', '', text, flags=re.I)
    parts=[]; buffer=''; depth=0
    for char in text:
        depth += char in '(['
        depth -= char in ')]' and depth > 0
        if char in ',;\n' and depth == 0:
            parts.extend(re.split(r'\.\s+', buffer)); buffer=''
        else: buffer += char
    parts.extend(re.split(r'\.\s+', buffer))
    return [normalized(part.strip(' .;')) for part in parts if part.strip(' .;')]

def subject_blocks(text):
    matches=list(re.finditer(r'\bSubject ([A-Z]):', text))
    last={match.group(1):match for match in matches}
    ordered=sorted(last.values(), key=lambda match:match.start())
    return {match.group(1):text[match.end():ordered[index+1].start() if index+1<len(ordered) else len(text)] for index,match in enumerate(ordered)}

def validate_ollama_prompt(original, candidate):
    if not isinstance(candidate,str) or not candidate.strip() or len(candidate)>30000:
        return False, 'Ollama returned an invalid prompt.'
    haystack=normalized(candidate)
    if any(clause not in haystack for clause in clauses(original)):
        return False, 'Ollama changed or omitted a required phrase; using compact logic.'
    for clause in clauses(original):
        negated=r'\b(?:no|not|without|lacking)\s+(?:a |an |any )?' + re.escape(clause)
        if re.search(negated,haystack) and not re.search(negated,normalized(original)):
            return False, 'Ollama introduced a conflicting negation; using compact logic.'
    before,after=subject_blocks(original),subject_blocks(candidate)
    if before.keys()!=after.keys() or any(any(clause not in normalized(after[label]) for clause in clauses(block)) for label,block in before.items()):
        return False, 'Ollama changed person ownership; using compact logic.'
    for label,block in before.items():
        own=set(clauses(block)); destination=normalized(after[label])
        foreign={phrase for other,traits in before.items() if other!=label for phrase in clauses(traits)} - own
        if any(phrase in destination for phrase in foreign):
            return False, 'Ollama mixed person traits; using compact logic.'
    known=set(re.findall(r'[\w]+',original.lower()))
    glue=set('a an the and with wearing wears is are has have she he they their her his in on at of shown standing photograph person people features while alongside together appears featuring'.split())
    if set(re.findall(r'[\w]+',candidate.lower())) - known - glue:
        return False, 'Ollama added unrecognized wording; using compact logic.'
    return True, 'Ollama wording passed phrase and person checks.'
