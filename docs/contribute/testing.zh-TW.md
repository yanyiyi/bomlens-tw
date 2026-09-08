---
description: 'BomLens 的測試結構——如何執行測試套件、撰寫新測試，以及對失敗除錯。'
---

# 測試指南

這份指南說明 BomLens 的測試結構、執行與撰寫測試的方式，以及失敗時的除錯步驟。

## 測試結構

```
tests/
├── test-scan.sh          # 整合測試進入點（執行全部測試）
├── helpers/
│   ├── assert.sh         # 斷言（assertion）輔助函式
│   └── setup.sh          # 測試環境的初始化／清理
└── cases/
    ├── test-java.sh      # Java 測試案例
    ├── test-nodejs.sh    # Node.js 測試案例
    ├── test-python.sh    # Python 測試案例
    ├── test-go.sh        # Go 測試案例
    └── test-docker.sh    # Docker 映像檔分析測試
```

## 執行測試

### 執行全部測試

```bash
./tests/test-scan.sh
```

成功時的輸出範例：

```
[PASS] Java Maven 原始碼分析
[PASS] Java Gradle 原始碼分析
[PASS] Node.js npm 原始碼分析
[PASS] Python pip 原始碼分析
[PASS] Go modules 原始碼分析
[PASS] Docker 映像檔分析（nginx:alpine）
─────────────────────────────────
6 個測試中有 6 個通過（0 個未通過）
```

### 只測試特定語言

```bash
./tests/cases/test-java.sh
./tests/cases/test-nodejs.sh
```

## 執行模式

| 環境變數 | 值 | 輸出內容 |
|-----------|-----|----------|
| （無） | — | 只印出測試結果摘要 |
| `VERBOSE` | `true` | 印出每個步驟的主要進度日誌 |
| `DEBUG_MODE` | `true` | 包含 Docker 執行日誌，以及 cdxgen／syft 的完整輸出 |
| `LOG_FILE` | 檔案路徑 | 把日誌存到檔案 |

```bash
# Verbose 模式
VERBOSE=true ./tests/test-scan.sh

# Debug 模式（用於分析問題）
DEBUG_MODE=true ./tests/test-scan.sh

# 把日誌存成檔案
LOG_FILE="./test-results.log" ./tests/test-scan.sh
```

Verbose 模式的輸出範例：

```
[INFO] 開始 Java Maven 測試
[INFO] 準備 Docker 映像檔…
[INFO] 產生 SBOM…
[PASS] Java Maven 原始碼分析
  - 偵測到的元件：47 個
  - PURL 格式：pkg:maven/...
  - 授權條款資訊：已包含
```

## 撰寫測試 {#writing-tests}

要新增一種語言的支援時，請照下面的格式撰寫測試案例。

```bash
# tests/cases/test-kotlin.sh

#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/../helpers/assert.sh"
source "$(dirname "$0")/../helpers/setup.sh"

TEST_NAME="Kotlin Gradle 原始碼分析"
EXAMPLE_DIR="examples/kotlin"

setup_test "$TEST_NAME"

# 產生 SBOM
run_scan \
  --project "KotlinExample" \
  --version "1.0.0" \
  --target "$EXAMPLE_DIR" \
  --generate-only

# 斷言
assert_file_exists "KotlinExample_1.0.0_bom.json"
assert_json_field ".bomFormat" "CycloneDX"
assert_json_field ".specVersion" "1.6"
assert_components_count_gte 1
assert_purl_prefix "pkg:maven/"  # Kotlin 使用 Gradle／Maven 生態系

teardown_test
```

接著在 `tests/test-scan.sh` 註冊這個新測試。

```bash
# 加在 tests/test-scan.sh 內部
source "$(dirname "$0")/cases/test-kotlin.sh"
```

完整流程請看[套件管理器指南](package-managers.md)。

## 斷言函式參考

| 函式 | 說明 |
|------|------|
| `assert_file_exists <file>` | 確認檔案存在 |
| `assert_json_field <field> <expected>` | 確認 JSON 欄位的值 |
| `assert_components_count_gte <count>` | 確認元件數量至少有 N 個 |
| `assert_purl_prefix <prefix>` | 確認 PURL 前綴格式 |
| `assert_license_exists` | 確認至少有一筆授權條款資訊 |
| `assert_no_empty_versions` | 確認沒有空白的版本欄位 |

### 撰寫測試的原則

**獨立性**：每個測試都不能依賴其他測試。不論執行順序如何改變，結果都必須一致。

**清理**：一定要在 `teardown_test` 刪除產生的檔案，避免影響下一個測試。

**名稱明確**：`TEST_NAME` 要清楚表達這個測試驗證的是什麼。

**斷言精簡**：只斷言必要的項目，避免過度檢查。

## 記錄日誌與除錯

### 直接檢查產生的 SBOM

```bash
# 計算元件數量
jq '.components | length' NodeExample_1.0.0_bom.json

# 列出所有 PURL
jq '[.components[].purl]' NodeExample_1.0.0_bom.json

# 列出授權條款
jq '[.components[].licenses[]?.license.id] | unique' NodeExample_1.0.0_bom.json
```

### 針對特定測試除錯

```bash
DEBUG_MODE=true ./tests/cases/test-nodejs.sh
```

## CI 整合

### GitHub Actions

```yaml
- name: Run integration tests
  run: |
    VERBOSE=true ./tests/test-scan.sh

- name: Upload test logs on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: test-logs
    path: "*.log"
```

### 測試失敗時的處理

1. 加上 `DEBUG_MODE=true` 重新執行，查看詳細日誌。
2. 在失敗語言的範例目錄裡直接執行 `scan-sbom.sh`。
3. 把 Docker 映像檔更新到最新版本：`docker pull ghcr.io/sktelecom/bomlens:latest`
4. 如果問題仍未解決，請附上你的環境資訊與日誌，回報到 [GitHub Issues](https://github.com/sktelecom/bomlens/issues)。

---

> **相關文件**：[貢獻指南](https://github.com/sktelecom/bomlens/blob/main/CONTRIBUTING.md) | [架構](../concepts/architecture.md) | [新增套件管理器](package-managers.md)
