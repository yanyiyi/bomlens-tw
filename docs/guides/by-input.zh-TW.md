---
description: 'BomLens 如何為七種輸入形式產生 SBOM、開放原始碼授權聲明與風險報告——GitHub URL、ZIP 壓縮檔、本機原始碼、既有的 SBOM、Yocto 建置目錄、韌體，以及 HuggingFace AI 模型。'
---

# 輸入情境指南

## 概觀

開放原始碼合規負責人會從各個團隊收到形式各異的交付物。這份指南說明如何為七種輸入形式產生同樣的三份產出物。（AI 模型稍有不同——產出的是 ML-BOM，而且沒有安全報告；參考情境 7。）

**三份產出物**

| 產出物 | 檔案 | 說明 |
|-------------|------|---------|
| 開放原始碼授權聲明 | `{Project}_{Version}_NOTICE.{txt,html}` | 滿足授權條款義務的聲明文件 |
| SBOM | `{Project}_{Version}_bom.json` | CycloneDX 1.6 元件清冊 |
| 開放原始碼風險報告 | `{Project}_{Version}_risk-report.{md,html}` | 彙整授權條款與弱點的風險（含修補期限） |

無論哪一種輸入形式，加上 `--all --generate-only` 就會一次產生這三份（風險報告預設開啟，只有 `--no-report` 會把它關掉）。

## 共通準備 {#common-setup}

> **Windows**：這裡的指令是以 macOS/Linux 為準。請從下列方式中選一種。安裝方式請看[快速開始](../start/first-scan.md)。
>
> - 把 `./scripts/scan-sbom.sh` 換成 `scripts\scan-sbom.bat`（需要 Git Bash）。
> - 在 WSL2 底下直接照原樣執行這些指令。
> - 不想用指令列的話，可以雙擊 `scripts\sbom-ui.bat`。

```bash
# 需要 Docker 20.10+。掃描器映像檔只需下載一次（也可以自己建置）。
docker pull ghcr.io/sktelecom/bomlens:latest   # 舊名稱 sbom-scanner 指向同一個映像檔

# 為了方便，把指令碼路徑放進變數裡。
SBOM=/path/to/bomlens/scripts/scan-sbom.sh
```

## 一覽

