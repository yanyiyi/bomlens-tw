---
description: '以 Java、Python、Node.js 等各語言的範例專案實際操作 BomLens，了解偵測所需的檔案，並比較不同語言的 SBOM 輸出結果。'
---

# 支援的生態系

這份指南以 `examples/` 底下各語言的範例專案帶你實際操作。執行任一範例，就能立刻看到 SBOM 的輸出結果。

## 範例目錄結構

```
examples/
├── java-maven/      # Java + Maven
├── java-gradle/     # Java + Gradle
├── nodejs/          # Node.js + npm
├── python/          # Python + pip / Poetry
├── go/              # Go modules
├── ruby/            # Ruby + Bundler
├── php/             # PHP + Composer
├── rust/            # Rust + Cargo
├── dotnet/          # .NET + NuGet
├── swift/           # Swift + SPM (Swift Package Manager)
└── docker/          # Docker 映像檔分析
```

## 通用的執行步驟

所有原始碼範例都以相同方式從儲存庫根目錄執行：把 `--target` 指向範例資料夾，再取一個專案名稱。結果會存放在 `{Project}_{Version}/` 子資料夾中。以 Node.js 範例來說：

<!-- runnable -->
```bash
# 1. 產生 SBOM（在儲存庫根目錄執行）
./scripts/scan-sbom.sh --project "NodeExample" --version "1.0.0" --target examples/nodejs --generate-only

# 2. 確認結果
jq '.components | length' NodeExample_1.0.0/NodeExample_1.0.0_bom.json
```

下面各節列出每種語言可以直接複製貼上的指令。

---

## Java (Maven)

```bash
./scripts/scan-sbom.sh --project "JavaMavenExample" --version "1.0.0" --target examples/java-maven --generate-only
```

用於偵測的檔案：`pom.xml`

```xml
<!-- 範例 pom.xml -->
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.0</version>
  </dependency>
</dependencies>
```

