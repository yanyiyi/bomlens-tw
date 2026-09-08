---
description: '以 BomLens 驗證收到的 SBOM（CycloneDX/SPDX）是否符合你的品質標準，接著分析授權條款與弱點，產出風險報告。'
---

# 供應者 SBOM 驗證指南

說明如何驗證從供應者或其他團隊收到的 SBOM（JSON）是否符合你的品質標準。驗證之後，BomLens 會接著分析授權條款與弱點，並產出風險報告。不需要原始碼，只要有 SBOM 檔案就夠了。


## 何時使用 {#when-to-use-it}

當供應者或其他團隊交來的是 SBOM 檔案而不是原始碼，而你需要先確認這份 SBOM 符合品質標準，再檢查它的授權條款與弱點時，就用這個流程。輸入可以是 CycloneDX 或 SPDX（JSON、Tag-Value），內部會轉換成 CycloneDX 再進行分析。

這些標準檢查的是一份 SBOM 的品質是否足以用於相依性檢視。各組織的要求不盡相同；可以參考 SK Telecom 的[供應鏈安全指南](https://sktelecom.github.io/guide/supply-chain/for-suppliers/)與其中的 [SBOM 要求](https://sktelecom.github.io/guide/supply-chain/for-suppliers/requirements/)。

| 分類 | 標準 |
|----------|----------|
| 格式 | CycloneDX v1.3–1.6 或 SPDX v2.2–2.3 |
| 必要的後設資料 | timestamp、工具資訊、頂層元件的名稱與版本 |
| 必要的元件欄位 | name、version，以及標準 `pkg:type/name@version` 形式的 PURL（不允許 `pkg:generic`） |
| 完整性 | 直接相依與間接相依都要包含 |
| 建議 | supplier、授權條款（SPDX ID）、hash |

> 上面可接受的格式範圍是 SK Telecom 提交基準的預設值。如果你的組織接受不同的範圍，可以用 `CYCLONEDX_SPEC_VERSIONS`、`AI_CYCLONEDX_SPEC_VERSIONS`（AI SBOM）與 `SPDX_SPEC_VERSIONS` 這幾個環境變數覆寫（以空白分隔的清單）。清單收錄在 [Docker 映像檔環境變數](../reference/docker-image.md)。

## 一次執行完整流程

### 從網頁介面

開啟網頁介面，選擇 **SBOM 上傳**，上傳收到的檔案，接著輸入專案名稱與版本並執行。Yocto SPDX 2.2 建置交出來的不是一份文件，而是 `<image>.spdx.tar.zst`；這種壓縮檔也可以直接上傳，因為那是這類建置唯一會產生的 SBOM。

如果這份 SBOM 以 Java（Maven）為主，請在掃描選項裡開啟**深度 CVE 比對（NVD CPE）**。它會把較舊的 Maven 函式庫拿去比對僅存在於 NVD、其他公告來源會漏掉的弱點，代價是掃描時間變長。這個選項不只出現在 SBOM 上傳，凡是使用基礎映像檔的掃描模式都有——只有韌體與 AI 模型掃描會隱藏它，因為那兩種沒有可以擴充的套件 SBOM。第一次執行時會下載 deep-cve 映像檔一次。這與 CLI 的 `--deep-cve` 是同一套比對。

```bash
./scripts/scan-sbom.sh --ui     # 會開啟 http://localhost:8080
#   Windows：雙擊 scripts\sbom-ui.bat
```

安裝方式請看[快速開始](../start/first-scan.md)。

### 從 CLI

不想用指令列嗎？請先看[免指令列快速開始](../start/no-cli.md)。以下是 CLI 的做法。

先把掃描器映像檔下載下來（`docker pull ghcr.io/sktelecom/bomlens:latest`），然後把 SBOM 檔案傳給 `--analyze`：

```bash
./scripts/scan-sbom.sh --project supplier-app --version 2.0.0 \
  --analyze "./supplier-sbom.json" \
  --generate-only
```

`--analyze` 會自動開啟授權聲明與安全分析，因此不必額外加上 `--all`。`--generate-only` 只會把產出物留在目前目錄底下的 `{Project}_{Version}/` 子資料夾，並清除暫存的工作副本。其餘選項請看 [CLI 參考](../reference/cli.md#options-reference)。

## 四種產出物

| 產出物 | 檔案 | 意義 |
|--------|------|---------|
| 符合性報告 | `{Project}_{Version}_conformance.{json,md,html}` | 是否滿足品質標準，以及缺漏了什麼 |
| SBOM（轉換後） | `{Project}_{Version}_bom.json` | SPDX 輸入會轉換成 CycloneDX 1.6；CycloneDX 輸入則保留原本的 spec 版本 |
| 開源授權聲明 | `{Project}_{Version}_NOTICE.{txt,html}` | 依授權條款分組的元件清單 |
| 風險報告 | `{Project}_{Version}_risk-report.{md,html}` | 綜合符合性、弱點與授權條款，並附上修補期限 |

與自行產生的 SBOM 不同，收到的 SBOM 會額外產生一份符合性報告，其摘要會放進風險報告的第 1 節。

## 如何讀符合性報告 {#reading-the-conformance-report}

符合性報告是逐項檢查收到的 SBOM 是否滿足品質標準的結果。驗證以轉換前的原始輸入為準，因此即使輸入是 SPDX，檢查的也是原始 SPDX 的欄位。

- 只要有一項必要項目未達標，結果就是 `fail`。必要項目與[何時使用](#when-to-use-it)的標準表相同——spec 版本範圍（CycloneDX v1.3–1.6、SPDX v2.2–2.3）、timestamp、工具資訊、頂層元件、名稱與版本涵蓋率、PURL 涵蓋率與語法（標準的 `pkg:type/name@version` 形式，不得使用 `pkg:generic`），以及間接相依。AI SBOM 也接受 AIBOM 工具鏈所產出的 CycloneDX 1.7。
- 建議項目未達標時是 `warn`，不算 `fail`。除了授權條款與雜湊值涵蓋率之外，這裡也包含法規基準所要求的逐元件建議欄位——SHA-512 雜湊值涵蓋率、元件建立者、元件檔名、原始碼或散布 URI、交付檔案屬性（掃描看不到該產出物時標記為需人工檢視），以及下面說明的檔案元件識別碼涵蓋率。
- 名稱與版本、PURL 的涵蓋率只以套件元件為計算對象。二進位檔案與韌體的 SBOM 會把交付的檔案一併列為檔案元件，而磁碟上的檔案既沒有套件版本，也沒有 PURL 型別可以帶，把它們算進分母會讓 SBOM 因為一個根本不可能存在的欄位被判為未達標。不過檔案並不因此免於識別：檔案元件識別碼檢查會看其中有多少個帶有雜湊值，也就是檔案真正帶得動的識別碼。完全沒有套件、只列出檔案的 SBOM 是 `fail`，因為弱點比對以套件識別碼為鍵，光是一份檔案清單什麼都答不出來。
- 2026 年最低要素中有一項要求 SBOM 在欄位留空時說明理由——是作者無法確認該值，還是知道卻選擇不公開。BomLens 產生的 SBOM 會針對整份文件載明這項說明，因為掃描只會產生前一種情況。收到的 SBOM 若對自己的空白隻字未提，這項要素就會被回報為缺漏。
- HTML 報告最上方的卡片會顯示通過／未通過，以及缺漏項目的清單。
- 對應到法規基準的檢查項目，會在該列下方附上參考規定，法規對照章節則彙整各框架的滿足情況——BSI TR-03183-2（為 EU CRA 制定的德國技術指引）與 2026 年版的美國 SBOM 最低要素。法規對照僅供參考，不構成合規判定；運作方式由 [AI 模型 SBOM 指南](ai-model.md#regulatory-crosswalk)說明。

出現 `fail` 時，請告知寄來 SBOM 的一方缺了哪些欄位並要求補齊。最常見的未滿足項目是缺少 PURL、使用 `pkg:generic`，以及缺少間接相依（只包含直接相依）。

## 如何讀風險報告

風險報告（`_risk-report`）是不重新掃描、僅將上述產出物重新彙整而成的文件，共分四個部分。

1. 已滿足的要求——符合性結果表。若為 `fail`，會列出未滿足的項目。
2. 弱點統計與修補期限——依嚴重程度統計，並以表格列出建議期限（Critical 於 7 天內、High 於 30 天內備妥修補計畫或風險理由說明）。
3. 授權條款摘要——授權聲明與授權條款涵蓋率。
4. 後續步驟——修補計畫的相關指引。

## SPDX 輸入

輸入 SPDX（JSON、Tag-Value）時，內部會以 `syft convert` 轉換成 CycloneDX，再走同一條流程分析。符合性驗證以轉換前的原始 SPDX 為準，因為 timestamp、工具或間接相依這類後設資料可能在轉換過程中被正規化掉。SPDX 的部分授權條款運算式在搬到 CycloneDX 時可能會被簡化。

## Yocto 映像檔 {#yocto-images}

Yocto 建置可以產生自己的 SPDX SBOM，而 BomLens 是以專用的解析器來讀它，而不是走一般的 SPDX 路徑，因為 Yocto 文件裡有兩樣東西會在一般路徑中流失。

要產生這份 SBOM，請在 `local.conf` 加入以下設定，然後照平常的方式建置。

```
INHERIT += "create-spdx-3.0"
INHERIT += "vex"
```

能寫出哪個 SPDX 版本，並不是每個 release 都能自行決定：

| Release | 預設 SPDX | 是否可用 `create-spdx-3.0` |
|---------|-----------------|-----------------------------|
| 4.0 Kirkstone (LTS) | 2.2 | **不可用**——這個 release 沒有這個 class |
| 5.0 Scarthgap (LTS) | 2.2 | 可用 |
| 5.1 Styhead 以後 | 3.0 | 可用（而且是預設值） |

在 Kirkstone 上無法使用上面的設定；那樣的建置會寫出 SPDX 2.2，讀取方式如下文所述。

接著把掃描目標指向建置目錄即可。你不需要知道建置把 SBOM 放在哪裡。

```bash
./scripts/scan-sbom.sh --project my-image --version 1.0.0 \
  --target ~/poky/build --generate-only
```

建置目錄會被辨識出來，接著分析建置所發佈的映像檔 SBOM——`tmp/deploy/images/<machine>/<image>.rootfs.spdx.json`，OpenEmbedded 建置則是 `tmp-glibc/…`。建置樹本身不會被走訪：把它當成目錄來掃描，會把根本不會進到映像檔裡的 sysroot 與原生建置工具一起報出來。

建置了多台機器或多個映像檔時，會分析最近寫出的那份 SBOM，並把所有候選項目列在日誌裡；想選其他的，就用 `--analyze <file>` 明確指定。把映像檔寫到完全不同位置的建置（`DEPLOY_DIR` 被搬走）同樣無法用這個方式找到，請以相同做法直接指定那份文件。如果你收到的只有 SBOM 檔案本身，把它上傳到網頁介面，或傳給 `--analyze` 即可。

網頁介面讀的是同一個資料夾：用目錄路徑輸入欄選擇它（先用 `--ui --mount ~/poky/build` 掛載，或在桌面版應用程式中使用「新增資料夾…」），偵測方式與指令列完全相同。

### 完全沒有產生 SPDX 的建置

開啟 `create-spdx` 屬於變更建置設定，而手上只有一份已完成建置目錄的人並不一定能做這件事。建置無論如何都會記下自己交付了什麼，因此改讀那些記錄：

| 記錄 | 位置 | 可取得的資訊 |
|------|-------|-------|
| 映像檔套件 manifest | `tmp/deploy/images/<machine>/<image>.manifest` | 已安裝的套件與版本 |
| 授權條款 manifest | `tmp/deploy/licenses/**/license.manifest` | 各套件的授權條款，以及它來自哪個 recipe |
| cve-check 報告 | `tmp/log/cve/cve-summary.json` | 每個 CVE 是被 recipe 修補、判定為不適用，還是仍然未處理 |

這是三種輸入中最薄弱的一條路徑，理由值得知道：沒有 CPE，弱點比對只能靠名稱與版本；CVE 判定的完整度也只到那次建置實際執行的 `cve-check` 範圍為止（從未執行過的建置會回報沒有判定，而不是憑空生出判定）。這條路徑也不會產生符合性報告——符合性是拿別人寄來的文件對照提交標準來衡量，而這裡並沒有那份文件。加上前面那兩行 `local.conf` 設定並重新建置，仍然是更好的做法。

如果那個目錄確實是 Yocto 建置，卻既沒有 SPDX 文件也沒有映像檔 manifest，掃描會停下來並提示上面那兩項設定，而不是退回目錄掃描——那樣的結果會與映像檔的實際內容不符。

結果與一般的 SBOM 掃描有兩點不同。

元件清單只包含映像檔中實際安裝的套件。Yocto 文件同時也會描述建置用到的每一個原始碼壓縮檔，這對來源證明有用，但與產品真正交付的內容不符，因此不列入。

弱點直接沿用建置本身的判定。Yocto 在建置過程中會執行 CVE 分析，並逐一記下判定，所以它知道 recipe 是否套用了修補。這些判定會分成三類呈現：建置時已修補、判定為不適用，以及仍然未處理。只有未處理的會被計為發現項目。在參考映像檔 `core-image-minimal` 上，這個差別決定了報告是 12255 個弱點，還是一個也沒有——因為它們全都已經在建置階段被關掉了。

開始之前，有兩項限制值得知道。

SPDX 2.2 也讀得進來，只是內容比較少。Yocto 4.0（Kirkstone）與 5.0（Scarthgap）預設產出 SPDX 2.2，而那種形式根本不是一份文件：deploy 目錄裡只會有一個 `<image>.spdx.tar.zst`，別無其他。壓縮檔內含映像檔文件，以及每個已安裝套件與每個 recipe 各一份文件。BomLens 會直接讀這個壓縮檔——以公開發佈的 Yocto 5.0.14 `core-image-minimal` 實測，取得的正是映像檔 manifest 所列的同樣 36 個套件，連授權條款與 CPE 一併帶出。它們沒有的是建置的 CVE 判定——只有 SPDX 3.0 會記錄 recipe 修補了哪些 CVE——所以弱點會像其他 SBOM 一樣依 CPE 比對，建置其實已經修補的 CVE 也可能顯示為未處理。若只從壓縮檔裡取出映像檔文件單獨上傳，結果幾乎是空的；這件事會明確告知，不會放著讓它看起來像是一次乾淨的掃描。建置目錄同時存在兩種格式時，即使 2.2 那份較新，仍然會分析 SPDX 3.0 文件。壓縮檔不會產生符合性報告：它是一綑文件，而不是一份提交的文件，因此沒有可以對照提交標準衡量的對象。

依賴 PURL 的符合性檢查會未通過。Yocto 是以 CPE 而不是 PURL 來識別套件，因此 PURL 涵蓋率以及由它衍生的檢查都無法通過。報告會另外說明有多少個元件帶有 CPE，該列也會引用兩份都接受任一種識別碼的基準——BSI TR-03183-2 與美國 SBOM 最低要素。做出這個判定的是提交標準，不是那兩份基準：這裡之所以要求 PURL，是因為預設的弱點比對以它為鍵。

還有兩項必要檢查在 Yocto 映像檔上表現不同，原因出在文件本身而不是工具。頂層元件會因為沒有版本而未通過：bitbake 寫入映像檔套件時只給名稱，沒有 `software_packageVersion`（以參考映像檔 `core-image-minimal` 實測）。

上傳大小上限為 100 MB。作為對照，參考映像檔 `core-image-minimal` 的文件在 35 個已安裝套件下是 15.8 MB。用 `--target` 掃描建置目錄時是直接從磁碟讀檔，因此不受這個上限限制。

## 要求對方修補

驗證與分析完成後，把風險報告（`_risk-report.html`）交給寄來 SBOM 的一方，並提出以下要求。

- 補齊符合性的 `fail` 項目後重新寄出 SBOM。
- Critical 弱點於 7 天內、High 弱點於 30 天內備妥修補計畫或風險理由說明（建議期限）。

修補追蹤、例外核准與歷程管理不在這個工具的範圍內，屬於另一套弱點與風險管理系統的職責。這個工具負責的是在本機驗證、分析單一 SBOM 並產出報告。

## 限制

- 驗證是以必要欄位是否存在、涵蓋率多少為準，並不保證語意上的正確性，例如 PURL 是否確實指向那個套件、版本是否真實存在。
- 是否包含間接相依，是依相依關係圖中有沒有連線來推斷，並不能證明那張圖是完整的。
- 弱點與授權條款分析的準確度，直接取決於輸入 SBOM 的品質，尤其是 PURL 與版本的正確性。

---

> **相關文件**：[快速開始](../start/first-scan.md) | [依輸入類型的指南](../guides/by-input.md) | [產生報告指南](../guides/reports.md)
