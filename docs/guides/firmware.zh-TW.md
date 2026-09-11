---
description: '以 BomLens 的韌體分析解開網路裝置的韌體二進位檔案（.bin、squashfs 等），識別元件並檢查 SBOM、授權條款與弱點。'
---

# 韌體分析指南

說明如何在網路裝置的韌體二進位檔案（`.bin`、`.img`、squashfs 等）中識別元件，並檢查 SBOM、授權條款與弱點。當你手上只有二進位檔案、沒有原始碼時就用它，例如從供應者收到的韌體。

## 運作方式

韌體是把一套作業系統與數十個函式庫整包封起來的單一檔案。把韌體檔案直接丟進一般掃描，幾乎什麼都偵測不到，只會得到一份空的 SBOM。韌體分析會先解開封裝取出內容物，再識別元件。

1. 解開韌體的封裝（unblob，後備依序為 `unsquashfs`、`7z`、`binwalk`），取出 rootfs（根檔案系統）。
2. 以 `syft` 識別由套件管理器（opkg、dpkg、apk、rpm）安裝的元件。一個映像檔可以帶有多個 檔案系統，不在 rootfs 裡面、而是擺在它旁邊的樹狀結構也會一併編入清單。可辨識的有三種， 判斷依據都是其中記錄了安裝什麼，而不是資料夾的名稱：容器映像檔的儲存區，靠 Docker 留下的映像檔索引辨識（交換器作業系統常見的配置，實際在跑的東西大多都在容器裡）；帶有 自己的套件資料庫的第二個檔案系統；以及解譯器安裝的函式庫集合，例如 Python 的 `site-packages`。設定 `FW_EXTRA_ROOTS=false` 就只讀 rootfs。來自容器儲存區的元件會把 自己所屬的映像檔記在 `bomlens:container:image`，而映像檔本身也會以 `container` 元件的形式出現。容器裡由 `dpkg` 安裝的套件，會依該容器所執行的散布版來識別——這個值是 從它自己那幾層的 `os-release` 讀來的——弱點比對步驟才有東西可以對照；這類套件會帶有 `bomlens:purlSource`。匯出成 SPDX 時這些資訊都會保留：映像檔與散布版在那裡都是 套件，所屬關係則是 `CONTAINS` 關係。
3. 以 `cve-bin-tool` 找出經過 strip 的靜態二進位檔案（busybox、openssl、dropbear 等）的版本與弱點。
4. 把兩份結果合併成一份 SBOM，接著執行與一般掃描相同的後處理（授權條款、CVE、簽章）。

## 準備韌體映像檔

韌體分析需要另一個映像檔，裡面收錄了解開封裝與識別二進位檔案的工具（unblob、cve-bin-tool 等）。這些都是 GPL 家族的工具，因此不放進輕量的基礎映像檔，而是切分成一個 opt-in 的韌體映像檔。

```bash
docker pull ghcr.io/sktelecom/bomlens-firmware:latest
```

這個映像檔就是預設值，所以只要加上 `--firmware`，不必另外設定就會把它 pull 下來。想用別的標籤，就設定環境變數 `SBOM_FIRMWARE_IMAGE`。

在網頁介面與桌面版應用程式裡不必自己執行那道指令：韌體輸入處會提供一個標示下載容量的「立即下載」按鈕，下載期間也會顯示已完成幾層。就算沒有先下載，第一次韌體掃描時仍然會把映像檔 pull 下來，差別只在於等待發生在掃描之前，還是在掃描過程中。

## 執行方式

不論用網頁介面還是 CLI，韌體分析都需要上面那個韌體映像檔。

### 從網頁介面

照平常的方式啟動網頁介面就好——你不需要自己把它指向這個映像檔。只要 Docker 引擎正在 執行，基礎 UI 映像檔就會透過 Docker socket 把這個韌體映像檔以 sibling 容器的方式啟動， 韌體上傳方塊也會自動出現。

```bash
./scripts/scan-sbom.sh --ui
#   Windows：直接雙擊 sbom-ui.bat
```

只有在想用別的標籤或內部鏡像 registry 時，才需要設定 `SBOM_FIRMWARE_IMAGE`。它只有作為 真正的環境變數時才會生效——雙擊 `.bat` 所讀取的設定檔 `bomlens.settings.txt` 不支援 這個鍵。

