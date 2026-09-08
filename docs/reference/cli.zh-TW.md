---
description: 'BomLens 的完整 CLI 選項與環境變數，包含產出物位置、映像檔版本固定與疑難排解。'
---

# CLI 參考

BomLens 的完整選項、分析模式、CI/CD 整合與疑難排解說明。

## 選項參考 {#options-reference}

```bash
./scripts/scan-sbom.sh [options]
```

> **Windows**：這裡的指令是以 macOS/Linux 為準。請從下列方式中選一種。安裝方式請看[快速開始](../start/first-scan.md)。
>
> - 把 `./scripts/scan-sbom.sh` 換成 `scripts\scan-sbom.bat`（需要 Git Bash）。
> - 在 WSL2 底下直接照原樣執行這些指令。
> - 不想用指令列的話，可以雙擊 `scripts\sbom-ui.bat`，或是下載桌面版應用程式。

| 選項 | 預設值 | 說明 |
|--------|---------|-------------|
| `--project <name>` | — | **（必要）**專案名稱 |
| `--version <version>` | — | **（必要）**專案版本 |
| `--target <target>` | 目前目錄 | 分析對象：目錄（原始碼樹，或是 OS rootfs、建置產出物的 staging 目錄）、Docker 映像檔、二進位檔案，或 `.zip`/`.tar.gz` 壓縮檔。Yocto 建置目錄會被辨識出來，此時不會走訪建置樹，而是改為分析建置發佈在 `tmp/deploy/images/` 底下的映像檔 SBOM（參考[供應者 SBOM 指南](../guides/supplier-sbom.md#yocto-images)） |
| `--git <url>` | — | 以淺層 clone（shallow）取得 git/GitHub URL 並當作原始碼分析（私有儲存庫：`GIT_TOKEN` 環境變數） |
| `--branch <ref>` | 預設分支 | `--git` 目標的分支、標籤或 commit（別名 `--ref`） |
| `--firmware` | false | 強制以韌體模式處理 `--target` 指定的檔案（opt-in 韌體映像檔） |
| `--analyze <sbom>` | — | 驗證並分析供應者 SBOM（別名 `--sbom`）。支援 CycloneDX/SPDX。與 `--target` 互斥 |
| `--model <owner/name>` | — | 透過 OWASP AIBOM Generator 為 HuggingFace 模型產生 AI SBOM（CycloneDX 1.7 ML-BOM）；使用 opt-in 的 `bomlens-aibom` 映像檔，會透過網路取得模型卡後設資料。與 `--target`/`--analyze`/`--git`/`--merge` 互斥 |
| `--model-file <path>` | — | 讀取單一 AI 模型檔案，只依檔案自身的標頭來描述它：支援 GGUF、safetensors、PyTorch（`.pt`/`.pth`/`.ckpt`）、pickle、npz、npy 與 ONNX。離線運作，不需要 HuggingFace 帳號，連從未發佈的模型也能處理。可填入的資訊依格式而異——GGUF 帶有名稱、授權條款與架構，safetensors 通常只有張量形狀；檔案沒有宣告的欄位會留空，不會用猜測值填補。傳給 `--target` 的 `.gguf`/`.safetensors`/`.pt`/… 路徑也會以這種方式讀取。與 `--target`/`--analyze`/`--git` 互斥 |
| `--license <spdx-id>` | — | 專案對外散布時採用的授權條款（例如 `Apache-2.0`）。會記錄在 SBOM 的根元件上，並用來標記條款與它衝突的相依項目。原始碼掃描無法推斷這個值——cdxgen 在 maven 與 gradle 會把根授權條款留空——因此未指定時不會產生衝突判定。SBOM 中已有的根授權條款（供應者自己宣告的值）絕不會被取代 |
| `--sbom-author <name>` | — | 產生這份 SBOM 的主體——指執行掃描的組織或個人，既不是工具，也不是撰寫軟體的一方。以不含縮寫的完整名稱記錄在 `metadata.authors`。掃描過程無從得知這個值，因此未指定時會直接省略該欄位，而不是填入佔位字串 |
| `--usage <scenario>` | — | 依模型實際的使用方式調整 AI 模型風險評估（`--model` 與 `--model-file`）：`internal`、`product`、`redistribute` 或 `outputs-only`。只有約束該情境的授權條件會決定判定結果，報告中也會註明是以哪個情境判定。未指定時會以全部條件判定 |
| `--merge <a.json> <b.json> …` | — | 把兩份以上的 CycloneDX SBOM 合併成一份，依 purl 去除重複，並將根元件標記為 `--project`/`--version`。這是選用功能——當外部系統要求每個產品只有單一 BOM 時，可用來產生伺服器 SBOM；其他情況請讓各層維持獨立（參考[伺服器 SBOM 指南](../guides/server-delivery.md)）。與 `--target`/`--analyze`/`--git` 互斥 |
| `--merge-root <file>` | — | 搭配 `--merge` 使用：保留這個輸入檔的 `specVersion` 與根元件（例如帶有模型卡的 ML-BOM CycloneDX 1.7 根元件），而不是另外寫入一個全新的 1.6 根元件。必須是 `--merge` 的輸入檔之一；保留下來的根元件會被改名為 `--project`/`--version` |
| `--generate-only` | false | 只儲存在本機，不上傳 |
| `--upload-target <target>` | `dependency-track` | 上傳目的地：`dependency-track`（DT 相容）或 `trusca`（原生 ingest） |
| `--trusca <project_id>` | — | 上傳到 TRUSCA（等同 `--upload-target trusca` 加上 project id）。需要 `API_URL` 與 Bearer `API_KEY` |
| `--notice` | （預設開啟） | 產生開放原始碼授權聲明（NOTICE，txt+html） |
| `--security` | （預設開啟） | 產生 Trivy 安全報告（json+md+html），包含 CVSS、EPSS 與 CISA KEV 優先順序訊號 |
| `--spdx` | false | 額外把 SBOM 匯出為 SPDX 2.3 JSON（`_bom.spdx.json`），內容由最終的 CycloneDX 輸出轉換而來 |
| `--all` | — | `--notice --security --spdx` |
| `--no-report` | false | 略過開放原始碼風險分析報告（見下文） |
| `--lang <en\|ko\|zh-TW>` | `en` | 給人閱讀的符合性報告與 AI 合規概況報告（`.md`/`.html`）所使用的語言。SBOM 與 JSON 報告不受此設定影響，一律維持英文 |
| `--deep-license` | false | 以 scancode 進行精確的授權條款偵測（opt-in 映像檔） |
| `--deep-cve` | false | 透過 grype 的 NVD CPE 比對器再加一輪 CVE 比對（opt-in `bomlens-deep-cve` 映像檔，會自動下載）。可補回 Trivy 漏掉的 NVD 專有 CVE，這類 CVE 大多出現在較舊的 Maven 函式庫，因為 BomLens 只為 Maven 元件附上可與 NVD 比對的 CPE；會一併開啟 `--security`。未與即時 NVD 版本範圍核對過的結果，會在報告中標示為版本未驗證——參考[深度 CVE 比對指南](../guides/reports.md) |
| `--identify-vendored` | false | 識別被複製納入（vendored）到沒有套件管理器的 C/C++ 原始碼裡的開放原始碼。會把檔案指紋與 OSSKB 服務比對（已包含在發佈的映像檔中；傳送的是雜湊值，不是原始碼）。參考[識別內含的開放原始碼指南](../guides/identify-vendored.md) |
| `--byte-stable` | false | 決定性（可重現）的 SBOM 輸出 |
| `--sign` | false | cosign 簽章（需要 `COSIGN_KEY`） |
| `--output-dir <dir>` | 目前目錄 | 產出物的基準目錄（別名 `-o`）。每次掃描都會落在它底下的 `{Project}_{Version}/` 子資料夾，讓同一次執行的檔案集中在一起，也不會散落到原始碼樹裡 |
| `--timestamp` | false | 在執行的子資料夾名稱後面加上 `_YYYYMMDD-HHMMSS`，讓同一個專案與版本重複掃描時能並存保留，而不是被覆寫。只影響資料夾名稱，SBOM 的位元組內容不變 |
| `--ui` | — | 啟動本機網頁介面 |
| `--mount <dir>` | — | 搭配 `--ui` 使用：把額外的主機目錄開放給網頁介面，作為**目錄路徑**輸入欄的唯讀掃描目標（可重複指定）。這讓介面能掃描啟動資料夾以外的 OS 樹，包括用 `--mount /` 掃描正在執行的主機 OS。結果仍然存放在啟動資料夾底下 |
| `--help` | — | 印出說明 |

環境變數可以調整行為。

| 環境變數 | 預設值 | 說明 |
|----------|---------|-------------|
| `SBOM_SCANNER_IMAGE` | `ghcr.io/sktelecom/bomlens:latest` | 覆寫掃描器映像檔 |
| `SBOM_FIRMWARE_IMAGE` | `ghcr.io/sktelecom/bomlens-firmware:latest` | 韌體分析所使用的映像檔 |
| `SBOM_AIBOM_IMAGE` | `ghcr.io/sktelecom/bomlens-aibom:latest` | 產生 AI 模型（ML-BOM）時所使用的映像檔 |
| `SBOM_DEEP_CVE_IMAGE` | `ghcr.io/sktelecom/bomlens-deep-cve:latest` | `--deep-cve`（grype CPE 比對）所使用的映像檔，網頁介面中同一個開關也會用它 |
| `SBOM_OUTPUT_FLAT` | — | 設為 `1` 時，產出物會平鋪寫在輸出基準目錄，不建立每次執行的子資料夾（隔離之前的舊配置，供仍預期舊路徑的 CI 使用） |
| `SBOM_OUTPUT_DIR` | `~/sbom-output` | 桌面版應用程式與網頁介面的輸出基準目錄（CLI 則改用 `--output-dir`）。每次掃描同樣會落在它底下的 `{Project}_{Version}/` 子資料夾 |
| `SBOM_UI_MOUNT_DIR` | — | 給不接受 CLI 參數的 Windows 啟動程式 `sbom-ui.bat` 使用：一個要開放給網頁介面、作為唯讀的目錄路徑掃描目標的額外資料夾（`--ui --mount` 的雙擊版對應做法）。請使用不含 `& ^ | < >` 的路徑——啟動程式遇到這些字元會直接拒絕，而不是把錯亂的掛載交給 Docker |
| `SBOM_LANG` | 系統語系 | `en` 或 `ko`，用於 Windows 啟動程式與桌面版應用程式。不是韓文的設定值一律顯示英文 |
| `SBOM_PULL` | `missing` | Windows 啟動程式的下載行為。`missing` 只在映像檔不存在時下載，`always` 每次執行都重新檢查 registry（可取得較新的 `:latest`），`never` 完全不碰網路 |
| `SBOM_IMAGE_TAR` | — | 由 `docker save` 產生的映像檔 tar 路徑。Windows 啟動程式會載入它，而不是從網路 pull；放在指令碼旁邊、檔名為 `bomlens-image.tar` 的檔案會被自動採用。搭配 `SBOM_PULL=never` 就能做到完全離線安裝 |
| `CVE_BIN_TOOL_MODE` | `auto` | 韌體的 CVE 比對方式。`auto` 在內建 CVE 資料庫存在時使用它，否則在網路可連線時從 NVD 下載。`offline` 只與內建資料庫比對。`online` 一律從網路更新。`components-only` 略過 CVE 比對，只產生僅含元件的 SBOM |
| `CVE_BIN_TOOL_HOME` | `/opt/cve-bin-tool-home` | 內建的 cve-bin-tool CVE 資料庫位置。cve-bin-tool 會讀取 `$CVE_BIN_TOOL_HOME/.cache/cve-bin-tool/cve.db`（它的快取是以 `HOME` 為索引） |
| `CVE_BIN_TOOL_DISABLE_SOURCES` | `GAD` | 韌體掃描時要停用的 cve-bin-tool 資料來源。`GAD`（GitLab Advisory）預設停用，因為它在抓取資料時會讓內建的 cve-bin-tool 當掉 |
| `SCANOSS_API_URL` | OSSKB 免費 API | `--identify-vendored` 使用的端點。在封閉網路或大量使用的情境下，可指向 SCANOSS 的商業或自架端點 |
| `SCANOSS_API_KEY` | — | `SCANOSS_API_URL` 需要時所使用的認證資訊 |
| `SCANOSS_MIN_FILES` | `2` | 一個函式庫要被列出所需的最少相符檔案數，用來濾掉一次性的下游 fork 雜訊。設為 `1` 就會保留所有僅單一檔案相符的結果 |
| `GIT_TOKEN` | — | clone 私有 git 儲存庫所使用的權杖 |
| `HF_TOKEN` | — | `--model` 以及 AI SBOM 分析期間查詢資料集後設資料所使用的 HuggingFace 讀取權杖。私有或受管制（gated）的儲存庫必須提供，這也是在發佈模型之前先檢視它的做法。`HUGGING_FACE_HUB_TOKEN` 也可以當作別名使用 |
| `ENRICH_HF_SECURITY` | `true` | 在 `--model` 掃描中讀取 HuggingFace 自己執行的檔案安全掃描結果（逐檔的 ClamAV 與 picklescan），並記錄到 ML-BOM 裡。只讀取後設資料，不下載檔案。設為 `false` 可略過這項查詢 |
| `COSIGN_KEY` | — | `--sign` 所使用的簽章金鑰路徑 |
| `FETCH_LICENSE` | `true` | 在原始碼掃描期間解析相依項目的授權條款。設為 `false` 可略過查詢，執行得更快 |
| `PROJECT_LICENSE` | — | 與 `--license` 相同。以 SPDX 識別碼指定專案對外散布時採用的授權條款。它會決定 `bomlens:licenseConflict` 的判定，以及風險報告的衝突章節 |
| `SBOM_AUTHOR` | — | 與 `--sbom-author` 相同。產生這份 SBOM 的主體，記錄在 `metadata.authors` |
| `SECURITY_ENRICH` | `true` | 為安全報告補上 EPSS 與 CISA KEV 訊號。在封閉網路可設為 `false`，略過對外查詢 |
| `SECURITY_NVD_VERIFY` | `false` | 搭配 `--deep-cve` 使用：把 grype 的每一筆 `nvd:cpe` 結果與即時的 NVD 版本範圍核對，濾掉範圍外的誤判（需要 `NVD_API_KEY` 與網路連線，會多花幾分鐘）。預設關閉——結果會保留下來，並標示為版本未驗證 |
| `NVD_API_KEY` | — | `SECURITY_NVD_VERIFY` 使用的 NVD API 金鑰。只以名稱傳入容器，絕不會直接寫進指令中 |
| `API_URL` | — | 上傳伺服器的 URL（DT 伺服器，或 TRUSCA 的基準網址） |
| `API_KEY` | — | 上傳用的認證資訊。在 DT 用作 `X-Api-Key`，在 TRUSCA 用作 Bearer 權杖 |
| `UPLOAD_TARGET` | `dependency-track` | 上傳目的地：`dependency-track` 或 `trusca` |
| `TRUSCA_PROJECT_ID` | — | TRUSCA 的 project id（UUID）。目標為 `trusca` 時必填 |
| `TRUSCA_REF` | `main` | ingest 的 ref 標籤 |
| `TRUSCA_RELEASE` | `--version` 的值 | ingest 的 release 標籤 |

在 Windows 上，於命令提示字元設定的環境變數不會延續到雙擊執行。 因此啟動程式也會從純文字檔讀取 `UI_PORT`、`SBOM_LANG`、 `SBOM_PULL`、`SBOM_IMAGE_TAR`、`SBOM_SCANNER_IMAGE`、`SBOM_OUTPUT_DIR` 與 `SBOM_UI_MOUNT_DIR`：把 `scripts/bomlens.settings.example.txt` 複製到指令碼旁邊並命名為 `bomlens.settings.txt`（或放到 `%USERPROFILE%\.bomlens\settings.txt`）。 真正的環境變數一律優先於這個檔案。

輸出旗標的細節請看[產生報告指南](../guides/reports.md)；收到供應者 SBOM 後的驗證方式請看[供應者 SBOM 驗證](../guides/supplier-sbom.md)。

## 產出物存放位置 {#where-outputs-go}

每次掃描都隔離在自己的 `{Project}_{Version}/` 子資料夾裡，因此同一次執行產生的檔案會集中在一起，CLI 也絕不會弄亂它所掃描的原始碼樹。這個子資料夾會建立在某個基準目錄底下：

- **CLI**（`scan-sbom.sh`）：基準目錄就是你執行指令時所在的目錄。可用 `--output-dir <dir>`（別名 `-o`）覆寫。
- **桌面版應用程式與網頁介面**：基準目錄是 `~/sbom-output`（Windows 上是 `C:\Users\<you>\sbom-output`）。可用 `SBOM_OUTPUT_DIR` 環境變數覆寫。

使用 `--git` 或壓縮檔輸入時，clone 與解壓縮都在暫存目錄裡進行，結束時會清除，最後只留下輸出的子資料夾。

重新掃描同一個專案與版本時，預設會覆寫它的子資料夾，只保留最新結果。想改成每次執行都保留，就加上 `--timestamp`：它會在資料夾名稱後面加上 `_YYYYMMDD-HHMMSS`，例如 `MyApp_1.0.0_20260626-143000/`。這個旗標只改資料夾名稱，不動 SBOM 的檔名與位元組內容，所以可以和 `--byte-stable` 一起使用。

想恢復先前的平鋪配置，也就是所有檔案直接寫在基準目錄、不建立每次執行的子資料夾，請設定 `SBOM_OUTPUT_FLAT=1`。這是給仍然預期舊路徑的 CI 使用的。

## 固定掃描器映像檔版本

用 `SBOM_SCANNER_IMAGE` 覆寫掃描器映像檔。

```bash
SBOM_SCANNER_IMAGE="ghcr.io/sktelecom/bomlens:1.8.0" \
  ./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --generate-only
```

## 疑難排解 {#troubleshooting}

### Windows：看不到任何產出物

掃描結束了卻找不到輸出檔案時，請確認你執行指令的資料夾位在 Docker 的檔案共享路徑內。家目錄（`C:\Users\...`）底下的路徑在 Rancher Desktop 與 Docker Desktop 都預設共享。在未共享的位置執行時，容器無法把結果寫回主機。

### Docker 權限錯誤（Linux/WSL2）

```
Got permission denied while trying to connect to the Docker daemon
```

在使用 Rancher Desktop 或 Docker Desktop 的 Windows/macOS 上不會遇到這個問題。請把你的使用者加入 `docker` 群組。

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 磁碟空間不足

```
no space left on device
```

清理 Docker 快取。在終端機執行：

```bash
docker system prune -f
```

使用 Rancher Desktop 或 Docker Desktop 的話，也可以在應用程式本身的偏好設定（Preferences）畫面做同樣的清理。

### 其他問題

1. 用 `VERBOSE=true ./tests/test-scan.sh` 查看詳細日誌。
2. 更新 Docker 映像檔：`docker pull ghcr.io/sktelecom/bomlens:latest`。
3. 如果仍然失敗，請附上你的環境資訊與日誌，開一則 [GitHub Issue](https://github.com/sktelecom/bomlens/issues)。

各模式的使用方式請看[依輸入類型的指南](../guides/by-input.md)；產出物的種類請看[產出物參考](artifacts.md)；程式語言偵測請看[支援的生態系](ecosystems.md)。
