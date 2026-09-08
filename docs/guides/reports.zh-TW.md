---
description: '如何用 BomLens 從 SBOM 產生開源授權聲明（NOTICE）、安全弱點報告與相關產出物。'
---

# 產生授權聲明、安全與風險報告

除了產生 SBOM 之外，BomLens 還會在同一次執行中產出開源授權聲明（NOTICE）與安全弱點報告。這一頁說明如何產生這些輸出；至於如何閱讀與解讀它們，請看[如何讀報告](../concepts/reports-explained.md)。

## 快速上手（5 分鐘）

如果這是你第一次使用，照這一節做就夠了。在 Docker 引擎執行中的狀態下，一次產生 SBOM、授權聲明與安全報告——用瀏覽器或 CLI 都可以。

### 瀏覽器介面（不需要指令列）

啟動介面，輸入專案名稱與版本，選擇掃描目標並執行，就能下載授權聲明與安全報告。

```bash
./scripts/scan-sbom.sh --ui     # 會開啟 http://localhost:8080（連接埠被占用？UI_PORT=9090 ./scripts/scan-sbom.sh --ui）
#   Windows：雙擊 scripts\sbom-ui.bat
```

### CLI

在你要掃描的專案資料夾中執行：

```bash
cd /path/to/your-project
/path/to/bomlens/scripts/scan-sbom.sh --project MyApp --version 1.0.0 --all --generate-only
```

在 Windows 上請使用 `scripts\scan-sbom.bat`（需要 Git Bash），或在 WSL2 底下直接照原樣執行。安裝方式請看[快速開始](../start/first-scan.md)。

執行結束後，在同一個資料夾裡打開 `MyApp_1.0.0_NOTICE.html` 與 `MyApp_1.0.0_security.html`，就能立刻確認結果。更詳細的選項請看下文。

---

## 事前準備

- Docker 引擎 20.10 以上（免費選項是 WSL2 + docker-ce 或 Rancher Desktop；Docker Desktop 供組織使用時需付費）
- 下載掃描器映像檔：
  ```bash
  docker pull ghcr.io/sktelecom/bomlens:latest   # 舊名稱 sbom-scanner 是同一個映像檔
  ```
- 所有範例都請在要掃描的專案根目錄執行。

> 輸出旗標建議搭配 `--generate-only`（只存在本機）一起使用。若要同時自動上傳到外部系統（Dependency-Track 伺服器或 TRUSCA），就省略它；上傳目的地用 `UPLOAD_TARGET` 指定。

---

## 一次產生全部產出物（`--all`）

`--all` 是 `--notice --security --spdx` 的縮寫。它會在一次掃描中產出 SBOM、授權聲明、安全報告，以及 SBOM 的 SPDX 副本。

在網頁介面與桌面版應用程式中，授權聲明與安全報告是「新增掃描」畫面上的產生選項，SPDX 副本則是在掃描結束後從結果畫面匯出。

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --all --generate-only
```

產生的檔案：
```
MyApp_1.0.0_bom.json            # SBOM（CycloneDX 1.6）
MyApp_1.0.0_NOTICE.txt          # 授權聲明（文字）
MyApp_1.0.0_NOTICE.html         # 授權聲明（HTML）
MyApp_1.0.0_security.json       # 安全報告（Trivy 原始輸出）
MyApp_1.0.0_security.md         # 安全報告（摘要）
MyApp_1.0.0_security.html       # 安全報告（視覺化）
MyApp_1.0.0_risk-report.md      # 開放原始碼風險分析報告（摘要）
MyApp_1.0.0_risk-report.html    # 開放原始碼風險分析報告（視覺化）
```

> 開放原始碼風險分析報告（`_risk-report`）在所有分析模式下都會預設產生（授權條款加弱點統計，並附上修補期限）。想略過就用 `--no-report`。六種輸入形式各自的處理方式，請看[依輸入類型的指南](by-input.md)。

產出物種類的完整清單請看[產出物參考](../reference/artifacts.md)；想從瀏覽器產生它們，請看[網頁介面](../reference/ui.md)。

---

## 開源授權聲明（`--notice`）

蒐集 SBOM 中的 `components[].licenses` 資訊，產生依授權條款分組列出元件的授權聲明。

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --notice --generate-only
```

