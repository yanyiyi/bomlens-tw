# 正體中文在地化文體指南

這份文件是 BomLens 正體中文（`zh-TW`，台灣用語）翻譯的基準。初版由機器產出、已經母語者
校對一輪（2026-09，110 條修訂），新增或修改字串時請以本文的術語表與規則為準；[`korean-style-guide.md`](korean-style-guide.md)
是同一套精神的韓文版本。行文慣例大致依循
[Mozilla 正體中文風格指南](https://mozilla-l10n.github.io/styleguides/zh-TW/)。

翻譯涵蓋三個層次，各自的檔案位置是：

| 層次 | 檔案 |
|------|------|
| 網頁介面 | `docker/web/frontend/src/locales/zh-TW/common.json` |
| CLI 報告 | `docker/lib/i18n/report-strings.zh-TW.json` |
| 掃描知識庫 | `docker/lib/*.json` 的 `_zh` 欄位與 `zh` 子鍵 |

三者共用同一套術語。改動任一處的用詞時，另外兩處要一起改，否則同一個詞會在介面與報告
裡長得不一樣。

## 絕對不動的東西

只調整文體，內容一個字都不改。以下一律保留原文：

- 程式碼區塊、指令、選項旗標（`--lang`、`--byte-stable` 等）
- 檔案路徑、檔名樣式（`{Project}_{Version}_bom.json`）、URL
- CycloneDX 與 SPDX 欄位名、授權識別碼（`Apache-2.0`、`MIT`）、`purl`
- 版本號、雜湊值、數量、比率等測量值
- 專有名詞：BomLens、SK Telecom、cdxgen、syft、Trivy、Docker、Hugging Face
- 插值標記 `{{count}}`、`{{name}}`：大括號內的名稱改一個字，該處就會顯示空白
- 報告模板的佔位符：printf 的 `%s`（**順序不可調換**，bash 的 printf 沒有位置參數）
  與 jq 的 `%n%`、`%a%`、`%b%`、`%v%`

授權識別碼錯一個字、選項名少一個字元，工具就會誤判。有疑慮時保留原文。

## 排版慣例

- 標點一律全形：，。：；？！（）、「」。內層引號用『』，刪節號用「…」。
- 中文與英文、數字之間空一個半形空格：「共 3 個元件」「掃描 SBOM 檔案」。
  全形標點前後不加空格。
- 語氣簡潔，是書面語但不生硬。按鈕與標籤用短語，說明文字用完整句子。
- 不要堆疊「讓我們」「請注意，」這類開場，也不要為了對齊英文而寫出翻譯腔的長句。

## 術語表

同一個概念在不同檔案寫成不同的詞，搜尋就會失效，讀起來也像機器翻的。以下是 2026-09
初版翻譯定下的標準，新字串沿用：

| English | zh-TW |
|---------|-------|
| component | 元件 |
| dependency | 相依性（清單語境用「相依項目」） |
| direct / transitive dependency | 直接相依 / 間接相依 |
| vulnerability | 弱點 |
| license | 授權條款（短語境可用「授權」） |
| open-source notices | 開源授權聲明 |
| scan / scanner | 掃描 / 掃描器 |
| conformance | 符合性 |
| compliance | 合規 |
| risk assessment | 風險評估 |
| severity | 嚴重程度 |
| baseline | 基準 |
| mandatory / recommended | 必要 / 建議 |
| passed / failed | 通過 / 未通過 |
| package | 套件 |
| repository | 儲存庫 |
| container image | 容器映像檔 |
| model card | 模型卡 |
| weights / training data | 權重 / 訓練資料 |
| inference / quantization / fine-tuning | 推論 / 量化 / 微調 |
| provenance | 來源證明 |
| signature | 簽章 |
| checksum / hash / digest | 雜湊值 |
| artifact | 產出物 |
| deprecated | 已棄用 |
| fallback | 後備 |
| crosswalk | 法規對照 |
| human review | 人工檢視 |
| end-of-life | 已終止支援 |
| not affected (VEX) | 不受影響 |
| gap | 缺漏 |
| disclaimer | 免責聲明 |

2026-09 母語校對（Round 1 + 2）追加或改訂的條目：

| English | zh-TW | 為什麼 |
|---------|-------|--------|
| metadata | 後設資料 | 統一用語，不用「中繼資料」 |
| open source | 開放原始碼 | 不用「開源程式碼」 |
| learn more | 了解更多 | 介面用語，「深入瞭解」語氣過重 |
| needs review | 需人工檢視 | 補「人工」以與介面的「檢視」動作區隔 |
| KEV / known exploited | 已知遭利用 | 保留 known 的語意 |
| fixed（弱點狀態） | 已有修正可用 | 「已修正」會被讀成環境已完成修補 |
| fixed in（版本欄） | 修正版本 | 是欄位名，不是「修正於」 |
| dependency graph | 相依關係圖 | graph edges 譯「連線」，不用「邊」 |
| credential | 認證資訊 | 「憑證」易與 certificate 混淆 |
| vendored | 已複製納入 | 介面 badge 用短語，不保留英文 |
| derivatives | 衍生物 | 「製作衍生物」比「允許衍生」完整 |
| publish | 發佈 | 全案統一 |

保留英文的情況：規格與法規縮寫（G7、CISA、NTIA、BSI TR-03183-2、EU CRA）、`Copyleft`
這個技術名詞、以及嚴重程度等級。嚴重程度採**中英並列**（如「高 High」），保留英文以便和
其他資安工具與報告對照。

授權分級標籤在**介面**與**報告**刻意不同，這不是漏譯：

- 網頁介面中文化，但保留 Copyleft：`網路型 Copyleft`、`強 Copyleft`、`弱 Copyleft`、
  `寬鬆式`、`未分類`。
- 報告維持英文（`Network copyleft`、`Permissive`…），因為表頭必須對得上
  `bomlens:licenseClass` 的實際值，讀者會直接 grep 它。`tests/test-postprocess.sh`
  兩邊都有守門測試。

其餘拿不定主意時，看韓文翻譯怎麼處理：韓文保留原文的地方，中文也保留。

不要自創詞。找不到通用譯法時，用既有的說法把意思講清楚，不要造新詞。

## 契約邊界

只有給人讀的 Markdown 與 HTML 會翻譯。以下維持英文，這是機器契約，測試會驗：

- SBOM 本身（`_bom.json`）
- `_conformance.json` 與 `_ai-profile.json` 的英文欄位
- 狀態碼、元素 id、PURL、授權識別碼

翻譯是以兄弟欄位的形式伴隨英文欄位存在（`label` 旁邊放 `label_zh`），不是取代它。
報告的 JSON 產出在 `--lang en`、`--lang ko`、`--lang zh-TW` 三種模式下必須完全相同。

## 校對強度

只調整文體，語意、結構、資訊 100% 保留。如果一份檔案改動的比例過高，先確認自己是不是
在改內容而不是潤稿；變成重寫就該停下來。

翻譯的鍵集合由 CI 把關：網頁介面跑 `npm run i18n:check`（三個語言的鍵必須完全一致），
報告目錄與知識庫的欄位對齊由 `tests/test-aibom.sh` 檢查。刪掉一個鍵不會退回英文，
而是直接把鍵名印在報告裡——這是刻意的，讓缺漏看得見。
