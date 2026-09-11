# 貢獻指南

> **English**: [CONTRIBUTING.md](CONTRIBUTING.md)

感謝你對 BomLens 感興趣！任何形式的貢獻都歡迎——修正問題、改善文件、新增語言支援等等。

> **相關文件**：[架構](docs/concepts/architecture.md) | [測試指南](docs/contribute/testing.zh-TW.md) | [新增套件管理器](docs/contribute/package-managers.zh-TW.md)

## 目錄

- [行為準則](#行為準則)
- [貢獻方式](#貢獻方式)
- [開發環境設定](#開發環境設定)
- [Pull Request 流程](#pull-request-流程)
- [程式碼風格](#程式碼風格)
- [Commit 訊息規範](#commit-訊息規範)
- [Issue 與討論](#issue-與討論)

## 行為準則

本專案採用以 [Contributor Covenant](https://www.contributor-covenant.org/) 為基礎的[行為準則](CODE_OF_CONDUCT.zh-TW.md)。參與本專案即表示你同意遵守它。安全弱點請依[安全政策](SECURITY.zh-TW.md)以非公開方式通報。

## 貢獻方式

| 類型 | 方式 |
|------|-----|
| 修正問題 | 從 [Issues](https://github.com/sktelecom/bomlens/issues) 找出問題並修正 |
| 新增語言支援 | 請看[新增套件管理器](docs/contribute/package-managers.zh-TW.md) |
| 文件 | 修正錯字、補充範例、改善說明 |
| 測試 | 請看[測試指南](docs/contribute/testing.zh-TW.md) |
| 功能提案 | 先在 [Discussions](https://github.com/sktelecom/bomlens/discussions) 討論 |

撰寫或修改韓文文件時，請遵循[韓文文體指南](docs/korean-style-guide.md)；正體中文文件請遵循[正體中文文體指南](docs/chinese-style-guide.md)。

## 開發環境設定

### 必要條件

- Docker 20.10 以上
- Git
- bash (Linux/macOS) 或 Git Bash (Windows)

### 複製儲存庫並準備環境

```bash
git clone https://github.com/sktelecom/bomlens.git
cd bomlens

# Build the Docker image (when changing it locally)
cd docker && docker build -t sbom-scanner:local .

# Smoke test
cd examples/nodejs
../../scripts/scan-sbom.sh --project "NodeExample" --version "1.0.0" --generate-only
```

## Pull Request 流程

1. 開始新功能或修正問題之前，請先開一個相關的 issue，或在既有的 issue 上說明你的意願。

2. Fork 儲存庫，並建立一個以用途命名的分支。
   ```bash
   git checkout -b feat/add-kotlin-support
   git checkout -b fix/java-gradle-detection
   ```

3. 完成修改，並確認所有測試都通過。
   ```bash
   ./tests/test-scan.sh
   ```

4. 提出清楚說明變更內容的 PR，並確認下方的檢查清單。

5. 回應審閱者的意見，並做出必要的調整。

### PR 檢查清單

- [ ] 我為這次變更加上了測試。
- [ ] `./tests/test-scan.sh` 通過。
- [ ] 我更新了相關文件。
- [ ] 我的 commit 訊息遵循[規範](#commit-訊息規範)。

## 程式碼風格

### Shell 指令碼

- 第一行：`#!/usr/bin/env bash`
- 全域變數：`UPPER_SNAKE_CASE`，區域變數：`lower_snake_case`
- 函式名稱：`lower_snake_case`
- 錯誤處理：在指令碼開頭加上 `set -euo pipefail`
- 偏好長選項而不是短選項（用 `--verbose` 而不用 `-v`）

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_NAME="${1:-}"

function validate_input() {
    local project_name="$1"
    if [[ -z "$project_name" ]]; then
        echo "ERROR: Project name is required" >&2
        return 1
    fi
}
```

### Dockerfile

- 使用官方的基礎映像檔
- 合併 `RUN` 指令以減少層數
- 為每個安裝步驟加上清楚的註解

## Commit 訊息規範

請遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式。

```
<type>(<scope>): <subject>

[body]

[footer]
```

### Type 一覽

| Type | 說明 |
|------|-------------|
| `feat` | 新功能 |
| `fix` | 修正問題 |
| `docs` | 文件變更 |
| `test` | 新增或修正測試 |
| `refactor` | 重構（不改變功能，也不修正問題） |
| `chore` | 建置、相依性與其他變更 |

### 範例

```
feat(scanner): add Kotlin/Gradle support

Add support for Kotlin projects using Gradle build system.
Uses cdxgen with KOTLIN_HOME environment variable.

Closes #42
```

## Issue 與討論

### 問題回報

請使用 [GitHub Issues](https://github.com/sktelecom/bomlens/issues)。附上以下資訊有助於我們更快解決。

- 環境：OS、Docker 版本、指令碼版本
- 重現方式：能重現問題的最少步驟
- 預期結果與實際結果（請附上錯誤訊息）

### 功能提案

請先在 [GitHub Discussions](https://github.com/sktelecom/bomlens/discussions) 討論，然後再轉為 issue。

---

聯絡方式：[opensource@sktelecom.com](mailto:opensource@sktelecom.com)