- `_NOTICE.txt`——標準文字格式，適合隨散布物一起交付。
- `_NOTICE.html`——適合用瀏覽器閱讀的格式。所有套件後設資料都經過 HTML 轉義，是安全的。
- 沒有授權條款資訊的元件會被分類為 `NOASSERTION`。

授權條款的正規化與全文收錄行為，請看[如何讀報告](../concepts/reports-explained.md)。

範例（文字）：
```
License: Apache-2.0
Components (1):
  - requests@2.31
```

---

## 安全弱點報告（`--security`）

以 Trivy 掃描產生出來的 SBOM，回報已知弱點（CVE）。（NVD + OSV + GHSA DB）

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --security --generate-only
```

- `_security.json`——Trivy 的原始 JSON。供 CI 或機器處理使用。
- `_security.md`——依嚴重程度統計的表格與 CVE 清單。適合附在 PR 或 issue 上。
- `_security.html`——帶有嚴重程度標籤與表格的視覺化報告。

即使存在弱點，報告也不會讓掃描失敗（report-only）。如果需要閘門，請對 `_security.json` 做後處理。

嚴重程度、CVSS、EPSS 與 KEV 優先順序訊號，以及後續處理的解讀方式，請看[如何讀報告](../concepts/reports-explained.md)。

---

## 深度 CVE 比對（`--deep-cve`）

Trivy 以套件身分（PURL）比對弱點，對各生態系的公告資料庫覆蓋得很好。不過較舊的 Java 函式庫有些 CVE 只記錄在 NVD，而且是以 CPE 識別碼登錄，因此以 PURL 為基礎的掃描永遠碰不到它們。`--deep-cve` 會多加一輪比對：BomLens 依 groupId 為每個 Maven 元件推導出可與 NVD 比對的 CPE（這個補強步驟以 Maven 為對象），接著由 grype 把所有元件的 CPE——不論來自哪個生態系——拿去與內建的 NVD 資料庫比對。實務上多出來的結果大多仍是 Maven，因為補強步驟正是在那裡補上了 SBOM 原本沒有的 CPE。

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --deep-cve --generate-only
```

- `--deep-cve` 會一併開啟 `--security`。多找到的結果會合併進同一份安全報告（`_security.json/.md/.html`），並標上 `nvd:cpe` 來源。
- 掃描會在 opt-in 的 `ghcr.io/sktelecom/bomlens-deep-cve:latest` 映像檔上執行，該映像檔內建 grype 與它的資料庫；設定這個旗標時會自動下載（可用 `SBOM_DEEP_CVE_IMAGE` 覆寫）。它適用於使用基礎映像檔的模式（原始碼、映像檔、二進位檔案、rootfs、SBOM 分析）；韌體與 AI 模型掃描會印出警告並在沒有 grype 的情況下繼續執行，因為這兩種都不會產生可供比對的套件 purl。
- 在網頁介面（以及桌面版應用程式）中，同一個選項是掃描選項裡的**深度 CVE 比對（NVD CPE）**開關。凡是使用基礎映像檔的掃描模式都提供它——原始碼、Docker 映像檔、rootfs、套件上傳與 SBOM 上傳——並且和 CLI 一樣，只在韌體與 AI 模型掃描時隱藏。開啟它會連安全報告一起開啟；deep-cve 映像檔會在第一次使用時下載一次，以並列的容器執行，若介面本身就是從該映像檔啟動的，則直接在同一個行程內處理。
- CPE 比對比 PURL 比對寬鬆，因為 NVD 的版本範圍有時記錄得很粗略。預設情況下掃描維持離線：這類結果會保留下來，並在報告中標示為**版本未驗證**（一個劍號符號加上註腳），讓讀者知道哪些列可能是版本範圍過寬造成的誤判。想收緊判定，就搭配 `NVD_API_KEY` 設定 `SECURITY_NVD_VERIFY=true`：每一筆結果都會與即時的 NVD 版本範圍核對，落在範圍外的誤判會被濾掉。這項驗證需要網路連線，並會多花上幾分鐘。

```bash
SECURITY_NVD_VERIFY=true NVD_API_KEY="your-key" \
  ./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --deep-cve --generate-only
```

---

## 逐檔授權條款掃描（`--deep-license`）

