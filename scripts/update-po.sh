#!/bin/sh
# Sync the PO catalogues with the English sources, then regenerate every
# generated translation. Run this after editing an English page, and after
# every Weblate push.
#
# What is generated from what:
#   po/docs/zh-TW.po        -> docs/**/*.zh-TW.md      (25 site pages)
#   po/governance/zh-TW.po  -> ./*.zh-TW.md            (4 governance docs)
#   po/knowledge/*.po       -> docker/lib/*.json         (registry labels)
#   po/reports/*.po         -> docker/lib/i18n/*.json  (report strings)
#
# The .zh-TW.md files are OUTPUTS. Editing one by hand is lost on the next run.
# Korean is not managed here: the .ko.md pages stay hand-maintained upstream.
set -eu

ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

command -v po4a >/dev/null 2>&1 || {
    echo "po4a is required: brew install po4a (or apt install po4a)" >&2; exit 1; }
command -v msgfmt >/dev/null 2>&1 || {
    echo "gettext is required: brew install gettext (or apt install gettext)" >&2; exit 1; }

echo "== docs site =="
po4a po/docs.cfg

echo "== governance =="
po4a po/governance.cfg

echo "== knowledge base =="
for lang in ko zh-TW; do
    node ./scripts/kb-po.mjs --from-po "$lang"
done

echo "== report strings =="
for lang in ko zh-TW; do
    ./scripts/po-to-report-strings.sh "$lang"
done

echo "== validating =="
for po in po/docs/zh-TW.po po/governance/zh-TW.po po/knowledge/*.po po/reports/*.po; do
    # msgfmt appends .mo to -o, so /dev/null is not a usable sink; and a stale
    # .mo left in the tree would get committed by accident. Use a temp file.
    mo="$(mktemp -t po4a-check)"
    msgfmt --check --strict -o "$mo" "$po" 2>&1 | grep -v "header field" || true
    stats="$(msgfmt --statistics -o "$mo" "$po" 2>&1 \
        | grep -oE '[0-9]+ translated[^,.]*' || echo 'no stats')"
    rm -f "$mo"
    printf '  %-44s %s\n' "$po" "$stats"
done
