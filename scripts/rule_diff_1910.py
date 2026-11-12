#!/usr/bin/env python3
"""1.9.10 - rule-by-rule diff: current sheet vs the classic 1.9.2 fixture."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CUR = (ROOT / 'src' / 'index.css').read_text(encoding='utf8')
FIX = (ROOT / 'scripts' / 'fixtures' / 'index_classic_192_coat.css').read_text(encoding='utf8')


def strip_comments(text):
    return re.sub(r'/\*[\s\S]*?\*/', '', text)


def top_level_rules(text):
    out = []
    i, n = 0, len(text)
    while i < n:
        b = text.find('{', i)
        if b == -1:
            break
        sel = ' '.join(text[i:b].split())
        depth, j = 1, b + 1
        while j < n and depth:
            if text[j] == '{':
                depth += 1
            elif text[j] == '}':
                depth -= 1
            j += 1
        if sel:
            out.append((sel, text[b + 1:j - 1]))
        i = j
    return out


def body_norm(body):
    lines = [' '.join(ln.split()) for ln in body.splitlines()]
    return '\n'.join(ln for ln in lines if ln)


cur_all = top_level_rules(strip_comments(CUR))
fix_all = top_level_rules(strip_comments(FIX))
cur_rules = {sel: body_norm(b) for sel, b in cur_all}
fix_rules = {sel: body_norm(b) for sel, b in fix_all}

KEY = re.compile(r'gd-(finish|numeix|foil|auric|nuri|holo|prism|card-face-finish|card-face-artfin|artfin)')
fix_sel = [s for s in fix_rules if KEY.search(s)]
print(f'fixture coat rules: {len(fix_sel)}')

only_fix = [s for s in sorted(fix_sel) if s not in cur_rules]
diff = [s for s in sorted(fix_sel) if s in cur_rules and fix_rules[s] != cur_rules[s]]
cur_only = [s for s in cur_rules if KEY.search(s) and s not in fix_rules]

print('\n== LOST (in fixture, missing from current) ==')
for s in only_fix:
    print('  -', s)
print('\n== DIFFER (body differs, comments ignored) ==')
for s in diff:
    print('  ~', s)
print('\n== ADDED (current sheet only) ==')
for s in sorted(cur_only):
    print('  +', s)

for s in diff:
    print(f'\n----- {s} -----\n[CLASSIC 1.9.2]\n{fix_rules[s][:1600]}\n\n[CURRENT]\n{cur_rules[s][:1600]}\n')
