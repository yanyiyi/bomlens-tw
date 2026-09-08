---
description: '安裝 BomLens 並產生第一份 SBOM。最快的路徑不需要指令列——下載桌面版應用程式雙擊即可；也可以用網頁介面或 CLI 產生 CycloneDX SBOM、開放原始碼授權聲明與安全報告。'
---

# 快速開始

從安裝到第一份 [SBOM](../concepts/what-is-sbom.md)，一步一步帶你完成。最快的路徑不需要指令列——下載應用程式並雙擊即可。

> 只想快速產生 SBOM 或授權聲明、不想碰指令？請從[免指令列快速開始](../start/no-cli.md)看起。

BomLens 在 Docker 引擎上執行，但桌面版應用程式與網頁介面會替你完成設定並下載映像檔。只有使用 CLI 時才需要自己管理 Docker——如果還沒有安裝引擎，請看下方的[系統需求](#系統需求)。

## 不用指令列開始（建議）

下載 [BomLens Windows 版（.exe）](https://github.com/sktelecom/bomlens/releases/latest/download/BomLens-Setup.exe)後雙擊執行，介面會直接開啟，不會出現主控台視窗。首次執行時會檢查 Docker、下載掃描器映像檔（約 250 MB），然後開啟 http://localhost:8080。目前這個應用程式尚未簽章，因此若 Windows SmartScreen 出現警告，請點選 **更多資訊**，再點 **仍要執行**。逐步點選的操作說明在[免指令列快速開始](../start/no-cli.md)。

![BomLens 桌面版應用程式——啟動畫面顯示 Docker 檢查、映像檔下載進度與容器啟動狀況](../images/desktop-startup-en.png)

比起安裝程式更想用指令碼？`sbom-ui.bat` 這個替代做法，在[免指令列快速開始的方法 B](../start/no-cli.md#path-b--zip-and-double-click-batch-file-alternative)有逐步說明。

## 網頁介面

除了啟動之外幾乎不需要指令：在瀏覽器裡執行、掃描，然後下載結果。

```bash
git clone https://github.com/sktelecom/bomlens.git && cd bomlens
./scripts/scan-sbom.sh --ui     # opens http://localhost:8080; results save under the current folder
#   Windows: double-click scripts\sbom-ui.bat
```

你執行指令的資料夾就是輸出基準——每次掃描都會存到它底下的 `{Project}_{Version}/` 子資料夾（細節見[產出物存放位置](../reference/cli.md#where-outputs-go)）。如果連接埠已被占用，請在前面加上 `UI_PORT=9090`。要把目前資料夾當作原始碼來掃描，就在那個專案資料夾裡執行；GitHub URL、ZIP、SBOM、韌體或 Docker 映像檔則是在介面中提供輸入，所以在任何資料夾執行都可以。

![BomLens 網頁介面——填寫專案名稱、選擇掃描目標，並勾選要產生的項目](../images/web-ui-en.png)

1. 輸入專案名稱與版本。
2. 選擇掃描目標：目前資料夾、GitHub URL、ZIP 上傳、SBOM 上傳、韌體上傳或 Docker 映像檔。
3. 點選「執行掃描」——執行記錄會即時顯示。
4. 檢視或下載 SBOM、授權聲明、風險報告與安全報告。

畫面配置與各掃描目標的細節，見[網頁介面參考](../reference/ui.md)。

## 你的第一份 SBOM（CLI）

進階用法——適合自動化與 CI。請在 clone 下來的儲存庫裡執行。下面的指令會掃描隨附的 Node.js 範例；把 `--target` 指向你自己的資料夾，或是拿掉 `--target` 改為掃描目前的目錄。

<!-- runnable -->
```bash
# All deliverables for the bundled example project
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --target examples/nodejs --all --generate-only
```

這會產生 CycloneDX SBOM、開放原始碼授權聲明、安全報告與風險報告，檔名皆為 `MyApp_1.0.0_…`，全部放在目前目錄底下的 `MyApp_1.0.0/` 子資料夾裡。

```bash
# From a GitHub URL, without cloning first
./scripts/scan-sbom.sh --project "MyApp" --version "1.0.0" --git "https://github.com/org/repo" --all --generate-only
```

其他輸入形式——ZIP 原始碼（`--target app.zip`）、既有的 SBOM（`--analyze sbom.json`）、韌體（`--target dev.bin --firmware`）、Docker 映像檔（`--target nginx:latest`）——都整理在[依輸入類型的指南](../guides/by-input.md)。

> `--generate-only` 只把產出物存在本機、不上傳（弱點掃描照樣會執行）。`--all` 會一次產生授權聲明、SBOM 與風險報告。完整的選項見 [CLI 參考](../reference/cli.md#options-reference)；要把結果上傳到 TRUSCA 或 Dependency-Track 伺服器，請使用 `--trusca <project_id>`（或 `UPLOAD_TARGET`）——步驟見[上傳指南](../guides/upload.md)。

## 認識結果檔案

每次掃描都會落在一個 `{Project}_{Version}/` 子資料夾裡，裡面的檔案則以 `{Project}_{Version}_…` 命名，例如 `MyApp_1.0.0/MyApp_1.0.0_bom.json`：

| 檔案 | 內容 |
|------|------------|
| `{Project}_{Version}_bom.json` | SBOM（CycloneDX 1.6） |
| `{Project}_{Version}_NOTICE.{txt,html}` | 依授權條款分組的開放原始碼授權聲明 |
| `{Project}_{Version}_security.{json,md,html}` | Trivy 弱點報告 |
| `{Project}_{Version}_risk-report.{md,html}` | 開放原始碼風險報告（授權條款 + 弱點），預設會產生 |

SBOM 是 [CycloneDX 1.6](https://cyclonedx.org/) 格式的 JSON：

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.6",
  "version": 1,
  "metadata": {
    "timestamp": "2026-01-15T10:30:00Z",
    "component": {
      "type": "application",
      "name": "MyApp",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "licenses": [
        { "license": { "id": "MIT" } }
      ]
    }
  ]
}
```

### 主要欄位

| 欄位 | 說明 |
|-------|---------|
| `metadata.component` | 被掃描的專案（名稱、版本） |
| `components` | 找到的開放原始碼元件 |
| `components[].purl` | Package URL——套件的唯一識別碼 |
| `components[].licenses` | 授權條款資訊（SPDX ID） |

### 快速檢查 SBOM 的內容

下面的範例使用 `jq`。在 WSL2（Ubuntu）上用 `sudo apt-get install jq` 安裝，Windows Git Bash 則用 `winget install jqlang.jq`。覺得安裝麻煩的話，網頁介面的「摘要」會直接顯示元件數量與授權條款：

<!-- runnable -->
```bash
# Component count
jq '.components | length' MyApp_1.0.0/MyApp_1.0.0_bom.json

# Unique licenses
jq '[.components[].licenses[]?.license.id] | unique' MyApp_1.0.0/MyApp_1.0.0_bom.json
```

## 系統需求

BomLens 只需要一個 Docker *引擎*——不綁定特定產品。

| 項目 | 最低要求 |
|------|---------|
| Docker | 20.10+ |
| 磁碟空間 | 4 GB+（供 Docker 映像檔使用） |
| 作業系統 | Linux、macOS、Windows |
| 架構 | AMD64、ARM64 |

如果你已經在跑 Docker 引擎（Docker Desktop、Rancher Desktop、WSL2 裡的 docker-ce，任何一種都行），只要確認它能正常運作：

```bash
docker run --rm hello-world
```

### 在 Windows 上第一次安裝 Docker

Docker Desktop 最簡單，但組織規模超過一定門檻就需要付費授權。免費的選擇：

| 選項 | 說明 |
|--------|-------|
| **WSL2 + docker-ce**（免費） | 在 WSL2 的 Ubuntu 裡安裝 docker-ce，並在裡面執行 `scan-sbom.sh`。不需要 `.bat`、不需要 Windows 具名管道，也沒有路徑轉換的問題。 |
| **Rancher Desktop**（免費，GUI） | 可直接取代 Docker Desktop 的圖形介面，附帶 `docker` CLI。雙擊 `.bat` 與桌面版應用程式的流程都能照用。 |
| Docker Desktop | 最容易，但組織內使用時要確認授權條款。 |

WSL2 + docker-ce 的精簡版做法（以管理員身分開啟 PowerShell）：

```powershell
wsl --install -d Ubuntu          # reboot, then finish Ubuntu setup
```

接著在 WSL（Ubuntu）裡執行：

```bash
sudo apt-get update && curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"  # log out and back in to apply
docker pull ghcr.io/sktelecom/bomlens:latest
```

之後在 WSL 裡 clone 儲存庫，照上面的方式執行 `./scripts/scan-sbom.sh ...`。若不使用 WSL2 而要在 Windows 上用 CLI，請安裝 [Git for Windows](https://git-scm.com/download/win)（Git Bash），並改用 `scripts\scan-sbom.bat`。

## 下一步

| 目標 | 文件 |
|------|-----|
| 各種輸入形式（GitHub、ZIP、SBOM、韌體） | [依輸入類型](../guides/by-input.md) |
| 授權聲明、安全與風險報告、網頁介面 | [產生報告指南](../guides/reports.md) |
| 所有選項與 CI/CD | [CLI 參考](../reference/cli.md) |
| 各程式語言的範例專案 | [支援的生態系](../reference/ecosystems.md) |
| 內部運作 | [架構](../concepts/architecture.md) |
| 參與貢獻 | [貢獻指南](https://github.com/sktelecom/bomlens/blob/main/CONTRIBUTING.md) |

---

> **相關文件**：[CLI 參考](../reference/cli.md) | [依輸入類型](../guides/by-input.md)
