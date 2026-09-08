---
description: 'BomLens 如何處理各種輸入類型——原始碼（含 ScanCode 與 SCANOSS 選項）、韌體、收到的 SBOM 與 AI 模型——並以圖解說明每個步驟由哪個開放原始碼工具執行。'
---

# 各輸入類型的流程

BomLens 接受多種輸入：原始碼、韌體、你收到的 SBOM，以及 AI 模型。每一種都有自己的**產生**步驟來建立 CycloneDX SBOM，之後全部匯流到同一套共用的**後處理**管線（授權聲明、安全、風險報告）。這一頁逐一說明各輸入的工具流程。兩階段的整體樣貌請看[架構](architecture.md)。

![四種輸入各自經過對應的產生步驟，最後匯流到同一套共用的後處理管線](../images/diagrams/pipeline-overview.png)

下面提到的外部工具全部都是開放原始碼；[使用到的開放原始碼工具](#open-source-tools-used)表格整理了每個工具的角色、授權條款與專案連結。

---

## 原始碼

原始碼資料夾、GitHub URL，或 ZIP 壓縮檔。語言偵測會挑出對應的官方 [cdxgen](https://github.com/CycloneDX/cdxgen) 語言映像檔，由它準備相依項目（`build-prep.sh`）並產生 SBOM。BomLens 無法執行 sibling 容器時（例如網頁介面的原始碼掃描），會後備改用 [syft](https://github.com/anchore/syft) 掃描該目錄，此時是從鎖定檔案取得直接相依。

有兩個選項只適用於原始碼掃描，而且預設都是關閉。

- **偵測複製進來的開放原始碼**（`--identify-vendored`，[SCANOSS](https://github.com/scanoss/scanoss.py)）——適用於沒有套件管理器、直接複製納入的 C/C++ 等程式碼。SCANOSS 用戶端會為檔案建立指紋並查詢代管的 OSSKB 服務，接著 BomLens 把比對結果與套件管理器掃描已經找到的東西相互核對，再把其餘的合併進 SBOM。
- **精確授權條款偵測**（`--deep-license`，[ScanCode Toolkit](https://github.com/aboutcode-org/scancode-toolkit)）——掃描自家原始碼裡的授權條款標頭。它在後處理階段執行，並另外寫出一份 `_scancode.json`。

![原始碼掃描流程：語言偵測導向 cdxgen 映像檔並備有 syft 後備，接著在共用後處理之前可選擇執行 SCANOSS](../images/diagrams/pipeline-source.png)

> 容器映像檔、單一二進位檔案與目錄（根檔案系統）會略過 cdxgen，由 syft 直接掃描，之後走同一套後處理。

---

## 韌體

網路裝置的韌體映像檔（`.bin`、`.img.gz`、squashfs 等），由 opt-in 的 `bomlens-firmware` 映像檔負責。韌體把一套作業系統與數十個函式庫封在同一個檔案裡，因此 BomLens 會先解開封裝，再以兩種方式識別元件：套件管理器的後設資料交給 syft，經過 strip 的靜態二進位檔案交給 [cve-bin-tool](https://github.com/intel/cve-bin-tool)（它同時也會比對 CVE）。兩份結果合併之後，還有一個 CPE/SPDX 補強步驟，為一份人工整理的知名開放原始碼清單（busybox、dropbear、dnsmasq…）填上識別碼，好讓 Trivy 與授權聲明能夠使用。

解開封裝會依序嘗試各個工具，用第一個成功的：[unblob](https://github.com/onekey-sec/unblob)（主要）、標準 squashfs 用 `unsquashfs`、Windows 交付物所使用的容器格式用 `7z`，然後是 `binwalk`。

![韌體流程：解開封裝、找出根檔案系統、以 syft 與 cve-bin-tool 並行掃描，接著合併、補強並進行後處理](../images/diagrams/pipeline-firmware.png)

> 韌體工具屬於 GPL 家族，因此只放在 `bomlens-firmware` 映像檔裡，基礎映像檔一個都不安裝。請看[韌體指南](../guides/firmware.md)以及它的限制。

---

## 收到的 SBOM

從供應者或其他團隊收到的 SBOM（CycloneDX 或 SPDX），不需要原始碼。BomLens 會先依品質標準檢查它並寫出符合性報告，接著把輸入正規化為 CycloneDX，讓管線的其餘步驟能夠分析。SPDX 以 `syft convert` 轉換（syft 無法使用時，由 `jq` 後備處理 SPDX JSON）。這個模式一律會產生授權聲明、安全與風險報告。

![收到的 SBOM 流程：驗證符合性、把 SPDX 轉為 CycloneDX，然後進入共用後處理](../images/diagrams/pipeline-analyze.png)

> 驗證是以轉換前的原始輸入為準，所以 SPDX 會以 SPDX 的身分檢查。細節在[供應者 SBOM 指南](../guides/supplier-sbom.md)。

Yocto 建置目錄也從這裡進來。把 `--target` 指向建置目錄會被辨識出來，建置發佈在 `tmp/deploy/images/` 底下的映像檔 SBOM 就走這同一條路徑——不是交給一般的 SPDX 轉換，而是由專用的解析器讀取，以保留已安裝的套件集合與建置當時記錄的弱點判定。

---

## AI 模型 {#ai-model}

HuggingFace 的模型 id（`org/model`），由 opt-in 的 `bomlens-aibom` 映像檔負責。[OWASP AIBOM Generator](https://github.com/GenAI-Security-Project/aibom-generator) 會透過網路取得模型卡的後設資料，建立以模型與其資料集為核心的 CycloneDX 1.7 ML-BOM。後處理接著加上 G7 最低要素的符合性檢查。AI 模型沒有套件 CVE，因此會略過安全報告。

![AI 模型流程：OWASP AIBOM Generator 建立 CycloneDX 1.7 ML-BOM，再經過共用後處理](../images/diagrams/pipeline-ai-model.png)

AI 輸入還有第二條路徑，完全在基礎映像檔裡執行：模型**檔案**（`--model-file`，在網頁介面則是上傳模型檔案）。這條路徑不用產生器也不用網路——以標準函式庫寫成的讀取器會解析檔案自身的標頭，依魔術位元組而非檔名判斷格式，計算檔案的雜湊值，然後寫出同樣形狀的 CycloneDX 1.7 ML-BOM，之後的後處理完全相同。供應者交給你的權重，以及從未發佈過的模型，走的就是這條路徑。能填入多少資訊取決於格式：GGUF 會宣告名稱、授權條款與架構，safetensors 通常只宣告張量形狀，而兩者都不宣告的檔案至少還能提供它的完整性雜湊值。

> 模型卡的揭露項目（權重、架構、訓練資料、訓練過程）與 G7 判定結果會顯示在網頁介面的「模型與資料集」和 G7 區段——請看[網頁介面參考](../reference/ui.md)。逐步操作說明請看 [AI 模型指南](../guides/ai-model.md)。

---

## 共用的後處理

不論輸入是什麼，SBOM 都會走過同一組固定順序的步驟。正規化跑在最前面，讓後續每個步驟拿到的輸入都是穩定的；簽章跑在最後，這樣它涵蓋的才是最終的 SBOM。虛線的步驟是選用或只適用於特定輸入。每個步驟都是盡力而為（best-effort）——失敗時只會發出警告並略過，不會中止整次掃描（簽章與上傳例外）。

![共用後處理步驟依序從正規化到產出物，選用步驟以虛線標示](../images/diagrams/pipeline-postprocess.png)

風險報告在每一種模式下都預設產生（它會彙整授權條款與弱點）；要略過就用 `--no-report`。各旗標對應到哪個步驟，請看[架構](architecture.md#flag-to-step-mapping)。

---

## 使用到的開放原始碼工具 {#open-source-tools-used}

所有分析工具都是開放原始碼。裝進基礎映像檔的工具採用寬鬆式授權條款；GPL 的工具隔離在 opt-in 的 `bomlens-firmware` 映像檔，AI 產生器則隔離在 `bomlens-aibom`。就像任何 Linux 映像檔一樣，每個映像檔也都帶有其 Debian 基底的 GPL 系統套件——請看[第三方授權條款](https://github.com/sktelecom/bomlens/blob/main/THIRD_PARTY_LICENSES.md)。

| 工具 | 角色 | 輸入 | 授權條款 | 映像檔 | 專案 |
|------|------|-------|---------|-------|---------|
| cdxgen | 從原始碼產生 SBOM | 原始碼 | Apache-2.0 | 語言映像檔 | [CycloneDX/cdxgen](https://github.com/CycloneDX/cdxgen) |
| syft | 映像檔、二進位檔案、目錄與韌體 rootfs 的 SBOM | 原始碼（後備）、映像檔、二進位檔案、rootfs、韌體 | Apache-2.0 | base / firmware | [anchore/syft](https://github.com/anchore/syft) |
| SCANOSS (scanoss.py) | 以檔案指紋偵測複製進來的開放原始碼 | 原始碼（`--identify-vendored`） | MIT | base | [scanoss/scanoss.py](https://github.com/scanoss/scanoss.py) |
| ScanCode Toolkit | 自家原始碼的精確授權條款偵測 | 原始碼（`--deep-license`） | Apache-2.0 | base（opt-in） | [aboutcode-org/scancode-toolkit](https://github.com/aboutcode-org/scancode-toolkit) |
| unblob | 韌體解開封裝（主要） | 韌體 | MIT | firmware | [onekey-sec/unblob](https://github.com/onekey-sec/unblob) |
| sasquatch | 標準 unsquashfs 拒絕處理的廠商變體 squashfs | 韌體 | GPL-2.0 | firmware（選用） | [onekey-sec/sasquatch](https://github.com/onekey-sec/sasquatch) |
| cve-bin-tool | 識別經過 strip 的二進位檔案 + 比對 CVE | 韌體 | GPL-3.0 | firmware | [intel/cve-bin-tool](https://github.com/intel/cve-bin-tool) |
| OWASP AIBOM Generator | 從 HuggingFace 模型卡產生 ML-BOM | AI 模型 | Apache-2.0 | aibom | [GenAI-Security-Project/aibom-generator](https://github.com/GenAI-Security-Project/aibom-generator) |
| Trivy | 弱點（CVE）安全報告 | 全部 | Apache-2.0 | base | [aquasecurity/trivy](https://github.com/aquasecurity/trivy) |
| cosign | SBOM 的 detached 簽章 | 全部（`--sign`） | Apache-2.0 | base | [sigstore/cosign](https://github.com/sigstore/cosign) |
| WeasyPrint | 授權聲明的 PDF 輸出（選用） | 全部（`SBOM_PDF` 建置） | BSD-3-Clause | base（opt-in） | [Kozea/WeasyPrint](https://github.com/Kozea/WeasyPrint) |
| jq | SBOM 正規化、授權聲明與報告組裝 | 全部 | MIT | base | [jqlang/jq](https://github.com/jqlang/jq) |

> 完整的授權條款清單，以及韌體映像檔的 GPL 源碼提供方式，請看 [THIRD_PARTY_LICENSES.md](https://github.com/sktelecom/bomlens/blob/main/THIRD_PARTY_LICENSES.md)。

---

> **相關文件**：[架構](architecture.md) | [韌體指南](../guides/firmware.md) | [供應者 SBOM 指南](../guides/supplier-sbom.md) | [識別內含的開放原始碼](../guides/identify-vendored.md)
