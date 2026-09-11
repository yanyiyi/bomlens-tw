---
description: '將產生的 SBOM 上傳到 Dependency-Track 伺服器，或 TRUSCA 的原生 ingest 端點。'
---

# 上傳到 Dependency-Track / TRUSCA

本指南說明掃描器如何上傳產生的 SBOM，以及如何改為傳送到 TRUSCA 的原生 ingest 端點。

掃描結束後預設會上傳 SBOM（`--generate-only` 只儲存在本機，並略過上傳）。上傳目的地以 `UPLOAD_TARGET` 選擇。

- `dependency-track`（預設）：一般的 Dependency-Track 伺服器。以 `API_URL` 與 `API_KEY`(`X-Api-Key`) 驗證身分，並自動建立專案。
- `trusca`：TRUSCA 的原生 ingest 端點。它與 Dependency-Track 不相容，因此驗證方式與所需輸入都不同。

要上傳到 TRUSCA，請準備三樣東西。

- `API_URL`：TRUSCA 伺服器的 URL
- `API_KEY`：TRUSCA 發給的 Bearer 權杖（以 `tos_` 開頭，developer 角色）
- project_id：目標 TRUSCA 專案的 id (UUID)。它必須事先存在，不會自動建立。

```bash
API_URL="https://<TRUSCA 主機>" API_KEY="tos_..." \
  ./scripts/scan-sbom.sh \
  --project "MyApp" --version "1.2.3" --all \
  --trusca "<project_id>"
```

`--trusca <id>` 是 `--upload-target trusca` 加上 `TRUSCA_PROJECT_ID` 的簡寫。ref 與 release 標籤可用 `TRUSCA_REF`（預設 `main`）與 `TRUSCA_RELEASE`（預設為 `--version` 的值）調整。上傳被接受時會印出 `202` 與一組 scan id；進度可在 TRUSCA 介面追蹤 (`GET /v1/scans/{id}`)。

> TRUSCA ingest 會填入元件、弱點、宣告的授權條款、相依關係圖與建置閘門。由於沒有原始碼樹，它無法填入 scancode 偵測到的授權條款 (`--deep-license`)、cosign 簽章 (`--sign`) 與原始碼保存。若需要這些，請以 `--generate-only` 在本機一併產生。

## 從網頁介面

不用 CLI 也能上傳。在「新增掃描」表單開啟**上傳（選填）**步驟，選擇 Dependency-Track 或 TRUSCA，並填入伺服器 URL 與 API 權杖（TRUSCA 還要填 TRUSCA 專案 ID）。掃描執行完後會接著一次上傳，使用的端點與驗證方式與上文相同。URL 與權杖只在本次執行使用，不會儲存。詳情請看[網頁介面參考](../reference/ui.md)。
