# 安全政策（Security Policy）

> **English**: [SECURITY.md](SECURITY.md)

BomLens 是處理軟體供應鏈安全的工具，因此工具本身的安全同樣重要。若你發現弱點，請依負責的程序通報。

## 支援的版本（Supported versions）

安全修正以最新的發佈版本為準提供。Docker 映像檔的 `ghcr.io/sktelecom/bomlens:latest` 標籤（舊名別稱：`sbom-scanner:latest`）反映最新的安全修補。

| 版本 | 是否支援 |
|---------|-----------|
| 最新發佈版本（`:latest`） | ✅ |
| 更舊的版本 | ❌ |

若你使用的是較舊的版本，請先升級到最新的發佈版本，再確認問題是否仍會重現。

## 通報弱點（Reporting a vulnerability）

請**不要**開公開的 issue。請透過下列兩個管道之一，以非公開方式通報。

### 1. GitHub Private Vulnerability Reporting

在本儲存庫的 **Security** 分頁點選 **Report a vulnerability**，即可提交非公開的安全公告（advisory）草稿。內容只有維護者看得到，修正與公開揭露的時程也能在同一處協調。

### 2. 電子郵件

你也可以寄信到 [opensource@sktelecom.com](mailto:opensource@sktelecom.com)。

### 通報時建議附上的資訊

- 弱點的類型與影響範圍
- 有問題的檔案路徑或程式碼位置
- 重現步驟或概念驗證（PoC）
- 可能的話，附上受影響的版本與環境（OS、Docker 版本）

## 處理流程（Process）

收到通報後，我們會依下列方式回應。本專案以志願者為基礎，因此以下時限是目標值，可能會因情況而異。

- 在 3 個營業日內確認收到。
- 檢視後判斷是否為弱點及其嚴重程度，並告知通報者。
- 若需要修正，會準備修補程式，並與通報者協調公開揭露的時機。
- 修正發佈後，會公開安全公告，並在通報者希望的情況下標示其為貢獻者。

非公開的通報內容在修正與協調完成之前，不會對外分享。