> 注意：cdxgen 會解析整個建置關係圖，因此 BomLens 會把 SBOM 篩選成實際部署的集合——compile 與 runtime 範圍——並移除 test 與 provided 的工具鏈（JUnit、Lombok 之類），讓結果反映真正隨產品發行的內容，而不是完整的建置關係圖。若要保留完整的解析關係圖，請設定 `BOMLENS_MAVEN_FULL_GRAPH=1`（參考 [Docker 映像檔環境變數](docker-image.md#environment-variables)）。

---

## Java (Gradle)

```bash
./scripts/scan-sbom.sh --project "JavaGradleExample" --version "1.0.0" --target examples/java-gradle --generate-only
```

用於偵測的檔案：`build.gradle` 或 `build.gradle.kts`

---

## Node.js

```bash
./scripts/scan-sbom.sh --project "NodeExample" --version "1.0.0" --target examples/nodejs --generate-only
```

用於偵測的檔案：`package.json` + `package-lock.json`（或 `yarn.lock`、`pnpm-lock.yaml`）

> 注意：鎖定檔會把實際安裝的版本精確固定下來。沒有鎖定檔時仍然會從 `package.json` 取得相依項目，但把鎖定檔提交進版本控制，結果才可以重現。

> 注意：SBOM 會篩選成 production 相依項目的集合，因此 devDependencies 會被移除，結果反映真正隨產品發行的內容。若要保留 dev 與 production 合併後的完整關係圖，請設定 `BOMLENS_NODE_FULL_GRAPH=1`（參考 [Docker 映像檔環境變數](docker-image.md#environment-variables)）。

---

## Python

```bash
./scripts/scan-sbom.sh --project "PythonExample" --version "1.0.0" --target examples/python --generate-only
```

用於偵測的檔案：`requirements.txt`，或 `pyproject.toml` + `poetry.lock`

---

## Go

```bash
./scripts/scan-sbom.sh --project "GoExample" --version "1.0.0" --target examples/go --generate-only
```

用於偵測的檔案：`go.mod` + `go.sum`

> 注意：要取得準確的版本雜湊值，`go.sum` 是必要的。請先執行 `go mod tidy`，再重試一次。

---

## Ruby

```bash
./scripts/scan-sbom.sh --project "RubyExample" --version "1.0.0" --target examples/ruby --generate-only
```

用於偵測的檔案：`Gemfile.lock`

---

## PHP

```bash
./scripts/scan-sbom.sh --project "PHPExample" --version "1.0.0" --target examples/php --generate-only
```

用於偵測的檔案：`composer.lock`

---

## Rust

```bash
./scripts/scan-sbom.sh --project "RustExample" --version "1.0.0" --target examples/rust --generate-only
```

用於偵測的檔案：`Cargo.lock`

---

## .NET

```bash
./scripts/scan-sbom.sh --project "DotNetExample" --version "1.0.0" --target examples/dotnet --generate-only
```

用於偵測的檔案：`*.csproj` + `packages.lock.json`

---

## Swift / iOS

```bash
./scripts/scan-sbom.sh --project "SwiftExample" --version "1.0.0" --target examples/swift --generate-only
```

用於偵測的檔案：Swift Package Manager 是 `Package.swift`（加上 `Package.resolved`），CocoaPods 則是 `Podfile.lock`。

相依項目是從已提交的鎖定檔讀取，因此請把這些檔案一併納入掃描範圍：

- Swift Package Manager：`Package.resolved`（若檔案不存在，請先執行 `swift package resolve`）。
- CocoaPods：`Podfile.lock`（由 `pod install` 產生）。BomLens 會直接解析這個檔案，所以執行掃描的機器既不需要 macOS，也不需要安裝 CocoaPods。

> 注意：UIKit 等由 Xcode 管理的平台相依項目需要 macOS，在 Linux 掃描器中不會被解析。

---

## Docker 映像檔分析

Docker 映像檔分析請在專案根目錄執行。

```bash
# 分析公開映像檔
./scripts/scan-sbom.sh \
  --project "NginxSBOM" \
  --version "1.25" \
  --target "nginx:1.25-alpine" \
  --generate-only

# 以 Ubuntu 為基底的映像檔
./scripts/scan-sbom.sh \
  --project "UbuntuSBOM" \
  --version "22.04" \
  --target "ubuntu:22.04" \
  --generate-only
```

---

## 偵測所需的檔案

如果原始碼分析找不到任何相依項目，請確認下列鎖定檔是否存在。

| 語言 | 必要檔案 |
|----------|---------------|
| Java (Maven) | `pom.xml` |
| Java (Gradle) | `build.gradle` 或 `build.gradle.kts` |
| Node.js | `package.json` + `package-lock.json` 或 `yarn.lock` |
| Python | `requirements.txt` 或 `pyproject.toml` + `poetry.lock` |
| Go | `go.mod` + `go.sum` |
| Rust | `Cargo.lock` |
| Ruby | `Gemfile.lock` |
| PHP | `composer.lock` |
| .NET | `*.csproj` + `packages.lock.json` |

## 比較結果

產生的 SBOM 中，PURL（Package URL）格式會因語言而異。

| 語言 | PURL 範例 |
|------|--------------:|
| Java | `pkg:maven/org.springframework.boot/spring-boot@3.2.0` |
| Node.js | `pkg:npm/express@4.18.2` |
| Python | `pkg:pypi/requests@2.31.0` |
| Go | `pkg:golang/github.com/gin-gonic/gin@v1.9.1` |
| Rust | `pkg:cargo/serde@1.0.193` |
| Ruby | `pkg:gem/rails@7.1.2` |
| PHP | `pkg:composer/laravel/laravel@10.3.3` |
| .NET | `pkg:nuget/Newtonsoft.Json@13.0.3` |
| Swift | `pkg:swift/github.com/apple/swift-log@1.5.0` |
| Docker（OS 套件） | `pkg:deb/debian/curl@7.88.1` |

## 疑難排解 {#troubleshooting}

執行範例時如果遇到問題，請參考 [CLI 參考的疑難排解一節](cli.md#troubleshooting)。

---

> **相關文件**：[第一次掃描](../start/first-scan.md) | [CLI 參考](cli.md)
