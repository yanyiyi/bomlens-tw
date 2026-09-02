// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { waitForMainSettled } from "./visual";

/**
 * Traditional Chinese (zh-TW) smoke gates. zh-TW deliberately stays OUT of the
 * 0-pixel visual COMBOS until the initial machine translation has passed native
 * review — every wording fix would churn the whole baseline set. These
 * functional checks hold the line meanwhile: the locale resolves, renders, and
 * round-trips through the toggle; the shell stays axe-clean under zh glyphs.
 */

async function openShellZh(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("sbom.theme", "light");
    localStorage.setItem("sbom.lang", "zh-TW");
  });
  await page.goto("/?ui=next");
  await page.getByRole("banner").waitFor();
}

test("zh-TW: shell renders in Traditional Chinese with <html lang> synced", async ({
  page,
}) => {
  await openShellZh(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  // A couple of known catalogue strings — recent.title and shell.newScan.
  await expect(
    page.getByRole("heading", { level: 1, name: "掃描管理" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "新增掃描" }).first(),
  ).toBeVisible();
});

test("zh-TW: language toggle round-trips and persists", async ({ page }) => {
  await openShellZh(page);
  const toggle = page.getByRole("group", { name: "語言" });
  await expect(toggle.getByRole("button", { name: "TW" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // zh-TW -> en
  await toggle.getByRole("button", { name: "EN" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  // en -> zh-TW (the group is now labelled in English)
  await page
    .getByRole("group", { name: "Language" })
    .getByRole("button", { name: "TW" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("sbom.lang")))
    .toBe("zh-TW");
});

test("zh-TW: a fresh zh navigator locale lands on zh-TW", async ({ browser }) => {
  // No sbom.lang seeded — detection falls through to the navigator, and every
  // Chinese variant must resolve to the one Chinese we ship (i18n.ts
  // convertDetectedLanguage), not fall past supportedLngs to English.
  const context = await browser.newContext({ locale: "zh-Hant-TW" });
  const page = await context.newPage();
  await page.goto("/?ui=next");
  await page.getByRole("banner").waitFor();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await context.close();
});

test("zh-TW: idle shell has no axe violations", async ({ page }) => {
  await openShellZh(page);
  await waitForMainSettled(page); // avoid mid-fade contrast flake (see shell.spec.ts)
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
