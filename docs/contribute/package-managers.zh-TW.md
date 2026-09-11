---
description: '一步一步為 BomLens 新增程式語言或套件管理器的支援。'
---

# 新增套件管理器

這份指南逐步說明如何為新的程式語言或套件管理器加上支援。

## 開始之前

新增語言或套件管理器之前，請先確認以下幾點。

- **cdxgen 支援情況**：查看 [cdxgen 支援的專案類型](https://github.com/CycloneDX/cdxgen#supported-project-types)。如果已經有官方的 cdxgen 語言映像檔，只要把它加到路由表就夠了。
- **syft 支援情況**：需要分析二進位檔案或映像檔時，查看 [syft 支援的生態系](https://github.com/anchore/syft#supported-ecosystems)。
- **是否需要自訂分析器**：只有在兩個工具都不支援該生態系時，才考慮自訂分析指令碼。

原始碼掃描採用兩階段設計，會路由到各語言的官方 cdxgen 映像檔，而不是共用單一映像檔。完整脈絡請看[架構](../concepts/architecture.md)。

## 步驟

### 1. 新增語言偵測與映像檔路由

`docker/lib/source-detect.sh` 是 CLI 與網頁介面共用的偵測邏輯。要修改兩個函式。

- `detect_lang()` —— 加上一條規則，從專案的 manifest 檔案判斷語言（例如 Kotlin 會檢查 `build.gradle.kts` —— Kotlin 已經涵蓋在 `java` 分支裡）。
- `img_for_lang()` —— 加上對應該語言的官方 cdxgen 映像檔。

```bash
# img_for_lang() 範例 —— 新增一個語言項目
newlang) echo "ghcr.io/cyclonedx/cdxgen-debian-newlang:$CDXGEN_TAG" ;;
```

### 2. 需要準備相依項目時，修改 build-prep.sh

如果該生態系在沒有鎖定檔案的情況下，cdxgen 無法解析間接相依，就把準備邏輯加到 `docker/lib/build-prep.sh`——它會在 cdxgen 執行前建立鎖定檔案。Rust (`cargo generate-lockfile`) 與 Go (`go mod download`) 是既有的先例。這段準備要寫成盡力而為 (best-effort) 的形式，絕對不能讓掃描因此失敗。

### 3. 新增範例專案

在 `examples/` 目錄底下加入範例專案。

```
examples/kotlin/
├── README.md              # 範例說明
├── build.gradle.kts       # 建置檔案
├── gradle.lockfile        # 鎖定檔案（必要！）
└── src/main/kotlin/
    └── Main.kt
```

> **為什麼鎖定檔案很重要**：cdxgen 會從鎖定檔案取出精確的版本資訊。沒有鎖定檔案，相依項目的偵測就不完整。

### 4. 新增測試

建立 `tests/cases/test-{語言}.sh` 檔案。撰寫方式的細節請看[測試指南](testing.md#writing-tests)。

```bash
#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/../helpers/assert.sh"
source "$(dirname "$0")/../helpers/setup.sh"

TEST_NAME="Kotlin Gradle 原始碼分析"
EXAMPLE_DIR="examples/kotlin"

setup_test "$TEST_NAME"

run_scan \
  --project "KotlinExample" \
  --version "1.0.0" \
  --target "$EXAMPLE_DIR" \
  --generate-only

assert_file_exists "KotlinExample_1.0.0_bom.json"
assert_json_field ".bomFormat" "CycloneDX"
assert_json_field ".specVersion" "1.6"
assert_components_count_gte 1
assert_purl_prefix "pkg:maven/"

teardown_test
```

接著在 `tests/test-scan.sh` 註冊這個新測試。

```bash
source "$(dirname "$0")/cases/test-kotlin.sh"
```

### 5. 更新文件

新增語言之後，要更新下列文件。

- `README.md` —— 加進支援語言清單
- [支援的生態系](../reference/ecosystems.md) —— 為新語言加一節（照既有語言範例的格式寫）
- [CLI 參考](../reference/cli.md) —— 在疑難排解章節的「語言未被偵測」表格加一列：

```markdown
| Kotlin | `build.gradle.kts` + `gradle.lockfile` |
```

### 6. 送出 PR

依照[貢獻指南](https://github.com/sktelecom/bomlens/blob/main/CONTRIBUTING.md)送出 PR。PR 說明裡請包含以下內容。

- 你新增的語言或套件管理器名稱
- 測試執行結果（螢幕截圖或日誌）
- 產出的 SBOM 輸出範例

## 範例：新增 Kotlin 支援

Kotlin 使用 Gradle 建置系統，執行在 JVM 上，因此直接沿用 `detect_lang()` 的 `java` 分支（它會偵測 `*.gradle.kts`）與 `cdxgen-temurin-java21` 映像檔。

### 如何產生 Gradle 鎖定檔案

```bash
cd examples/kotlin

# 在 build.gradle.kts 加上相依項目鎖定設定
cat >> build.gradle.kts << 'EOF'
dependencyLocking {
    lockAllConfigurations()
}
EOF

# 產生鎖定檔案
./gradlew dependencies --write-locks
```

### 預期的 SBOM 輸出（components 的一部分）

```json
{
  "components": [
    {
      "type": "library",
      "name": "kotlin-stdlib",
      "version": "1.9.21",
      "purl": "pkg:maven/org.jetbrains.kotlin/kotlin-stdlib@1.9.21"
    }
  ]
}
```

Kotlin 與 Maven 共用同一個生態系，所以它的 PURL 使用 `pkg:maven/` 前綴。

## 檢查清單

送出新增語言的 PR 之前，請逐項確認。

- [ ] 偵測規則與映像檔路由已加到 `docker/lib/source-detect.sh`。
- [ ] 如果需要準備間接相依，已反映在 `docker/lib/build-prep.sh`。
- [ ] `examples/{語言}/` 底下有範例專案。
- [ ] 範例專案包含鎖定檔案。
- [ ] 已撰寫 `tests/cases/test-{語言}.sh` 測試。
- [ ] 測試已在 `tests/test-scan.sh` 註冊。
- [ ] `./tests/test-scan.sh` 全部執行通過。
- [ ] `README.md` 的支援語言清單已更新。
- [ ] 範例指南已加上範例章節。
- [ ] 使用指南的疑難排解表格已更新。

---

> **相關文件**：[貢獻指南](https://github.com/sktelecom/bomlens/blob/main/CONTRIBUTING.md) | [架構](../concepts/architecture.md) | [測試指南](testing.md)
