---
description: '將掃描器整合進 CI，讓 SBOM 隨每次建置更新，並以 Critical 弱點閘門讓管線失敗。'
---

# 在 CI/CD 中使用

SBOM 是相依性在某個時間點的快照，因此相依性一有變動就必須重新產生，才能持續與程式碼一致。整合進 CI 後，SBOM 會隨每次建置與發佈自動更新、附在發佈產出物上，並成為弱點政策閘門的判斷依據。

> **重要**：掃描器只回報、不中斷建置（report-only）——它會回報弱點，但一律以成功狀態結束。若要在出現 Critical（嚴重）弱點時讓建置失敗，請自行加上一個檢查所產生 `*_security.json` 的步驟（閘門範例見下文）。

想降低負擔，可依觸發條件切分分析深度：在 PR 只快速產生 SBOM（`--generate-only --no-report`）；在 `main` 與發佈則全部產生（`--all --generate-only`）並套用閘門。

### GitHub Actions

`ubuntu-latest` 執行器已內建 `jq`。

```yaml
name: SBOM

on:
  pull_request:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  # PR：只輕量產生 SBOM（略過報告）
  sbom-pr:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker pull ghcr.io/sktelecom/bomlens:latest
      - name: Generate SBOM (lightweight)
        run: |
          ./scripts/scan-sbom.sh \
            --project "${{ github.event.repository.name }}" \
            --version "${{ github.sha }}" \
            --generate-only --no-report
      - uses: actions/upload-artifact@v4
        with:
          name: sbom-pr
          path: "*_bom.json"

  # main 與發佈：完整產生 + 弱點閘門
  sbom-full:
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker pull ghcr.io/sktelecom/bomlens:latest
      - name: Generate SBOM + reports
        run: |
          ./scripts/scan-sbom.sh \
            --project "${{ github.event.repository.name }}" \
            --version "${{ github.sha }}" \
            --all --generate-only

      # 掃描器只回報，一律以成功結束。若存在 Critical 弱點，就在這裡讓建置失敗。
      - name: Fail on Critical vulnerabilities
        run: |
          CRIT=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' *_security.json)
          echo "Critical vulnerabilities: $CRIT"
          if [ "$CRIT" -gt 0 ]; then
            echo "::error::$CRIT critical vulnerability(ies) found"
            exit 1
          fi

      - uses: actions/upload-artifact@v4
        if: always()   # 閘門失敗時仍保留報告
        with:
          name: sbom
          path: |
            *_bom.json
            *_security.*
            *_risk-report.*
```

### GitLab CI

`docker:latest` 映像檔沒有 `jq`，請在閘門之前先安裝。

```yaml
generate-sbom:
  stage: security
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - apk add --no-cache jq
  script:
    - docker pull ghcr.io/sktelecom/bomlens:latest
    - ./scripts/scan-sbom.sh
        --project "$CI_PROJECT_NAME"
        --version "$CI_COMMIT_SHA"
        --all --generate-only
    # 將只回報的掃描器當作建置閘門：若存在 Critical 弱點就失敗
    - |
      CRIT=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' *_security.json)
      [ "$CRIT" -eq 0 ] || { echo "$CRIT critical vulnerability(ies) found"; exit 1; }
  artifacts:
    when: always
    paths:
      - "*_bom.json"
      - "*_security.*"
```
