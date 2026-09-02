// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";

import { localeFieldSuffix, pickLocalized } from "./locale";

describe("localeFieldSuffix", () => {
  it("maps Korean and Chinese language tags to their field suffix", () => {
    expect(localeFieldSuffix("ko")).toBe("ko");
    expect(localeFieldSuffix("ko-KR")).toBe("ko");
    expect(localeFieldSuffix("zh-TW")).toBe("zh");
    expect(localeFieldSuffix("zh-Hant-TW")).toBe("zh");
  });

  it("maps English and unknown/absent tags to the base field", () => {
    expect(localeFieldSuffix("en")).toBe("");
    expect(localeFieldSuffix("en-US")).toBe("");
    expect(localeFieldSuffix("fr")).toBe("");
    expect(localeFieldSuffix(undefined)).toBe("");
  });
});

describe("pickLocalized", () => {
  const row = {
    label: "Component name",
    labelKo: "컴포넌트 이름",
    label_zh: "元件名稱",
  };

  it("prefers the camel sibling, then the snake sibling", () => {
    expect(pickLocalized(row, "label", "ko")).toBe("컴포넌트 이름");
    expect(pickLocalized(row, "label", "zh-TW")).toBe("元件名稱");
    expect(
      pickLocalized({ short: "BSI", short_ko: "BSI(독일)" }, "short", "ko-KR"),
    ).toBe("BSI(독일)");
  });

  it("returns the English base field for English readers", () => {
    expect(pickLocalized(row, "label", "en")).toBe("Component name");
  });

  it("falls back to English when the translation is absent or empty", () => {
    expect(pickLocalized({ label: "Hash" }, "label", "zh-TW")).toBe("Hash");
    expect(pickLocalized({ label: "Hash", labelZh: "" }, "label", "zh-TW")).toBe(
      "Hash",
    );
  });

  it("is safe on missing objects and non-string fields", () => {
    expect(pickLocalized(undefined, "label", "ko")).toBe("");
    expect(pickLocalized({ label: 7 }, "label", "en")).toBe("");
  });
});
