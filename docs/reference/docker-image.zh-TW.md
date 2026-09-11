---
description: '以 docker run 直接呼叫 BomLens 掃描器 Docker 映像檔，適用於 CI runner、Kubernetes job 等無法放置指令碼的環境。'
---

# 直接使用 Docker 映像檔

平常使用時，我們建議用 [`scan-sbom.sh`](../reference/cli.md) 指令碼，它會替你處理語言偵測、映像檔選擇與 volume 掛載。這份文件說明在無法放置指令碼的環境（CI runner、Kubernetes job 等）裡，如何用 `docker run` 直接呼叫映像檔。

## 映像檔與標籤

| 映像檔 | 用途 |
|--------|------|
| `ghcr.io/sktelecom/bomlens` | 掃描與後處理（正式名稱） |
| `ghcr.io/sktelecom/sbom-generator`、`ghcr.io/sktelecom/sbom-scanner` | 同一個映像檔的別名（舊名稱，雜湊值相同） |
| `ghcr.io/sktelecom/bomlens-firmware` | 韌體分析（含 GPL 工具，opt-in）（舊別名：sbom-scanner-firmware） |
| `ghcr.io/sktelecom/bomlens-deep-cve` | 內含 grype 以進行深度 CVE 比對 (opt-in)。CLI 的 `--deep-cve` 與網頁介面的「深度 CVE 比對」開關都會用它；當目前執行的映像檔不是它時，兩者都會自動把它當作附屬容器下載 |

提供 `latest` 與版本標籤，並同時支援 `linux/amd64` 與 `linux/arm64`。映像檔在發佈前會以 cosign 簽章。

```bash
docker pull ghcr.io/sktelecom/bomlens:latest
```

## 映像檔裡有什麼

這是一個不含語言 toolchain 的輕量映像檔（基於 python 3.12 slim）。原始碼掃描的間接相依解析由指令碼負責，它會另外下載各語言的 cdxgen 映像檔。結構請看[架構](../concepts/architecture.md)。

| 工具 | 版本 | 角色 |
|------|------|------|
| syft | v1.51.0 | 掃描映像檔、二進位檔與目錄 |
| Trivy | v0.74.0 | 弱點報告 |
| cosign | v2.6.5 | SBOM 簽章 |
| jq | — | SBOM 正規化與產生授權聲明 |
| ScanCode Toolkit | 32.5.0 | 精確的授權條款偵測（只包含在 opt-in 的建置中） |

工具版本以 `docker/Dockerfile` 裡的 `ARG` 固定。

## 直接執行

用 `MODE` 環境變數選擇分析模式。以下所有範例都把輸出留在目前目錄，也不會上傳任何東西 (`UPLOAD_ENABLED=false`)。

### 分析 Docker 映像檔

<!-- runnable -->
```bash
docker run --rm \
  -v "$(pwd)":/host-output \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e MODE=IMAGE \
  -e TARGET_IMAGE="nginx:alpine" \
  -e UPLOAD_ENABLED=false \
  -e HOST_OUTPUT_DIR=/host-output \
  -e PROJECT_NAME="Nginx" \
  -e PROJECT_VERSION="alpine" \
  ghcr.io/sktelecom/bomlens:latest
```

### 分析二進位檔案

```bash
docker run --rm \
  -v "$(pwd)":/target \
  -v "$(pwd)":/host-output \
  -e MODE=BINARY \
  -e TARGET_FILE=/target/firmware.bin \
  -e UPLOAD_ENABLED=false \
  -e HOST_OUTPUT_DIR=/host-output \
  -e PROJECT_NAME="Firmware" \
  -e PROJECT_VERSION="1.0" \
  ghcr.io/sktelecom/bomlens:latest
```

### 分析原始碼目錄

<!-- runnable -->
```bash
docker run --rm \
  -v "$(pwd)":/src \
  -v "$(pwd)":/host-output \
  -e MODE=SOURCE \
  -e UPLOAD_ENABLED=false \
  -e HOST_OUTPUT_DIR=/host-output \
  -e PROJECT_NAME="MyApp" \
  -e PROJECT_VERSION="1.0.0" \
  ghcr.io/sktelecom/bomlens:latest
```