基本的授權聲明涵蓋的是相依項目（第三方）的授權條款。`--deep-license` 會用 scancode-toolkit 進一步偵測專案自身原始碼（第一方）中的授權條款檔頭。

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --notice --deep-license --generate-only
```

在網頁介面中，逐檔授權條款掃描是產生選項之一。無論從哪一邊使用，它都依賴 scancode，而 scancode 又重又慢（大型儲存庫要數分鐘到數十分鐘），而且不在基礎映像檔裡。要使用它，必須從內建 scancode 的映像檔執行：

> ```bash
> docker build --build-arg SBOM_DEEP_LICENSE=true -t bomlens:deep ./docker
> # CLI：    SBOM_SCANNER_IMAGE=bomlens:deep ./scripts/scan-sbom.sh ... --deep-license
> # 網頁介面：SBOM_SCANNER_IMAGE=bomlens:deep ./scripts/scan-sbom.sh --ui
> ```

額外產出物：`MyApp_1.0.0_scancode.json`

---

## 對外授權條款衝突（`--license`）

宣告你對外散布時採用的授權條款，讓每個相依項目都能以它為基準判定。原始碼掃描無法推斷這個值——cdxgen 在 maven 與 gradle 的樹狀結構中會把根授權條款留空——因此沒有指定這個旗標時不會產生判定。

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --license Apache-2.0 --all --generate-only
```

這個值會記錄在 SBOM 的根元件上，風險報告也會多出一個衝突章節。已經存在的根授權條款——也就是供應者 SBOM 自己宣告的值——絕不會被取代。判定的解讀方式請看[如何讀報告](../concepts/reports-explained.md#outbound-license-conflicts)。

---

## 決定性輸出（`--byte-stable`）

相同輸入會產生逐位元組完全相同的 SBOM。它消除了 CI 中沒有意義的差異（時間戳記、隨機 ID、排序差異），並確保可重現性。

```bash
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --byte-stable --generate-only
```

實際的處理：把 `metadata.timestamp` 固定為 `1970-01-01T00:00:00Z`、移除隨機的 `serialNumber`、把 `components` 依 purl 排序，並排序所有鍵。

---

## SBOM 簽章（`--sign`）

以 cosign 為 SBOM 建立 detached 簽章，藉此建立供應鏈信任。這是離線的金鑰簽章（`--tlog-upload=false`），不需要網路或 OIDC。

```bash
# 1）產生金鑰（只需第一次）。要產生無密碼的金鑰，請使用 COSIGN_PASSWORD=""
docker run --rm -v "$PWD":/keys -w /keys -e COSIGN_PASSWORD="" \
  --entrypoint cosign ghcr.io/sktelecom/bomlens:latest generate-key-pair

# 2）一邊簽章一邊掃描（COSIGN_KEY 是私鑰路徑，COSIGN_PASSWORD 是金鑰密碼）
COSIGN_KEY="$PWD/cosign.key" COSIGN_PASSWORD="" \
  ./scripts/scan-sbom.sh --project MyApp --version 1.0.0 --sign --generate-only

# 3）驗證
docker run --rm -v "$PWD":/w -w /w --entrypoint cosign \
  ghcr.io/sktelecom/bomlens:latest \
  verify-blob --key cosign.pub --signature MyApp_1.0.0_bom.json.sig \
  --insecure-ignore-tlog MyApp_1.0.0_bom.json
```

私鑰會以唯讀方式掛載進容器。額外產出物：`MyApp_1.0.0_bom.json.sig`

---

## 疑難排解 {#troubleshooting}

| 症狀 | 原因／解決方式 |
|---------|-------------|
| `trivy not installed ... skipping` | 映像檔版本太舊。請用 `docker pull` 取得最新的映像檔。 |
| `--deep-license requested but scancode not in image` | 請以 `--build-arg SBOM_DEEP_LICENSE=true` 建置映像檔。 |
| 介面出現 `Docker is not running` | 請啟動 Docker 引擎（Rancher Desktop／Docker Desktop 等），然後重新執行。 |
| 授權聲明中出現大量 `NOASSERTION` | 表示這些相依項目沒有授權條款後設資料。請用 `--deep-license` 補強，或手動確認。 |
| 連接埠衝突（`--ui`） | 請用 `UI_PORT` 指定其他連接埠。 |
