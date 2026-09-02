#!/usr/bin/env node
// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0

/**
 * i18n coverage — fails when any message catalogue drifts from the English
 * reference. Every locale under src/locales must carry exactly the keys en
 * has (DoD: en ≡ every locale, missing keys 0). Run in CI so a new string
 * can't ship in one language only.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const LOCALES = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "src",
  "locales",
);

/** Flatten a nested message object to dotted leaf keys. */
function flatten(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

function load(lng) {
  return new Set(
    flatten(JSON.parse(readFileSync(join(LOCALES, lng, "common.json"), "utf8"))),
  );
}

const locales = readdirSync(LOCALES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
const others = locales.filter((l) => l !== "en");
if (!locales.includes("en") || others.length === 0) {
  console.error(`i18n coverage failed — expected en plus at least one other locale under ${LOCALES}, found: ${locales.join(", ") || "none"}`);
  process.exit(1);
}

const en = load("en");
let failed = false;
for (const lng of others) {
  const cat = load(lng);
  const missing = [...en].filter((k) => !cat.has(k)).sort();
  const extra = [...cat].filter((k) => !en.has(k)).sort();
  if (missing.length || extra.length) {
    if (!failed) console.error("i18n coverage failed — locales are out of sync:\n");
    failed = true;
    if (missing.length)
      console.error(`Missing in ${lng} (${missing.length}):\n  ${missing.join("\n  ")}\n`);
    if (extra.length)
      console.error(`Extra in ${lng}, not in en (${extra.length}):\n  ${extra.join("\n  ")}\n`);
  }
}
if (failed) process.exit(1);
console.log(`i18n coverage passed — en ≡ ${others.join(" ≡ ")} (${en.size} keys).`);