直接執行時，`SOURCE` 模式是讓 syft 在容器內讀取套件的宣告檔，因此可能只會抓到直接相依。如果需要間接相依，請改用 `scan-sbom.sh`，它會分流到各語言的 cdxgen 映像檔。

### 一次產生授權聲明與報告

直接執行時，授權聲明與安全報告預設是關閉的。開啟下列變數，就能得到和 CLI `--all` 相同的輸出。

<!-- runnable -->
```bash
docker run --rm \
  -v "$(pwd)":/host-output \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e MODE=IMAGE \
  -e TARGET_IMAGE="nginx:alpine" \
  -e GENERATE_NOTICE=true \
  -e GENERATE_SECURITY=true \
  -e GENERATE_REPORT=true \
  -e UPLOAD_ENABLED=false \
  -e HOST_OUTPUT_DIR=/host-output \
  -e PROJECT_NAME="Nginx" \
  -e PROJECT_VERSION="alpine" \
  ghcr.io/sktelecom/bomlens:latest
```

## 環境變數 {#environment-variables}

| 環境變數 | 必要 | 預設值 | 說明 |
|-----------|------|--------|------|
| `MODE` | 是 | `POSTPROCESS` | 分析模式：`SOURCE`、`IMAGE`、`BINARY`、`ROOTFS`、`FIRMWARE`、`ANALYZE` |
| `PROJECT_NAME` | 是 | — | 專案名稱 |
| `PROJECT_VERSION` | 是 | — | 專案版本 |
| `TARGET_IMAGE` | 依模式 | — | `IMAGE` 模式的映像檔名稱（需要掛載 docker.sock） |
| `TARGET_FILE` | 依模式 | — | `BINARY`/`FIRMWARE` 模式的檔案路徑（容器內的路徑） |
| `TARGET_DIR` | 依模式 | — | `ROOTFS` 模式的目錄路徑 |
| `UPLOAD_ENABLED` | — | `true` | 設為 `false` 時只儲存在本機，不上傳（等同 CLI 的 `--generate-only`） |
| `HOST_OUTPUT_DIR` | — | — | 用來複製輸出的掛載路徑 |
| `GENERATE_NOTICE` | — | `false` | 產生開放原始碼授權聲明 (CLI `--notice`) |
| `GENERATE_SECURITY` | — | `false` | 產生 Trivy 安全報告 (CLI `--security`) |
| `GENERATE_REPORT` | — | `false` | 產生開放原始碼風險分析報告（與 CLI 預設不同，直接執行時是關閉的） |
| `ENRICH_MAVEN_CPE` | — | `true` | 為 maven 元件附上可與 NVD 比對的 `cpe:2.3`（由 groupId 推導），讓支援 CPE 的引擎也能找到它們僅存在於 NVD 的 CVE；未能對應的 group 不會附上 CPE（AI SBOM 會略過） |
| `ENRICH_GITHUB_CPE` | — | `true` | 為一小批經人工驗證的 `pkg:github/` 元件（只以原始碼儲存庫座標識別，常見於沒有套件管理器生態系的大型 C/C++ 專案）附上可與 NVD 比對的 `cpe:2.3`，讓支援 CPE 的引擎也能找到它們僅存在於 NVD 的 CVE；不在人工整理清單裡的一律不附 CPE（AI SBOM 會略過） |
| `ENRICH_INTERPRETER_CPE` | — | `true` | 為一小批經人工驗證的解譯器元件（例如以 conda 或 NuGet 產出物形式散布的 Python）附上可與 NVD 比對的 `cpe:2.3`，讓支援 CPE 的引擎也能找到它們僅存在於 NVD 的 CVE；不在人工整理清單裡的一律不附 CPE（AI SBOM 會略過） |
| `SECURITY_NVD_VERIFY` | — | `false` | 搭配 `--deep-cve` 使用：把 grype 的每一筆 `nvd:cpe` 結果與即時的 NVD 版本範圍核對，濾掉範圍外的誤判（需要 `NVD_API_KEY` 與網路連線，會多花幾分鐘）。預設關閉——結果會保留下來，並標示為版本未驗證 |
| `NVD_API_KEY` | `SECURITY_NVD_VERIFY` 需要時 | — | deep-cve 版本篩選所使用的 NVD API 金鑰；只以名稱傳入容器（絕不會直接寫進指令中） |
| `ENRICH_EOL` | — | `true` | 依內建的離線快照，標記已終止支援（超過上游 end-of-life）的元件（AI SBOM 會略過） |
| `ENRICH_MALICIOUS` | — | `true` | 依內建的離線 OSV 快照，標記已知的惡意套件（名稱仿冒、帳號被劫持）。這是與弱點不同的訊號：應對方式是移除並輪替認證資訊，而不是升級版本 |
| `ENRICH_OS_CONTEXT` | — | `true` | 從發行版套件的 PURL（rpm、deb 與 apk）合成出一個 `operating-system` 元件。Trivy 會依這個元件挑選發行版的弱點資料來源，少了它，供應者 SBOM 或 rootfs 掃描裡的 OS 套件就完全比對不到 OS 的 CVE。SBOM 裡沒有可辨識的發行版套件時不會有任何作用——包含 Trivy 沒有提供資料來源的發行版，例如 OpenWRT（AI SBOM 會略過） |
| `STALENESS_ENRICH` | — | `false` | 加入 deps.dev 的版本新舊資訊（落後最新版幾個發行版本）；需要網路連線 |
| `ENRICH_HF_SECURITY` | — | `true` | AIBOM 模式：把 HuggingFace 逐檔的安全掃描結果 (ClamAV + picklescan) 讀進 ML-BOM。只讀取後設資料，不下載檔案 |
| `API_KEY`、`API_URL` | 上傳時 | — | 上傳用的認證資訊與伺服器 URL。DT 用作 `X-Api-Key`，TRUSCA 用作 Bearer 權杖 |
| `UPLOAD_TARGET` | — | `dependency-track` | 上傳目的地：`dependency-track`（DT 相容）或 `trusca`（原生 ingest，不與 DT 相容） |
| `TRUSCA_PROJECT_ID` | 目標為 `trusca` 時 | — | 要上傳的 TRUSCA project id (UUID)。必須事先存在（不會自動建立） |
| `TRUSCA_REF` | — | `main` | ingest 的 ref 標籤 |
| `TRUSCA_RELEASE` | — | `PROJECT_VERSION` | ingest 的 release 標籤 |
| `BOMLENS_MAVEN_FULL_GRAPH` | — | — | Maven 原始碼掃描：設為 `1` 時保留完整的解析關係圖，不篩選成 compile/runtime 範圍 |
| `BOMLENS_NODE_FULL_GRAPH` | — | — | Node.js 原始碼掃描：設為 `1` 時保留 dev 與 production 合併的完整關係圖，而不是只取 production 的集合 |
| `BOMLENS_KEEP_BUILD_OUTPUT` | — | — | 原始碼掃描：設為 `1` 時保留解析出的相依樹。預設情況下，掃描會還原解析器改寫過的檔案（`go.mod`、`go.sum`、`Cargo.lock`、`Gemfile.lock`、`Package.resolved`），並移除它們建立的建置目錄，讓被掃描的專案回到原樣 |
| `CYCLONEDX_SPEC_VERSIONS` | — | `1.3 1.4 1.5 1.6` | 符合性檢查所接受的 CycloneDX 規格版本（以空白分隔）；會覆寫預設範圍 |
| `AI_CYCLONEDX_SPEC_VERSIONS` | — | `1.3 1.4 1.5 1.6 1.7` | AI SBOM (ML-BOM) 所接受的 CycloneDX 版本，額外允許 1.7 |
| `SPDX_SPEC_VERSIONS` | — | `SPDX-2.2 SPDX-2.3` | 符合性檢查所接受的 SPDX 規格版本 |

> TRUSCA（前身為 TrustedOSS Portal）的原生 ingest 端點（`POST /v1/projects/{id}/sbom-ingest`，Bearer 驗證）並不與 Dependency-Track 相容。要推送到一般的 Dependency-Track 伺服器時，請保持 `UPLOAD_TARGET=dependency-track`（預設值）。

CLI 旗標與環境變數的完整對應，請看[架構](../concepts/architecture.md)裡的旗標對應表。

## 建置與發佈映像檔

要自行建置映像檔，或為多個平台發佈，流程寫在給貢獻者看的 [docker/README](https://github.com/sktelecom/bomlens/blob/main/docker/README.md)。

---

> **相關文件**：[快速開始](../start/first-scan.md) | [CLI 參考](../reference/cli.md) | [架構](../concepts/architecture.md)
