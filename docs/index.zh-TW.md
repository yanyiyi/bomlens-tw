---
description: 'BomLens 是本機優先的 SBOM 產生器與開放原始碼風險評估工具。不論是原始碼、容器、二進位檔案、韌體，或是你收到的 SBOM，都能產出 CycloneDX SBOM、開放原始碼授權聲明，以及安全與授權風險報告——指令列或網頁介面皆可，不需要 SaaS。'
hide:
  - toc
---

# 在本機完成 SBOM 產生與開放原始碼風險評估

針對單一專案、以本機優先為原則的 SBOM 產生器與開放原始碼風險評估工具——不需要 SaaS，也不需要帳號。輸入可以是原始碼、容器映像檔、二進位檔案、韌體、你收到的 SBOM，或是 HuggingFace 上的 AI 模型，一次執行就能產出 [SBOM](concepts/what-is-sbom.md)（CycloneDX 1.6）、開放原始碼授權聲明與安全風險報告。遇到 AI 模型時會建立 CycloneDX ML-BOM，並依 [AI 的 G7 最低要素](guides/ai-model.md)檢查，這些要素的叢集與 EU AI Act 的 Annex IV 有相當程度的重疊。

[開始使用](start/first-scan.md){ .md-button .md-button--primary } [試用示範](https://bomlens.ospo.tw/demo/){ .md-button } [下載 Windows 版（.exe）](https://github.com/sktelecom/bomlens/releases/latest/download/BomLens-Setup.exe){ .md-button }

[![最新版本](https://img.shields.io/github/v/release/sktelecom/bomlens)](https://github.com/sktelecom/bomlens/releases/latest)  Windows 安裝程式需要 Docker 引擎已經在執行；請參考下方的[免指令列快速開始](start/no-cli.md)。

想在安裝任何東西之前，先看看結果長什麼樣子？[線上示範](https://bomlens.ospo.tw/demo/)就是真正的網頁介面，裡面每一種輸入各放了一份已完成的掃描：以原始碼掃描的 Spring Boot 專案、容器映像檔、裝置韌體映像檔、以 CycloneDX ML-BOM 呈現的 AI 模型，以及一份依格式要求檢查過的供應者 SBOM。不必安裝任何東西，也不會上傳任何資料：這是把一般本機執行所產生的結果凍結下來的副本。

不想用指令列？下載安裝程式並雙擊即可。這需要 Docker 引擎；在 Windows 上，免費的 [Rancher Desktop](https://rancherdesktop.io/) 很好用。逐步的操作說明在[免指令列快速開始](start/no-cli.md)。

![BomLens 網頁介面顯示掃描結果：帶有各項數量與嚴重程度／授權條款摘要的摘要頁、可篩選的元件表格、弱點清單、以關係圖與樹狀呈現的相依性，以及授權條款區段](images/web-ui-demo.gif){ .home-shot }

## 接下來看什麼

<div class="grid cards" markdown>

-   :material-rocket-launch: __快速開始__

    從安裝到第一份 SBOM（桌面版應用程式、網頁介面與 CLI）。

    [:octicons-arrow-right-24: 快速開始](start/first-scan.md)

-   :material-cursor-default-click: __免指令列快速開始__

    用桌面版應用程式產生 SBOM 與授權聲明——完全不需要指令列。

    [:octicons-arrow-right-24: 快速開始](start/no-cli.md)

-   :material-format-list-bulleted: __輸入情境__

    GitHub URL、ZIP、本機原始碼、既有的 SBOM、韌體。

    [:octicons-arrow-right-24: 情境指南](guides/by-input.md)

-   :material-file-document-check: __供應者 SBOM__

    驗證你收到的 SBOM，並產出風險報告。

    [:octicons-arrow-right-24: 供應者 SBOM](guides/supplier-sbom.md)

-   :material-robot-outline: __AI 模型 SBOM__

    為 HuggingFace 模型建立 ML-BOM，依 G7 最低要素檢查，並對應到 EU AI Act。

    [:octicons-arrow-right-24: AI 模型 SBOM](guides/ai-model.md)

-   :material-shield-check: __授權聲明與安全報告__

    產出物的產生與解讀，以及網頁介面的用法。

    [:octicons-arrow-right-24: 產生報告](guides/reports.md)

-   :material-cog: __CLI 參考__

    所有選項、分析模式、CI/CD。

    [:octicons-arrow-right-24: CLI 參考](reference/cli.md)

</div>
