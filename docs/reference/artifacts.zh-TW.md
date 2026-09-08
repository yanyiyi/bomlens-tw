---
description: 'BomLens 產生的輸出檔案——檔案清單、各檔案的產生條件、命名規則，以及 SBOM 結構摘要。'
---

# 產出物參考

產生的 SBOM 是 CycloneDX 1.6 JSON。由最終的 CycloneDX BOM 轉換而來的 SPDX 2.3 JSON 副本，可在 CLI 掃描時以 `--spdx` 產生，或在網頁介面的結果畫面隨時匯出。兩種途徑都執行相同的轉換，得到的檔案也相同。CycloneDX 仍是主要格式，而只存在於 CycloneDX 的資料（弱點、`bomlens:*` 屬性）不會一併帶到 SPDX 檔案裡。

檔名為 `{Project}_{Version}_bom.json`（例如 `MyApp_1.0.0_bom.json`）。

## 輸出檔案

| 檔案 | 產生條件 | 說明 |
|------|----------------|-------------|
| `{Project}_{Version}_bom.json` | 一律產生 | SBOM（CycloneDX 1.6） |
| `{Project}_{Version}_bom.spdx.json` | `--spdx` / `--all`，或在介面中使用「匯出為 SPDX 2.3」 | SBOM（SPDX 2.3，由 CycloneDX 輸出轉換而來） |
| `{Project}_{Version}_NOTICE.txt` / `.html` | `--notice` / `--all` / 風險報告預設產生 | 開放原始碼授權聲明 |
| `{Project}_{Version}_security.json` / `.md` / `.html` | `--security` / `--all` / 風險報告預設產生 | Trivy 安全報告 |
| `{Project}_{Version}_risk-report.md` / `.html` | 預設（所有模式）——以 `--no-report` 略過 | 開放原始碼風險報告 |
| `{Project}_{Version}_conformance.json` / `.md` / `.html` | `--analyze` | 格式符合性報告，並為每一份 SBOM 附上法規對照彙整（EU CRA 透過 BSI TR-03183-2、2026 年版美國 SBOM 最低要素——僅供參考，不構成合規判定）。若對象是 AI SBOM，還會納入 G7 檢查，並針對每一項仍缺漏的建議要素，附上可以滿足它的 CycloneDX 片段。可參考[已產生的範例](../samples/aether-7b-5attn_conformance.html) |
| `{Project}_{Version}_ai-profile.json` / `.md` | AI SBOM（`--model`，或對含有模型元件的 SBOM 執行 `--analyze`） | AI 合規概況：G7 彙整、可補齊的缺漏與其參考連結、被標記授權條款的元件、法規對照，以及模型風險評估（`riskAssessment`：各模型的 ok/conditional/caution/review 判定，連同條件、原因與使用情境；僅供參考，並非法律意見）。同一份彙整會出現在符合性報告 HTML 的開頭，因此不另外產生 HTML 版概況 |
| `{Project}_{Version}_scancode.json` | `--deep-license` | scancode 原始結果 |
| `{Project}_{Version}_bom.json.sig` | `--sign` | cosign 簽章（搭配 `--spdx` 時也會產生 `_bom.spdx.json.sig`） |

`{P}` = 專案名稱，`{V}` = 版本（特殊字元會正規化為 `_`）。

上表的產生條件是以 CLI 選項為準。在網頁介面與桌面版應用程式中，對應的選擇是「新增掃描」畫面上的產生選項——「授權聲明」與「安全報告」——而產生的每個檔案都會列在結果的「產出物」區段中，可依格式個別下載，也能打包成一個 ZIP。SPDX 在那裡不是掃描選項：該區段的 SBOM 卡片上有一個 **匯出為 SPDX 2.3** 按鈕，可在你需要時把完成的 BOM 轉換出來，轉換後的檔案也會加入產出物清單與 ZIP。介面沒有簽章功能，因此這樣匯出的 SPDX 不帶簽章；需要簽章時，請在 CLI 使用 `--spdx --sign`。參考[網頁介面與桌面版應用程式](ui.md)。

## SBOM 結構

```
bomFormat          "CycloneDX"
specVersion        "1.6"
metadata
  ├── timestamp    產生時間（ISO 8601）
  └── component    專案資訊（name、version、type）
components[]
  ├── type         "library" | "framework" | "application"
  ├── name         元件名稱
  ├── version      版本
  ├── purl         Package URL（唯一識別碼）
  └── licenses[]   授權條款資訊（SPDX ID）
```

各語言的 PURL 格式請參考[支援的生態系](ecosystems.md)。
