// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0

/**
 * Locale-suffixed field lookup for report artifacts.
 *
 * The scan artifacts keep their machine contract in English and carry
 * translations as sibling fields beside each string: snake case in the raw
 * knowledge base (`label_ko`, `short_zh`) and camel case where server.py
 * re-exports them (`labelKo`, `howZh`). The UI must therefore resolve
 * "the label in the reader's language" per field, not per document — and fall
 * back to the English field for artifacts scanned before a language existed.
 */

/** The sibling-field name part for a UI language ("" means the English base field). */
export function localeFieldSuffix(lng: string | undefined): "" | "ko" | "zh" {
  const l = (lng ?? "").toLowerCase();
  if (l.startsWith("ko")) return "ko";
  if (l.startsWith("zh")) return "zh";
  return "";
}

/**
 * The `base` field of `obj` in the reader's language: the `_ko`/`_zh` snake or
 * `Ko`/`Zh` camel sibling when the locale has one, else the English base field.
 * Absent/empty translations fall back to English so old artifacts stay legible.
 */
export function pickLocalized(
  o: object | undefined,
  base: string,
  lng: string | undefined,
): string {
  if (!o) return "";
  const obj = o as Record<string, unknown>;
  const sfx = localeFieldSuffix(lng);
  if (sfx) {
    const camel = obj[`${base}${sfx[0].toUpperCase()}${sfx.slice(1)}`];
    if (typeof camel === "string" && camel) return camel;
    const snake = obj[`${base}_${sfx}`];
    if (typeof snake === "string" && snake) return snake;
  }
  const en = obj[base];
  return typeof en === "string" ? en : "";
}
