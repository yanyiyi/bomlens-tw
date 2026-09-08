#!/bin/sh
# Regenerate docker/lib/i18n/report-strings.<lang>.json from the PO file that
# Weblate maintains. Run this after every Weblate push: the report generators
# read the JSON, not the PO.
#
# Why PO at all: the English report path reads no catalogue (that is what keeps
# English output byte-identical), so there is no report-strings.en.json to act
# as a monolingual source. A bilingual PO carries the English in msgid instead.
#
# msgctxt holds the catalogue key. Matching on msgid alone would collide -- the
# same English ("Format") is both a table header and a metadata label.
#
# Keys with no PO entry are preserved from the existing JSON, so the 14 keys
# that no longer have a call site survive a round trip untouched.
set -eu

LANG_TAG="${1:?usage: po-to-report-strings.sh <ko|zh-TW>}"
ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
DIR="$ROOT/docker/lib/i18n"
PO="$ROOT/po/reports/${LANG_TAG}.po"
JSON="$DIR/report-strings.${LANG_TAG}.json"
[ -f "$PO" ] || { echo "no such PO: $PO" >&2; exit 1; }
[ -f "$JSON" ] || { echo "no such JSON: $JSON" >&2; exit 1; }

# PO -> {key: msgstr} as NDJSON. Handles gettext's multi-line continuation form
# (`msgstr ""` followed by quoted fragments), which is what Weblate emits when
# it rewraps a long string -- a single-line-only parser breaks on the first push.
extract() {
    awk '
    function flush() {
        if (ctx != "" && have_str) {
            gsub(/\\/, "\\\\", ctx); gsub(/"/, "\\\"", ctx)
            printf "{\"k\":\"%s\",\"v\":\"%s\"}\n", ctx, str
        }
        ctx = ""; str = ""; have_str = 0; field = ""
    }
    # Continuation line: a bare quoted fragment appends to the current field.
    /^[[:space:]]*"/ {
        line = $0
        sub(/^[[:space:]]*"/, "", line); sub(/"[[:space:]]*$/, "", line)
        if (field == "ctx") { d = line; gsub(/\\"/, "\"", d); gsub(/\\\\/, "\\", d); ctx = ctx d }
        else if (field == "str") { str = str line }
        next
    }
    /^msgctxt[[:space:]]/ {
        flush()
        line = $0; sub(/^msgctxt[[:space:]]*"/, "", line); sub(/"[[:space:]]*$/, "", line)
        d = line; gsub(/\\"/, "\"", d); gsub(/\\\\/, "\\", d)
        ctx = d; field = "ctx"; next
    }
    /^msgid[[:space:]]/  { field = "id"; next }
    /^msgstr[[:space:]]/ {
        line = $0; sub(/^msgstr[[:space:]]*"/, "", line); sub(/"[[:space:]]*$/, "", line)
        str = line; have_str = 1; field = "str"; next
    }
    /^[[:space:]]*$/ { flush(); next }
    { if (field == "ctx" || field == "str") field = "" }
    END { flush() }
    ' "$PO"
}

# The one nested key: msgctxt is "conformance.label_exact/<English label>".
extract | jq -s --slurpfile cur "$JSON" '
    (map(select(.v != "")) | map({key: .k, value: .v}) | from_entries) as $po
  | ($po | to_entries | map(select(.key | startswith("conformance.label_exact/")))
         | map({key: (.key | sub("^conformance\\.label_exact/"; "")), value: .value})
         | from_entries) as $exact
  | $cur[0]
  | with_entries(
      # Bind the key: inside has()/[] the input is $po, so a bare .key there
      # would resolve against $po and come back null.
      .key as $k
      | if   $k == "_note"                   then .
        elif $k == "conformance.label_exact" then .value = (.value + $exact)
        elif ($po | has($k))                 then .value = $po[$k]
        else . end)
' > "$JSON.tmp"

# jq -S would reorder the file; keep the hand-maintained key order instead.
mv "$JSON.tmp" "$JSON"
printf '%s: %s keys from %s\n' "$LANG_TAG" "$(jq 'length' "$JSON")" "${PO#"$ROOT/"}"