```bash
SBOM_FIRMWARE_IMAGE=<內部鏡像>:<標籤> ./scripts/scan-sbom.sh --ui
```

輸入專案名稱與版本，選擇韌體上傳方塊，上傳檔案後執行。線上第一次執行時會下載 CVE 資料庫，這段期間介面會顯示下載進度列。

### 從 CLI

把收到的韌體檔案傳給 `--target`，並加上 `--firmware`：

```bash
./scripts/scan-sbom.sh --project device-fw --version 1.0.0 \
  --target "./device.bin" --firmware \
  --all --generate-only
```

- 可辨識的副檔名（`.bin`、`.img`、`.squashfs`、`.ubi`、`.ubifs`、`.trx`、`.chk`、`.fw`、`.rom`）即使沒有 `--firmware` 也會自動偵測，但還是建議明確指定。
- 產出物與一般掃描相同，共三種：開放原始碼授權聲明 (`_NOTICE`)、SBOM (`_bom.json`) 與風險報告 (`_risk-report`)。

## CVE 比對：線上與離線

靜態二進位檔案的 CVE 比對是用 cve-bin-tool 搭配它自己的弱點資料庫。韌體映像檔採用混合式安排出貨，因此同一個映像檔在實體隔離 (air-gapped) 與連網環境都能運作。

- 映像檔在建置時就內建資料庫的話，韌體掃描會在掃描當下以離線方式比對 CVE。這條路徑快，也適合實體隔離環境。
- 沒有內建資料庫但網路可連線時，cve-bin-tool 會在執行期間從 NVD 下載資料庫。第一次執行會很慢；下載期間網頁介面會顯示下載進度列。
- 內建資料庫與網路都沒有時，掃描會降級為只做元件識別（沒有 CVE），並把原因寫進記錄，而不是無聲無息地把 CVE 階段拿掉。

`CVE_BIN_TOOL_MODE` 用來選擇行為：`auto`（預設；優先使用內建資料庫，否則在連網時下載）、`offline`、`online` 或 `components-only`。

這份資料庫彙整自多個來源（NVD、PURL2CPE 等），不只有 NVD。cve-bin-tool 會印出這則告示：「This product uses the NVD API but is not endorsed or certified by the NVD.」

OSV (Open Source Vulnerabilities) 的安全公告沒有內建，這是為了讓再散布的映像檔不含 share-alike 資料。網頁介面提供一個 opt-in 開關「Include OSV advisories」，開啟後只會為那一次掃描從 osv.dev 取得 OSV，也就是資料直接下載到你自己的機器上，而不是隨映像檔一起出貨。

## 授權條款注意事項

韌體映像檔裡有 GPL 工具（cve-bin-tool、sasquatch，以及 unblob 所依賴的部分 extractor）。shell 指令碼只是把它們當成獨立行程來呼叫，因此 Copyleft 不會傳染到我們自己的程式碼；但把 GPL 的二進位檔案放進映像檔再散布，仍然帶有隨附授權條款全文與提供源碼的義務。完整清單請看[收錄工具的授權條款](https://github.com/sktelecom/bomlens/blob/main/THIRD_PARTY_LICENSES.md)。GPL 的分析工具只會放在這個韌體映像檔裡。不過包含基礎映像檔在內，每個映像檔都以 Debian 為基底，所以全部都同時帶有 GPL 系統套件；這些套件的源碼取得方式也寫在同一份文件裡。

## 限制

- 這套開放原始碼工具堆疊大約能偵測到 60–85% 的元件，結果非常取決於韌體的種類、strip 的程度，以及封裝是否成功解開。
- 少了函式層級的二進位指紋比對，經過 strip 或內聯的元件，以及版本字串被移除的二進位檔案都會漏掉。
- 靜態連結的函式庫、廠商改過的 squashfs、加密或簽章過的韌體，以及被改名的函式庫，會偵測不到或判斷錯誤。
- 產出的 SBOM 是盡力而為 (best-effort) 的估計值，因此請不要把它當成法律上授權條款合規的唯一依據。

---

> **相關文件**：[第一次掃描](../start/first-scan.md) | [依輸入類型的指南](../guides/by-input.md) | [CLI 參考](../reference/cli.md) | [授權聲明與安全報告指南](../guides/reports.md)