下面每一道指令裡的 `$SBOM`，都是[共通準備](#common-setup)中定義的指令碼路徑變數——如果跳過了那一步，就把 `scan-sbom.sh` 的完整路徑直接填在它的位置。

| 輸入形式 | 模式 | 核心指令（摘要） | 產出物 |
|------------|------|------------------------|--------------|
| GitHub URL | SOURCE | `$SBOM --git <url> --all --generate-only` | 授權聲明、SBOM、風險報告 |
| 原始碼 ZIP | SOURCE | `$SBOM --target app.zip --all --generate-only` | 同上 |
| 本機目錄 (C/C++) | SOURCE | `cd dir && $SBOM --all --generate-only` | 同上 |
| 既有的 SBOM JSON | ANALYZE | `$SBOM --analyze sbom.json --generate-only` | 同上，另加符合性報告 |
| Yocto 建置目錄 | ANALYZE | `$SBOM --target ~/poky/build --generate-only` | 同上，另加符合性報告 |
| 建置產出物（`.jar`、`.deb`…） | BINARY | `$SBOM --target app.jar --all --generate-only` | 同上 |
| 安裝程式（`.exe`、`.msi`、`.dmg`） | FIRMWARE | `$SBOM --target installer.exe --all --generate-only` | 同上 |
| 行動應用程式（`.apk`、`.ipa`） | FIRMWARE | `$SBOM --target app.apk --all --generate-only` | 同上 |
| 韌體 `.bin` | FIRMWARE | `$SBOM --target dev.bin --firmware --all --generate-only` | 同上 |
| AI 模型 (HuggingFace) | AIBOM | `$SBOM --model owner/name --generate-only` | 授權聲明、ML-BOM (1.7)、風險報告（無安全報告） |
| AI 模型檔案（GGUF、safetensors…） | MODELFILE | `$SBOM --model-file ./model.gguf --generate-only` | 授權聲明、ML-BOM (1.7)、風險報告（無安全報告） |

> 每一道指令都還需要 `--project <name> --version <version>`（見下方範例）。
>
> 沒有套件管理器（Conan／vcpkg）的 C/C++：請加上 `--identify-vendored`，直接複製進原始碼裡的開放原始碼才會被偵測為具名元件。這種情況強烈建議開啟——參考[情境 3](#scenario-3--local-cc-source-directory)。

## 情境 1——GitHub URL

某個團隊給你一個 GitHub 儲存庫。直接把 URL 傳進去，不必手動 `git clone`。（`$SBOM` 在[共通準備](#common-setup)中定義。）

<!-- runnable -->
```bash
$SBOM --project team1-app --version 1.0.0 \
  --git "https://github.com/sktelecom/bomlens" \
  --all --generate-only
```

- 指定分支或標籤：`--branch v1.2.3`
- 私有儲存庫：`GIT_TOKEN=ghp_xxx $SBOM ... --git https://github.com/org/private ...`（權杖絕不會出現在記錄中）
- 淺層 clone (`--depth 1`) 會取到暫存目錄後分析；最後只留下產出物，放在目前目錄底下的 `{Project}_{Version}/` 子資料夾。

**產出物**：`team1-app_1.0.0_NOTICE.{txt,html}`、`team1-app_1.0.0_bom.json`、`team1-app_1.0.0_risk-report.{md,html}`

## 情境 2——原始碼 ZIP

某個團隊以 ZIP 交付原始碼。直接把壓縮檔傳進去，不必手動解壓縮。

<!-- runnable -->
```bash
$SBOM --project team2-app --version 1.0.0 \
  --target "./team2-app.zip" \
  --all --generate-only
```

- 支援的格式：`.zip`、`.tar.gz`、`.tgz`、`.tar.bz2`、`.tar.xz`、`.tar`
- 會先做 zip-slip（路徑逃脫）檢查，再解壓縮到暫存目錄；若只有單一頂層資料夾，會自動進入該資料夾。

**產出物**：授權聲明、SBOM、風險報告（共三份）

## 情境 3——本機 C/C++ 原始碼目錄 {#scenario-3--local-cc-source-directory}

某個團隊以資料夾分享原始碼，你已複製到本機 (`~/project/c-dev`)。請在該目錄裡執行。

```bash
cd ~/project/c-dev
$SBOM --project team3-dev --version 1.0.0 --all --deep-license --generate-only
```

**C/C++ 注意事項**

- 有套件管理器時（Conan 的 `conanfile.txt`／vcpkg 的 `vcpkg.json`），相依項目會被解析出來並寫進 SBOM。
- 純 CMake／Make 的原始碼沒有套件管理器的後設資料，SBOM 因此可能很稀疏。可用 `--deep-license` 補上自家程式碼的授權條款檔頭，並用 `$SBOM --target <build-dir> --all --generate-only`(syft) 另外分析建置輸出（放有已安裝函式庫的 staging／rootfs）。完整的伺服器 SBOM 流程——把 OS rootfs、應用程式與靜態連結的相依項目分成獨立層——請看[伺服器 SBOM 指南](server-delivery.md)。在網頁介面中，`--deep-license` 就是進階掃描選項裡的**逐檔授權條款掃描 (ScanCode)**開關；它掃的是你自己的原始碼檔案 (`/src`)，不是已宣告的相依項目，而且很慢，所以只在真的需要逐檔偵測授權條款時才開啟。
- 原始碼沒有套件管理器（單純的 Make／CMake），又把開放原始碼直接複製納入原始碼樹時——嵌入式與韌體原始碼很常見——強烈建議使用 `--identify-vendored`。不用它，SBOM 會一直很稀疏，也會漏掉這些複製納入的函式庫；用了它，這些函式庫會被偵測為帶有 CPE 的具名元件，風險報告才能比對出 CVE。參考[識別內含的開放原始碼](identify-vendored.md)。BomLens 偵測到這種情況時，也會主動提示你開啟這個選項。
- 即使沒有套件管理器，風險報告仍然會產生，彙整已偵測到的元件的授權條款與弱點。

**產出物**：授權聲明、SBOM、風險報告（共三份）

## 情境 4——既有的 SBOM JSON

某個團隊交給你一份 SBOM (JSON)。即使沒有原始碼，也能驗證並分析它。

<!-- runnable -->
```bash
$SBOM --project team4-proj --version 2.0.0 \
  --analyze "./team4-sbom.json" \
  --generate-only
```

- CycloneDX 與 SPDX（JSON／Tag-Value）都接受，內部會轉換成 CycloneDX。
- `--analyze` 會自動開啟授權聲明與安全報告，所以不需要 `--all`。
- 另外還會產生格式符合性報告 (`_conformance.{json,md,html}`)，風險報告的第一個區段也會納入符合性結果（必要欄位是否具備）。

**產出物**：授權聲明、SBOM（轉換後）、風險報告、符合性報告

## 情境 5——Yocto 建置目錄

你用 Yocto 建置嵌入式 Linux 映像檔，想知道裡面到底裝了什麼。把掃描指向建置目錄就好；建置過程早就把答案記錄下來了。

```bash
$SBOM --project team5-image --version 1.0.0 \
  --target ~/poky/build \
  --generate-only
```

- 設定建置產生 SBOM——在 `conf/local.conf` 加入 `INHERIT += "create-spdx-3.0"` 與 `INHERIT += "vex"`——能取得的資訊最完整。這項設定需要 5.0 Scarthgap 或更新的版本；4.0 Kirkstone 沒有這個 class。SPDX 2.2（兩個 LTS 版本的預設值）也會讀取，來源是映像檔文件旁邊的 `.spdx.tar.zst`，只是不帶 CVE 判定。完全沒有 SPDX 的建置，則改讀它本來就會寫出的 manifest；三者皆無的建置會讓掃描停下來，並明確說明原因。
- 分析的是 `tmp/deploy/images/<machine>/` 底下的映像檔 SBOM——不是建置樹，建置樹裡放的是 sysroot 與原生建置工具，這些從來不會進到映像檔裡。
- 元件清單就是映像檔中已安裝的套件，弱點則帶著建置本身所做的判定——已由 recipe 修補、判定為不適用，或是仍然未處理。只有未處理的才算是發現項目。
- 若建置了多個 machine 或映像檔，會分析最新的那份 SBOM，並在記錄中列出所有候選項目；想選另一份就傳 `--analyze <file>`。
- 在網頁介面中，請用**目錄／rootfs**輸入欄挑選該資料夾（以 `--ui --mount ~/poky/build` 掛載，或在桌面版應用程式中使用「新增資料夾…」）——那裡跑的是同一套辨識邏輯。
- 完整行為與限制請看[供應者 SBOM 指南的 Yocto 章節](supplier-sbom.md#yocto-images)。

**產出物**：授權聲明、SBOM、風險報告、符合性報告

## 情境 6——韌體二進位檔

某個團隊交給你一份已建置好的韌體映像檔 (`dev.bin`)。解開封裝後識別元件。

```bash
$SBOM --project team6-fw --version 1.0.0 \
  --target "./dev.bin" --firmware \
  --all --generate-only
```

- 韌體分析需要 opt-in 的韌體映像檔，其中包含 GPL 工具（unblob、cve-bin-tool 等）。可用 `SBOM_FIRMWARE_IMAGE` 指定，或直接下載預設值 (`ghcr.io/sktelecom/bomlens-firmware:latest`)。
- 可辨識的副檔名 (`.bin/.img/.squashfs/.ubi/...`) 即使不加 `--firmware` 也會自動偵測，但建議明確指定。
- 行為與限制請看[韌體分析指南](../guides/firmware.md)。

**產出物**：授權聲明、SBOM、風險報告（共三份）

## 情境 7——AI 模型 (HuggingFace)

某個團隊給你的不是程式碼，而是一個 HuggingFace 模型。只要有模型 id 就能產生 ML-BOM——不需要原始碼，也不會下載模型權重。

```bash
$SBOM --project bert-base --version 1.0.0 \
  --model "google-bert/bert-base-uncased" \
  --generate-only
```

- 需要 opt-in 的 aibom 映像檔 (`ghcr.io/sktelecom/bomlens-aibom:latest`)，會自動下載。想換別的標籤請用 `SBOM_AIBOM_IMAGE` 指定。
- `--model` 與 `--target`／`--analyze`／`--git`／`--merge` 互斥。
- 會產生 CycloneDX 1.7 的 **ML-BOM**（不是 1.6）、授權聲明與風險報告，另外加上 G7 最低要素的符合性檢查。**不會有安全報告**——模型沒有套件層級的 CVE。
- 模型卡、資料集與 G7 的細節請看[AI 模型指南](ai-model.md)。

**產出物**：授權聲明、ML-BOM (CycloneDX 1.7)、風險報告、G7 符合性

### 只有模型檔案，沒有模型 id 時

供應者交付的是權重而不是 Hub 連結，或者模型屬於內部使用、從未發佈。這時直接指向檔案本身：

```bash
$SBOM --project internal-llm --version 1.0.0 \
  --model-file ./models/internal-llm-q4.gguf \
  --generate-only
```

- 只讀取檔案自身的標頭。不需要網路，不需要 HuggingFace 帳號，用的是基礎映像檔——沒有額外要下載的 opt-in 映像檔。
- 可辨識的格式：GGUF、safetensors、PyTorch (`.pt`/`.pth`/`.ckpt`)、pickle、npz、npy 與 ONNX。無法辨識的檔案會直接拒絕，而不是勉強描述它。
- 能寫進 SBOM 的內容依格式而異。GGUF 帶有名稱、授權條款與架構；safetensors 通常只有張量形狀與 dtype。所有格式都會提供檔案的 SHA-256，這正是把文件與你收到的產出物綁在一起的依據。檔案沒有宣告的欄位會留空，不會用猜測值填補。
- 產出物與上面相同，只少了原本應由模型卡提供的那些資訊。

## 三份產出物怎麼讀

- **授權聲明 (NOTICE)**：依授權條款分組的元件清單。散布時用它來滿足隨附或公開聲明的義務。
- **SBOM**：CycloneDX 1.6。這是你上傳到弱點管理系統的產出物。
- **開放原始碼風險報告**：依嚴重程度彙整弱點，並附上建議的修補期限（Critical（嚴重）7 天、High（高）30 天）。內含授權條款摘要，分析供應者 SBOM 時還會加上格式符合性結果。

## 在網頁介面一次完成

不習慣用 CLI 的話，就改用網頁介面。

```bash
$SBOM --ui   # 在瀏覽器開啟 http://localhost:8080
```

在介面上方挑選掃描目標，然後填入對應的輸入內容。

| 掃描目標 | 輸入方式 |
|-------------|-------|
| 目前資料夾 | 掃描介面執行資料夾中的原始碼 |
| 目錄路徑 | 執行資料夾底下的子資料夾（例如 OS rootfs）、以 `--ui --mount <dir>` 掛載的資料夾，或在桌面版應用程式中以「新增資料夾…」按鈕挑選的資料夾 |
| GitHub URL | 輸入 URL |
| ZIP 上傳 | 上傳 `.zip`／tar 檔案 |
| 套件上傳 | 上傳建置產出物——`.jar`、`.war`、`.ear`、`.deb`、`.rpm`、`.whl` |
| SBOM 上傳 | 上傳既有的 SBOM (JSON)，ANALYZE 模式 |
| 韌體上傳 | 上傳 `.bin` 等檔案——只要 Docker 正在執行，這個方塊就會自動出現 |
| Docker 映像檔 | 輸入映像檔名稱 |
| AI 模型 | 輸入 HuggingFace 模型 id——只要 Docker 正在執行，這個方塊就會自動出現 |
| 模型檔案 | 上傳 `.gguf`、`.safetensors`、`.pt` 等（最大 8 GB） |

這個表格列的是本指南所涵蓋的輸入情境；完整的十種掃描目標請看[網頁介面參考](../reference/ui.md#new-scan)。

原始碼掃描（目前資料夾、GitHub URL、ZIP 上傳）另外有一個**進階掃描選項**區段，裡面的開關改變的是原始碼的分析方式，而不是產生哪些檔案：

- **逐檔授權條款掃描 (ScanCode)**——網頁介面中相當於 `--deep-license`。它會掃過你自己的原始碼檔案，找出逐檔的授權條款文字與檔頭（自家程式碼），不會下載或掃描已宣告的相依項目。
- **偵測複製進來的開放原始碼 (SCANOSS)**——找出直接複製進原始碼樹的第三方開放原始碼（主要是 C/C++）。參考[識別內含的開放原始碼](identify-vendored.md)。

兩者都很慢，預設關閉，只在需要時才開啟。ScanCode 只在以 `--build-arg SBOM_DEEP_LICENSE=true` 建置的映像檔中才有。完整的開關清單與各掃描目標的可用狀況，請看[網頁介面參考](../reference/ui.md)。

執行期間記錄會即時串流；結束後可以檢視或下載授權聲明、SBOM 與風險報告（相關時還有符合性報告）。符合性結果（通過／未通過）會以卡片形式顯示在最上方。

> 只要 Docker 引擎正在執行，韌體上傳頁籤就會自動出現。它的運作方式，以及如何指向
> 另一個映像檔標籤，請看[韌體指南](firmware.md)。

## 疑難排解與限制

- **GitHub URL**：私有儲存庫在 CLI 是用 `GIT_TOKEN` 環境變數認證；網頁介面則改為在 URL 輸入欄下方提供自己的權杖欄位（兩者是各自獨立的路徑）。不允許的 URL 形式（shell 特殊字元、`..`、空白）為了安全會被拒絕。
- **ZIP／tar**：含有路徑逃脫 (zip-slip) 的壓縮檔會被拒絕。Windows 的 Git Bash 沒有 `unzip` 時，會改用 `tar`。
- **C/C++**：沒有套件管理器的純原始碼會產生稀疏的 SBOM（參考[情境 3](#scenario-3--local-cc-source-directory)）。
- **韌體**：靜態連結的函式庫與供應商改過的 squashfs 偵測能力有限（參考[韌體分析指南](../guides/firmware.md)的「限制」）。
- **SBOM 分析**：把 SPDX 轉換成 CycloneDX 時，部分授權條款運算式可能會被簡化。

---

> **相關文件**：[快速開始](../start/first-scan.md) | [CLI 參考](../reference/cli.md)
