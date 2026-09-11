# 第三方授權條款

> **English**: [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)

BomLens (Apache-2.0) 自身的程式碼寫成 shell 指令碼，並把數個開放原始碼工具打包進 Docker 映像檔，用來產生與分析 SBOM。本文件是這些內附工具的授權清單，以及隨之而來的散布義務。

## 合規要點

- BomLens 的 shell 指令碼是以獨立行程 (exec) 呼叫內附工具，並未修改工具的原始碼。因此 GPL 與 AGPL 工具的 copyleft 不會傳播到 BomLens 的 Apache-2.0 程式碼（依 FSF 的見解：管線、CLI 呼叫與 exec 構成各自獨立的程式，打包進容器屬於 mere aggregation）。
- 工具的二進位檔仍然隨映像檔一起再次散布，因此我們提供授權條款全文，GPL 工具還額外提供對應原始碼的取得途徑。SPDX 授權條款全文（Apache-2.0、MIT、GPL-2.0、GPL-3.0 等）隨映像檔放在 `/usr/local/lib/sbom/licenses/`，各工具的原始碼可從下方表格的 Source URL 取得。
- BomLens 自身的使用條款會隨每一份散布物一起提供。在映像檔中位於 `/usr/local/lib/sbom/notices/`，內含 `LICENSE`、`NOTICE` 與本文件；在發行壓縮包中位於解開後的最上層；在桌面版安裝檔中則位於應用程式的資源資料夾。您再次散布映像檔或壓縮包時一併轉交這些檔案，就是 Apache-2.0 §4 所要求的做法。
- 未收錄任何以 AGPL 授權的工具。因此即使執行網頁介面 (`--ui`)，也不會觸發 AGPL §13 的網路條款。
- 以 GPL 授權的分析工具只存在於另一個獨立的選用映像檔 (`bomlens-firmware`)。安裝進基礎映像檔 (`bomlens`) 以及其他選用映像檔（`bomlens-aibom`、`bomlens-deep-cve`）的工具都是 permissive 授權。
- 每一個映像檔（包含基礎映像檔）都建置在 `python:3.12-slim` 之上，因此也含有以 GPL、LGPL 與其他授權條款釋出的 Debian 系統套件。這是任何 Linux 基礎映像檔的固有性質，沒有不含 GPL 的選擇。這代表什麼、原始碼從哪裡取得，請看下方的[所有映像檔的 Debian 套件](#debian-packages-in-every-image)。

## 基礎映像檔——`ghcr.io/sktelecom/bomlens`（BomLens 安裝的工具；Debian 基底另見下方）

| 工具 | 用途 | 授權條款 (SPDX) | Source |
|------|---------|----------------|--------|
| cdxgen（官方語言映像檔） | 從原始碼產生 SBOM | Apache-2.0 | https://github.com/CycloneDX/cdxgen |
| syft | 映像檔、二進位檔與目錄的 SBOM | Apache-2.0 | https://github.com/anchore/syft |
| Trivy | 安全弱點掃描 | Apache-2.0 | https://github.com/aquasecurity/trivy |
| trivy-db | 弱點資料庫 | Apache-2.0 | https://github.com/aquasecurity/trivy-db |
| cosign | SBOM 簽章 | Apache-2.0 | https://github.com/sigstore/cosign |
| scancode-toolkit | 精細的授權條款檢出。建置時選用 (`SBOM_DEEP_LICENSE=true`)；**發行的映像檔並未收錄**，發行版是以預設值 `false` 建置 | Apache-2.0（資料集部分為 CC-BY-4.0 等） | https://github.com/aboutcode-org/scancode-toolkit |
| scanoss (scanoss.py) | 已複製納入的開放原始碼識別（預設內附；要停用請設 `SBOM_SCANOSS=false`） | MIT（內附的 `osadl-copyleft.json` 資料集為 CC-BY-4.0） | https://github.com/scanoss/scanoss.py |
| owasp-aibom-generator | 產生 AI 模型 SBOM（選用 `SBOM_AIBOM`，獨立映像檔 `bomlens-aibom`；會呼叫 HuggingFace API） | Apache-2.0 | https://github.com/GenAI-Security-Project/aibom-generator |
| picklescan | 對掃描到的 AI 模型檔案做 pickle 分析——判斷載入權重時是否會執行程式碼（一律安裝；純 Python，不連網） | MIT | https://github.com/mmaitre314/picklescan |
| jq | SBOM 後處理輔助工具 | MIT（部分元件為 BSD、ICU 或 Lucent） | https://github.com/jqlang/jq |

資料：弱點資料來源 NVD 屬於 public domain，並要求標示「NIST/NVD」出處。

### 內附的資料快照

有兩份資料集在映像檔建置時抓取一次，並隨基礎映像檔一起收錄，讓讀取它們的離線檢查在掃描時不需要網路。抓取資料的建置指令碼在建置完成後就從映像檔中刪除，因此把出處記錄在這裡。

| 資料 | 映像檔內路徑 | 出處 | 授權條款 |
|------|-----------|--------|---------|
| 已終止支援日期 | `/usr/local/lib/sbom/eol-data.json`, `eol-purl-map.json` | [endoflife.date](https://endoflife.date)，從它的公開 API 讀取 | MIT |
| 惡意套件安全公告 | `/usr/local/lib/sbom/malicious-index.json` | OSV 批次封存檔 (`osv-vulnerabilities.storage.googleapis.com`)。其中所帶的 `MAL-` 紀錄由 OpenSSF Package Analysis 專案發佈於 [ossf/malicious-packages](https://github.com/ossf/malicious-packages) | Apache-2.0（上游公告儲存庫） |

兩份資料集都不是原樣完整複製，而是各自縮減到檢查實際會讀取的部分——某個產品的已終止支援日期，或是一個 PURL 對應到它的公告識別碼——快照日期也隨之記錄，既寫在內附檔案裡，也標在檢查所標記的每一個元件上（`bomlens:eol:source`、`bomlens:malicious:source`）。這兩個專案都不為 BomLens 背書或認證，內附資料以現狀提供。

韌體映像檔中的 CPE 適用性索引不是來自上述兩者，而是來自 NVD，其出處標示與聲明以 `CVE-DATA-NOTICE.txt` 隨該映像檔一起提供。

### 網頁介面的 npm 套件

網頁介面 (`--ui`) 是一個 React 單頁應用程式。npm 套件的程式碼會編譯進建置產出，而該產出會隨基礎映像檔與桌面版安裝檔一起再次散布，因此 MIT 與 ISC 所要求的著作權與許可聲明必須隨之提供。

正式記錄是建置時產生的 `third-party-licenses.txt`。它只列出實際進入打包結果的套件，並完整重現每一個套件的授權條款全文。在網頁介面中可從 `/third-party-licenses.txt` 開啟；在映像檔內則位於 `/usr/local/lib/sbom-web/dist/third-party-licenses.txt`。它取自打包後的模組關係圖，而不是 `package.json` 的宣告，因為兩者並不一致：只在建置時使用的宣告相依項目（tailwindcss、typescript）不會進入散布物，而一個套件也可能被宣告並安裝了，卻因為沒有任何地方匯入它而從打包結果中被剔除。

目前進入打包結果的 23 個套件如下。全部都是 permissive 授權，沒有任何 copyleft。

| 套件 | 用途 | 授權條款 (SPDX) |
|---------|---------|----------------|
| react, react-dom, scheduler | 使用者介面渲染 | MIT |
| @radix-ui/react-label, react-progress, react-slot, react-primitive, react-context, react-compose-refs | 具無障礙支援的基本元件 | MIT |
| cytoscape, cytoscape-dagre, dagre, graphlib, lodash | 相依關係圖的繪製與版面配置 | MIT |
| i18next, react-i18next, i18next-browser-languagedetector | 英文、韓文與正體中文切換 | MIT |
| class-variance-authority | 元件變體定義 | Apache-2.0 |
| clsx, tailwind-merge | 類別名稱組合 | MIT |
| lucide-react | 圖示 | ISC |
| highlight.js | 原始碼檢視器的語法高亮（文法按需載入） | BSD-3-Clause |
| @fontsource/inter, @fontsource/jetbrains-mono, @fontsource/noto-sans-tc, pretendard | 字型（見下一節） | OFL-1.1 |

`npm run notices:check` 會檢查產生出來的檔案，避免這份清單過時。只要有內附套件未宣告授權條款、找不到可重現的授權條款全文，或出現任何 copyleft 授權，CI 就會失敗。

### 網頁介面元件（改寫自 shadcn/ui）

shadcn/ui 不是安裝來用的程式庫，它的元件程式碼是複製到專案裡的。因此即使程式碼就在本儲存庫中，它也不會出現在 npm 相依項目清單裡。`docker/web/frontend/src/components/ui/` 底下的下列七個檔案，是把 shadcn/ui 的元件改寫成符合我們的設計 token 與無障礙需求的版本。

| 檔案 | 原始出處 |
|-------|--------|
| `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `progress.tsx`, `tabs.tsx` | shadcn/ui (MIT, Copyright (c) 2023 shadcn), https://github.com/shadcn-ui/ui |

這七個檔案都在上游的 MIT 聲明旁附上我們自己的著作權標示，並且各自標記為 `SPDX-License-Identifier: Apache-2.0 AND MIT`。MIT 全文隨映像檔放在 `/usr/local/lib/sbom/licenses/MIT.txt`。

同一個目錄下的 `barlist.tsx`、`select.tsx`、`state.tsx` 與 `switch.tsx` 是在這裡自行撰寫的，只採用 Apache-2.0。`switch.tsx` 沿用 shadcn/ui 的視覺比例（軌道與滑鈕的尺寸），但實作另外以原生 checkbox 完成。

### 網頁介面的字型

網頁介面 (`--ui`) 內附四種字型，用來維持排版一致，以及支援離線與桌面版 (Electron) 運作。字型檔 (woff2) 在建置時編譯進網頁 SPA，並隨基礎映像檔一起散布；不會呼叫任何外部字型 CDN。

| 字型 | 用途 | 授權條款 (SPDX) | Source |
|------|---------|----------------|--------|
| Inter | 內文與介面字體（拉丁字母） | OFL-1.1 | https://github.com/rsms/inter |
| JetBrains Mono | 程式碼與等寬字體 | OFL-1.1 | https://github.com/JetBrains/JetBrainsMono |
| Pretendard | 內文與介面字體（韓文） | OFL-1.1 | https://github.com/orioncactus/pretendard |
| Noto Sans TC | 內文與介面字體（正體中文） | OFL-1.1 | https://github.com/notofonts/noto-cjk |

SIL Open Font License 1.1 要求標示出處，而這些字型都是未經修改原樣內附：

- Inter: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)
- JetBrains Mono: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)
- Pretendard: Copyright 2021 Kil Hyung-jin (https://github.com/orioncactus/pretendard), with Reserved Font Name 'Pretendard'. Includes Source Sans Pro: Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'.
- Noto Sans TC: Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Noto'.

OFL-1.1 全文可在 Source 欄所列的各儲存庫中以 `OFL.txt` 取得。Pretendard 的 npm 套件本身未附授權條款檔案，因此它的全文收在本儲存庫的 `docker/web/frontend/licenses/pretendard.txt`，也一併重現在網頁介面所產生的 `third-party-licenses.txt` 中。

### 已複製納入的開放原始碼識別與 OSSKB API（選用）

`--identify-vendored` 只內附 `scanoss.py` 用戶端 (MIT)。該用戶端是預設建置的一部分；要排除它，請以 `docker build --build-arg SBOM_SCANOSS=false` 建置。實際執行比對的 SCANOSS Engine (GPL-2.0) **並未**收錄——改為呼叫託管的 OSSKB API (`api.osskb.org`)。這也是它與韌體映像檔中的 GPL 工具不同、可以放在基礎映像檔裡的原因 (MIT)。內附的 `osadl-copyleft.json` 資料集是 CC-BY-4.0 資料而不是程式碼，只要求標示出處。

使用 OSSKB API（由 Software Transparency Foundation 營運）附帶以下條款：

- 離開機器的是**檔案指紋（雜湊值）**，不是原始碼。
- 回傳的資料**只能用於軟體識別**；**禁止**再散布 OSSKB 資料或把它快取成另一個資料庫。BomLens 只會把結果輸出成該次掃描的 SBOM 元件，仍在這個範圍之內。
- 這項服務免費、盡力而為，並且有**用量限制**。確切的限額並未公開，依條款屬服務方的裁量事項（原文："STF may limit the number or frequency of transactions per user through the OSSKB"）。掃描會逐一查詢每個檔案的指紋，因此反覆掃描龐大的原始碼樹會被限流——這是給一次性識別用的。若要大量、反覆或全公司範圍地使用，以及在對外連線受阻的環境中使用，請把 `SCANOSS_API_URL` 與 `SCANOSS_API_KEY` 指向 SCANOSS 的商業服務或自行架設的端點。
- 結果是以需人工檢視的識別線索形式提供；不保證準確度。
- 條款：https://www.softwaretransparency.org/terms

## 韌體映像檔——`ghcr.io/sktelecom/bomlens-firmware`（含 GPL，選用）

這是一個獨立的選用映像檔，把笨重的解包與二進位分析工具連同它們的 GPL 元件隔離出來。 建置：`docker build --build-arg SBOM_FIRMWARE=true -t bomlens-firmware ./docker`。

下列版本與 `docker/Dockerfile` 中的建置 ARG 預設值一致（為供應鏈衛生而釘住；可透過 ARG 覆寫）。

| 工具 | 釘住的版本 (ARG) | 用途 | 授權條款 (SPDX) | Copyleft | Source |
|------|----------------------|---------|----------------|----------|--------|
| unblob | 26.3.30 (`UNBLOB_VERSION`) | 主要的韌體解包工具 | MIT | permissive | https://github.com/onekey-sec/unblob |
| cve-bin-tool | 3.4 (`CVE_BIN_TOOL_VERSION`) | 識別 stripped 二進位檔及其 CVE | **GPL-3.0** | strong | https://github.com/intel/cve-bin-tool |
| ubi_reader | 0.8.14 (`UBI_READER_VERSION`) | UBI 與 UBIFS 擷取 | **GPL-3.0** | strong | https://github.com/onekey-sec/ubi_reader |
| sasquatch | `sasquatch-v4.5.1-6` (`SASQUATCH_VERSION`) | 讀取標準 unsquashfs 拒絕處理的廠商 squashfs 變體 | GPL-2.0 | strong | https://github.com/onekey-sec/sasquatch |
| jefferson | 0.4.7 (pip，由 unblob 一併帶入) | JFFS2 擷取 | MIT | permissive | https://github.com/onekey-sec/jefferson |

疊在其上的 Debian 套件，版本是在發行的映像檔中實測的值：

| 套件 | 版本 | 用途 | 授權條款 (SPDX) |
|---------|---------|---------|----------------|
| squashfs-tools (unsquashfs) | 1:4.6.1-1 | 標準 squashfs 擷取的後備 | GPL-2.0+ |
| binutils | 2.44-3 | ELF 元件識別階段所用的 `readelf` | GPL-3.0+ |
| e2fsprogs | 1.47.2-3+b11 | ext 檔案系統擷取 | GPL-2.0 |
| cpio | 2.15+dfsg-2 | 封存檔擷取 | GPL-3.0+ |
| cabextract | 1.11-2 | Windows 安裝檔容器擷取 | GPL-2.0+ |
| lzop, lz4, liblzo2-2 | 1.04-2, 1.10.0-4, 2.10-3+b1 | 解包工具呼叫的壓縮編解碼器 | GPL-2.0+ |
| p7zip / 7zip, unar | （apt 散布版本） | 7z 與廠商容器格式 | LGPL-2.1+ 與其他 |

這些套件的對應原始碼都是 Debian 原始碼套件；請看[所有映像檔的 Debian 套件](#debian-packages-in-every-image)。

`scan-firmware.sh` 的解包順序是先 unblob，接著對 `file` 判定為 squashfs 的檔案使用 unsquashfs，然後是 Windows 交付物所在的容器格式需要的 7z，最後是 binwalk。第二輪會處理那些被切出來但沒有解開的檔案系統映像檔，依序嘗試 unsquashfs 與 sasquatch。

### 未安裝進映像檔的後備工具

- binwalk：PyPI 上的 `binwalk` 2.x 散布版是壞的（缺少 `binwalk.core`），因此沒有安裝進映像檔。`scan-firmware.sh` 會把 PATH 上可用的 `binwalk` 當成最後的後備，但標準 squashfs 在前一步就已由 unsquashfs 處理掉了。

### 韌體工具的 GPL 原始碼

韌體映像檔中的每一個 GPL 工具，都是從公開儲存庫或套件登錄以釘住的版本取得。**GPL 授權條款全文（GPL-2.0、GPL-3.0）隨映像檔散布於 `/usr/local/lib/sbom/licenses/`。**與映像檔中所安裝版本完全相同的原始碼，可從上表 Source URL 的對應標籤或發行版取得，而韌體映像檔也在 `com.sktelecom.sbom.gpl-source-offer` 標籤中記載本文件的位置。

不是從釘住的上游發行版、而是從 Debian 套件安裝的工具——squashfs-tools、e2fsprogs、p7zip、unar、cpio、cabextract 等——由下方的[所有映像檔的 Debian 套件](#debian-packages-in-every-image)涵蓋，因為對 Debian 二進位檔而言，對應原始碼是 Debian 原始碼套件，而不是上游標籤。

## deep-cve 映像檔——`ghcr.io/sktelecom/bomlens-deep-cve`（permissive，選用）

這是給 `--deep-cve` 使用的獨立選用映像檔。它用 grype 的 CPE 比對器，找出 Trivy 漏掉、只存在於 NVD 的 Maven CVE。弱點資料庫很大（約 1.8 GB），因此不放進基礎映像檔，需要時才下載。 建置：`docker build --build-arg SBOM_DEEP_CVE=true -t bomlens-deep-cve ./docker`。

下列版本與 `docker/Dockerfile` 中的建置 ARG 預設值一致（已釘住；可透過 ARG 覆寫）。

| 工具 | 釘住的版本 (ARG) | 用途 | 授權條款 (SPDX) | Copyleft | Source |
|------|----------------------|---------|----------------|----------|--------|
| grype | v0.112.0 (`GRYPE_VERSION`) | 以 CPE 為基礎的 NVD CVE 比對 | Apache-2.0 | permissive | https://github.com/anchore/grype |

資料：建置時烘進映像檔的 grype 弱點資料庫，由 Anchore 匯整公開的弱點來源而成——NVD (public domain)、GitHub Security Advisories (CC-BY-4.0)，以及各發行版的安全資料庫（各自適用自己的條款）。這個資料庫以 `GRYPE_DB_AUTO_UPDATE=false` 釘住，因此掃描期間不會用到網路。

## Android SDK 映像檔——由您自行建置，不對外發行

cdxgen 沒有發行內含 Android SDK 的映像檔，並把 Android 標記為不支援間接相依，因此 Android 專案無法直接交給它處理。`docker/android/Dockerfile` 在 cdxgen 的 java 映像檔之上加裝 Android SDK 平台，每一個 `compileSdk` 對應一個映像檔。

**我們不發行這個映像檔。** Android SDK 不是開放原始碼，它的條款只允許為備份而複製，並且禁止再散布，除非第三方授權另有要求（[§3.4](https://developer.android.com/studio/terms)；§3.5 把該例外限縮在 SDK 的開放原始碼元件上）。把這個映像檔放上公開登錄，等於把 SDK 交給每一個下載它的人，而那正是該條款所指的行為。因此改由每位使用者自行建置一次，並像安裝 Android Studio 那樣直接接受 Google 的條款：

```bash
docker build --build-arg ANDROID_API=35 -t bomlens-android-sdk35 docker/android
```

`scan-sbom.sh` 會偵測專案的 `compileSdk`，並在找不到對應映像檔時印出上面這個指令。`ANDROID_IMAGE_PREFIX` 可以把它指向在別處建置的映像檔——包括在本方針確立之前、發行到 v1.9.0 為止的 `ghcr.io/sktelecom/bomlens-android-sdk<API>` 映像檔。那些映像檔保留原處，讓已發行版本上的掃描能繼續運作；不會再推送任何新的內容上去。

這個映像檔不含 BomLens 的程式碼，因此不在我們 Apache-2.0 授權的涵蓋範圍內。它包含的是：

| 元件 | 出處 | 條款 |
|-----------|--------|-------|
| cdxgen java 映像檔（`cdxgen-temurin-java21`，以 digest 釘住） | https://github.com/CycloneDX/cdxgen | Apache-2.0 |
| Android SDK 命令列工具、platform-tools、`platforms;android-<API>`、`build-tools;<API>.0.0` | 由 `sdkmanager` 從 https://dl.google.com/android/repository/ 安裝 | Android Software Development Kit License Agreement, https://developer.android.com/studio/terms |

SDK 條款所給的，也只是一份不得再授權的許可，用來開發 Android 應用程式 (§3.1)，這是這個映像檔不能轉交他人的另一個理由：我們沒有任何可以再授權的東西。

SDK 的每一個元件在映像檔內都帶著自己的 `NOTICE.txt`（位於 `/opt/android-sdk/` 底下），SDK 自身內容的第三方聲明就在那裡。`/opt/android-sdk/licenses/` 底下的檔案是 `sdkmanager` 寫下的接受標記，不是授權條款全文。

## 桌面版安裝檔——Electron 與 Chromium

桌面版安裝檔（`BomLens-Setup.exe`、`BomLens-Setup.dmg`）把應用程式與 Electron 執行環境包在一起，因此也再次散布了其中的 Electron 與 Chromium 建置版本。

| 元件 | 授權條款 (SPDX) | 聲明檔案 |
|-----------|----------------|-------------|
| Electron | MIT | `LICENSE.electron` |
| Chromium 與其內附的第三方程式碼 | BSD-3-Clause 與其他多種 | `LICENSES.chromium.html` |

Chromium 的第三方元件集合中含有 LGPL-2.1-or-later 的元件，FFmpeg 就是其中之一。Electron 並未把 FFmpeg 靜態連結，而是以獨立的共享程式庫散布（Windows 上是 `libffmpeg.dll`，macOS 上是 `libffmpeg.dylib`），這正是 LGPL 的重新連結條款所要求的形式。

BomLens 自身的使用條款同樣隨安裝檔一起提供：`LICENSE`、`NOTICE` 與本文件會放進應用程式的資源資料夾 (`electron/electron-builder.yml`)。

## 所有映像檔的 Debian 套件 {#debian-packages-in-every-image}

每一個 BomLens 映像檔都建置在 Debian 基底的 `python:3.12-slim` 之上。因此除了上面列出的工具，它也含有 Debian 系統套件，而其中大多數是 copyleft：基礎映像檔的 128 個套件中，超過一百個帶有 GPL 或 LGPL 條款。bash、coreutils、grep、sed、gzip、findutils、wget 與 tar 是 GPL-3.0-or-later；git 與 mawk 是 GPL-2.0；GNU C 程式庫是 LGPL-2.1-or-later。不存在不含 GPL 的 Linux 基礎映像檔——Alpine 內附 GPL-2.0 授權的 BusyBox，每一個基於 glibc 的映像檔都帶有 LGPL——所以這是容器映像檔的普遍性質，而不是這裡做的選擇。

BomLens 不對這些套件套用任何修補。它以 `apt-get` 安裝它們，並以獨立行程呼叫，因此對應原始碼就是未經修改的 Debian 原始碼套件。

要列出您手上映像檔中的每一個套件及其確切版本：

```bash
docker run --rm --entrypoint dpkg-query ghcr.io/sktelecom/bomlens:latest \
  -W -f='${Package} ${Version} ${Architecture}\n'
```

每個套件的授權條款與著作權標示都原樣保存在映像檔內的 `/usr/share/doc/<package>/copyright`。

### Debian 套件的原始碼

上面列出的任何版本，其對應原始碼都可從 Debian 的原始碼封存取得：

```
https://snapshot.debian.org/
```

請使用 `snapshot.debian.org` 而不是 `deb.debian.org`：它可以用確切版本定址，也保留歷史版本，因此這份說明對任何日期建置的映像檔都仍然有效。同樣地，從映像檔內部也可以：

```bash
apt-get source <package>=<version>
```

### 書面提供聲明（GPL-2.0 元件）

對於這些映像檔中任何依 GNU General Public License 第 2 版授權的元件，SK Telecom Co., Ltd. 提供以下承諾，自您取得映像檔之日起三年內有效：向任何第三方提供對應原始碼的完整機器可讀副本，收費不超過實際執行散布的成本。請在 https://github.com/sktelecom/bomlens/issues 開立 issue 提出請求。

---

*本文件是一般性的合規整理，不是法律意見。具備效力的授權條款是各上游專案中的 LICENSE 檔案。*
