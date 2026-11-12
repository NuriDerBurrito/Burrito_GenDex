#!/usr/bin/env bash
# 1.7.1 — the maintained battery, run serially (the parallel runner flakes
# the live-DOM suites; the 1.7.0-C log settled serial as the truth).
# Usage: bash scripts/run_battery_171.sh
cd "$(dirname "$0")/.." || exit 1
PASS=0; FAIL=0; FAILED=""
SUITES=(
  gendex_159_batch_dom gendex_160_batch_dom gendex_161_compat_legal
  gendex_163_batch_dom gendex_164_batch_dom gendex_165_batch_dom
  gendex_166_batch_dom gendex_167_batch_dom gendex_168_batch_dom
  gendex_169_batch_dom gendex_170_batch_dom gendex_171_batch_dom
  gendex_172_batch_dom gendex_173_batch_dom gendex_174_batch_dom
  gendex_175_batch_dom gendex_176_batch_dom gendex_177_batch_dom
  gendex_178_batch_dom gendex_179_batch_dom gendex_180_batch_dom
  gendex_181_batch_dom gendex_182_batch_dom gendex_183_batch_dom
  gendex_184_batch_dom gendex_185_batch_dom gendex_186_batch_dom gendex_187_batch_dom gendex_189_batch_dom gendex_190_batch_dom gendex_191_batch_dom gendex_192_batch_dom gendex_193_batch_dom gendex_194_batch_dom gendex_195_batch_dom gendex_196_batch_dom gendex_197_batch_dom gendex_198_batch_dom gendex_199_batch_dom gendex_200_batch_dom gendex_1910_batch_dom gendex_1911_batch_dom gendex_1912_batch_dom gendex_1913_batch_dom gendex_1914_batch_dom gendex_1915_batch_dom gendex_1916_batch_dom gendex_1917_batch_dom gendex_1918_batch_dom gendex_1919_batch_dom gendex_helpers gendex_theme_contrast gendex_smoke_render
  gendex_panel_handoff_dom gendex_panel_resize_dom gendex_app_boot
  gendex_richinput_dom gendex_stamp_gallery_dom gendex_textures
  gendex_tooltip_dom
)
for s in "${SUITES[@]}"; do
  f="scripts/${s}.test.mjs"
  if [ ! -f "$f" ]; then echo "  ?? $s (no file)"; continue; fi
  out=$(timeout 180 node "$f" 2>&1); rc=$?
  # verdict = the EXIT CODE (every dialect fails non-zero); the display line
  # is best-effort — the fleet's final lines are bespoke ("N passed, M
  # failed", "N ... checks passing", "saved state label: true", …)
  line=$(echo "$out" | grep -E "^[0-9]+ passed, [0-9]+ failed|passing|ALL GREEN" | tail -1)
  [ -z "$line" ] && line=$(echo "$out" | tail -1)
  if [ "$rc" -eq 0 ]; then
    echo "  ✓ $s: $line"; PASS=$((PASS+1))
  else
    echo "  ✗ $s: $line"; FAIL=$((FAIL+1)); FAILED="$FAILED $s"
  fi
done
echo "----"
echo "battery: $PASS green, $FAIL red${FAILED:+ — failed:$FAILED}"
