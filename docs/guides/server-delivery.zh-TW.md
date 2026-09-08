---
description: '如何為伺服器建立 SBOM：把 OS rootfs、應用程式與靜態連結相依項目當成獨立的層分別掃描，只有在外部系統要求時才合併成單一 BOM。'
---

# 伺服器 SBOM 指南

## 概觀

伺服器不是單一的原始碼樹。它由作業系統、安裝在上面的應用程式，以及建置過程中被連結進二進位檔的函式庫組成。只掃描其中一項就會漏掉其他項，這正是伺服器 SBOM 最後不完整的常見原因。

本指南把伺服器視為兩層——OS 與應用程式——並分別用 BomLens 掃描。各層的 SBOM 請分開保存，這是預設做法，也讓每一層都能單獨檢視。只有在外部系統要求單一檔案時，才把它們合併成一份產品 SBOM（參考[選用：合併為單一 SBOM](#optional-merge-into-one-sbom)）。

| 層 | 涵蓋範圍 | 遺漏時的症狀 |
|-------|----------------|--------------------|
| OS | 作業系統與其已安裝的套件（例如 CentOS 加上 rpm 資料庫裡的全部套件） | 漏掉 OS 弱點 |
| 應用程式 | 目標應用程式與它透過套件管理器取得的相依項目，包含直接相依與間接相依 | 漏掉應用程式的相依項目 |

除了這兩層之外，靜態連結的函式庫（例如被建置進二進位檔的 openssl 或 liblfds）是個盲區。套件管理器不會宣告它們，OS 套件資料庫也不會列出它們，所以兩層的掃描都找不到。這些函式庫必須另外偵測與記錄，而漏掉它們是最常見的缺漏——請看下面的[靜態連結函式庫](#static-link-libraries-a-blind-spot-of-both-layers)。

兩層都由 BomLens 這一個工具產生，只要換掉輸入即可。要求是 OS、應用程式與靜態連結函式庫全部都有交代，而不是要它們最後被塞進同一個檔案。

## 共通準備 {#common-setup}

> **Windows**：這裡的指令是以 macOS/Linux 為準。`scan-sbom.bat` 與 WSL2 的對應寫法請看[快速開始](../start/first-scan.md)。

```bash
# 需要 Docker 20.10+。掃描器映像檔只需拉取一次。
docker pull ghcr.io/sktelecom/bomlens:latest

# 把腳本路徑放進變數。
SBOM=/path/to/bomlens/scripts/scan-sbom.sh
```

## 第 1 層——OS 套件

掃描伺服器的 rootfs（解開後的根檔案系統），或是它的容器映像檔。Syft 會讀取 rpm/dpkg/apk 資料庫，把每個已安裝的套件都以實際的 purl（`pkg:rpm/...`）記錄下來。

```bash
# 以 rootfs 目錄為對象：
$SBOM --project mms-relay-os --version 6.10 \
  --target /path/to/server-rootfs \
  --all --generate-only

# 或者，如果伺服器是打包成容器映像檔：
$SBOM --project mms-relay-os --version 6.10 \
  --target mms-relay:6.10 \
  --all --generate-only
```

掃描對象必須包含套件資料庫。只放了解開的安裝檔、沒有 rpm 資料庫的資料夾，產生的 purl 會是空的，結果也毫無用處。請以真正的 rootfs 或映像檔為對象。

## 第 2 層——應用程式程式碼與相依項目

請在建置完成後掃描應用程式原始碼。有套件管理器（Maven、npm、pip、Go modules、Conan 等）時，間接相依會自動解析出來。

```bash
cd /path/to/app-source
$SBOM --project mms-relay-app --version 2.0.0 --all --generate-only
```

請先完成建置。在建置或安裝之前掃描，間接相依不會被解析。純 CMake/Make 而沒有 manifest 的應用程式，元件清單會很稀疏；此時可加上 `--deep-license` 來記錄第一方原始碼的授權條款。

## 靜態連結函式庫——兩層共同的盲區 {#static-link-libraries-a-blind-spot-of-both-layers}

原始碼掃描器看不到被靜態連結進二進位檔的函式庫，OS 套件資料庫也看不到——這就是兩層留下的盲區。目前沒有全自動的做法，因此請把兩種方式合起來用。

工具能找到的部分，就分析建置產出的二進位檔或韌體映像檔來補上：

```bash
$SBOM --project mms-relay-bin --version 2.0.0 \
  --target /path/to/delivered-binary \
  --all --generate-only
```

掃描仍然漏掉的部分，請從建置腳本裡手動記下來源與版本，例如建置實際拉進來的 openssl 版本（`openssl 1.1.1za`）。想要更精確地盤點靜態連結的元件，可以再搭配二進位組成分析工具作為補充檢查。

## 逐層驗證

各層的 SBOM（以及靜態連結那份 SBOM）請維持原樣。逐一檢查每一份，而不是檢查合併後的檔案，這樣缺漏才會在它該被發現的地方被發現。請確認每份 SBOM 格式正確，而且元件都帶有實際的 purl。

```bash
for bom in mms-relay-os_6.10_bom.json mms-relay-app_2.0.0_bom.json mms-relay-bin_2.0.0_bom.json; do
  echo "$bom: $(jq '.components | length' "$bom") 個元件，\
$(jq '[.components[] | select(.purl)] | length' "$bom") 個具備 purl"
done
```

每一層的兩個數字應該相近。差距很大表示有許多元件沒有 purl，通常是因為掃描了原始資料夾，或是有手工填寫的項目。接著請用 [CycloneDX validator](https://github.com/CycloneDX/cyclonedx-cli) 驗證 schema。

各層分開保存之所以是預設做法，是有原因的：檢視者可以一眼看出哪一層缺了、弱點落在哪裡，而每一層的相依關係圖也會乾淨地維持在該層的範圍內。

## 選用：合併為單一 SBOM {#optional-merge-into-one-sbom}

只有在外部系統預期每個產品一份 BOM 時才合併（Dependency-Track 與 TRUSCA 都是每個專案登錄一份 BOM）。`--merge` 會把各層合起來，依 purl 去除重複的元件，並把最上層元件標記為產品名稱與版本。

<!-- runnable -->
```bash
$SBOM --project mms-relay-server --version 1.0.0 \
  --merge mms-relay-os_6.10_bom.json \
          mms-relay-app_2.0.0_bom.json \
          mms-relay-bin_2.0.0_bom.json \
  --generate-only
```

這會寫出 `mms-relay-server_1.0.0_bom.json`，其中 `metadata.component` 設為該伺服器產品，並針對合併後的元件集合產生開放原始碼授權聲明與風險分析報告。每個元件都保留 `bomlens:layer` 屬性，因此仍然可以依層過濾（`jq '.components[] | select(.properties[]?.value == "centos")'`）。

合併會保留各層的 `dependencies` 關係圖（連線依 ref 取聯集），因此合併後的 BOM 仍保有間接相依資訊，也能通過符合性檢查中的間接相依項目。跨生態系的 `bom-ref` 很少衝突；ref 相同時，它們的 dependsOn 清單會取聯集。

## 伺服器 SBOM 不完整的原因

- **手工撰寫的 SBOM。**`tool: manual` 的 SBOM 幾乎一定會漏掉元件。請一律用工具產生。
- **`pkg:generic` 元件。**請使用標準的 purl 類型（`pkg:rpm`、`pkg:maven` 等），弱點比對才會生效。
- **沒有後設資料的原始資料夾掃描。**掃描只放了解開的安裝檔、沒有套件資料庫的資料夾，purl 會是空的，整份結果也毫無用處。請以真正的 rootfs 或映像檔為對象。
- **在建置之前掃描。**用尚未建置的原始碼樹產生 SBOM，會漏掉間接相依。

## 使用網頁介面

OS 層與應用程式層也可以從網頁介面（`$SBOM --ui`）執行。把 rootfs 放在啟動介面的資料夾底下，使用**目錄路徑**輸入欄；或是用 **Docker 映像檔**輸入欄掃描容器映像檔。啟動資料夾以外的路徑為了安全會被拒絕；要掃描放在別處的 rootfs，請用 `--ui --mount <dir>` 啟動介面，該資料夾就會以唯讀位置的形式出現在目錄路徑輸入欄中。`--mount /` 會以同樣的方式開放正在執行的主機 OS 本身（`/proc`、`/sys` 這類虛擬檔案系統會自動略過，結果仍然存放在啟動資料夾底下）。靜態連結那一層與選用的合併，從 CLI 執行最直接。

---

> **相關文件**：[依輸入類型](by-input.md) | [韌體分析](firmware.md) | [驗證收到的 SBOM](supplier-sbom.md) | [CLI 參考](../reference/cli.md)
