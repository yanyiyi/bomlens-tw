# 翻譯託管(Weblate)

翻譯託管在 [Codeberg Translate](https://translate.codeberg.org)。這個目錄放所有
PO 檔與 po4a 設定;`po/*.cfg` 是 po4a 的設定,`po/<元件>/` 是各元件的 PO。

## 五個元件

| 元件 | 格式 | File mask | Template / base |
|---|---|---|---|
| Web UI | i18next JSON v4 | `docker/web/frontend/src/locales/*/common.json` | base: `.../en/common.json` |
| 報告字串 | gettext PO | `po/reports/*.po` | `po/reports/reports.pot` |
| 文件站 | gettext PO | `po/docs/*.po` | `po/docs/docs.pot` |
| 治理文件 | gettext PO | `po/governance/*.po` | `po/governance/governance.pot` |
| 知識庫 | gettext PO | `po/knowledge/*.po` | `po/knowledge/knowledge.pot` |

Web UI 是**唯一不經過 PO** 的元件——Weblate 直接讀寫 i18next JSON,也就是程式讀的那個
檔,不需要任何轉換。格式一定要選 **i18next JSON v4**,普通 `JSON file` 不認
`*_one` / `*_other` 複數後綴。

其餘四個都是 **bilingual PO**(英文在 `msgid`),所以 repo 裡不需要英文的目錄檔。這對
報告字串特別重要:英文報告路徑刻意完全不讀目錄檔,那正是英文輸出能逐位元組不變的原因。

第二個以後的元件,**Source code repository 填 `weblate://<專案>/web-ui`**,共用第一個
元件的 git clone——只 clone 一次,所有元件的翻譯合併進同一批提交。

## Weblate 推回來之後

程式與網站讀的都不是 PO,所以每次同步都要重新產生:

```sh
scripts/update-po.sh
```

它會做四件事:

1. `po4a po/docs.cfg` —— 產生 25 頁 `docs/**/*.zh-TW.md`
2. `po4a po/governance.cfg` —— 產生 4 份根目錄 `*.zh-TW.md`
3. `node scripts/kb-po.mjs --from-po <lang>` —— 寫回 6 個登錄檔 JSON 的 `_ko`/`_zh` 欄位
4. `scripts/po-to-report-strings.sh <lang>` —— 產生 `docker/lib/i18n/report-strings.*.json`

需要 `po4a` 與 `gettext`(`brew install po4a gettext`),第 3 步需要 Node。

之後跑 `bash tests/test-postprocess.sh` 與 `mkdocs build --strict`。

## `.zh-TW.md` 是產出物,不要手改

29 個 `.zh-TW.md`(25 頁文件站 + 4 份治理文件)由 po4a 產生,手改會在下次 `update-po.sh`
被覆蓋。**韓文的 `.ko.md` 不在此列**——它們維持上游的手工維護方式,把 `ko` 加進
`po/*.cfg` 會改變一個這個 fork 不擁有的工作流程。

## 譯者必須知道的

### 標題裡的 `{#anchor}` 不能動

中文標題後面的 `{#english-anchor}` 是 `attr_list`,把標題的 HTML id 釘成英文:

```markdown
## 如何讀符合性報告 {#reading-the-conformance-report}
```

未翻譯的英文頁會用英文 fragment 連進中文頁,拆掉大括號就會讓 `mkdocs build --strict`
失敗。相同的英文標題在所有頁面都釘同一個 anchor,所以 id 不取決於哪一頁剛好被連結。

### 兩種佔位符方言(報告字串)

- `%s` —— `printf`。**bash 的 printf 沒有位置參數**,順序不可調動。PO 已標 `c-format`。
- `%n%` `%a%` `%b%` `%v%` —— jq `gsub()` 具名替換,順序自由,但每個都必須出現在譯文裡。
  連續的 `%%` 是字面百分號。建議在元件的 Translation flags 加
  `placeholders:r"%[nabv]%"`。

兩個例外已在 PO 中註解標明:`risk.presence_only_md` / `_html` 的呼叫處刻意傳兩次同一個
數字(用一個或兩個 `%s` 都對);`conformance.reference` 會被 shell 截斷到第一個半形空格,
譯文**不能含空格**。

### 不要翻譯的東西

狀態碼與表情符號(pass/warn/fail/review)、G7 元素 id、PURL、SPDX 授權條款識別碼、
CycloneDX 欄位路徑、URL、法規條文引用、程式碼區塊裡的指令(行內註解要翻)。
mermaid 圖的節點文字要翻,節點 id、箭頭與 `<br/>` 不動。

用詞基準見 [`docs/chinese-style-guide.md`](../docs/chinese-style-guide.md)。

## 14 個死鍵(報告字串)

`docker/lib/i18n/report-strings.*.json` 裡有 14 個鍵有翻譯但全 repo 沒有任何引用
(`aiprofile.h1`、`aiprofile.pill_*` 等),韓文版也是同樣狀態。它們不進 PO,以免未來的
語言在永遠不會顯示的字串上耗工。要清就連 JSON 一起清,不要只清一邊。
