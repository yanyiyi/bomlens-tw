// Copyright 2026 SK Telecom Co., Ltd.
// SPDX-License-Identifier: Apache-2.0

// 데스크톱 시작 화면 문자열의 사전과 로캘 선택(순수 — electron 비의존, 단위 테스트 가능).
// 웹 UI(docker/web/frontend, i18next)와 동일한 원칙: 로캘 접두사로 지원 언어를 고르고,
// 해당하는 것이 없으면 영어로 폴백한다. 전역 확장에 맞춰 비한국어 환경에서는 영어로 뜨고,
// 한국 사용자는 기존 경험을 그대로 유지한다.

export const SUPPORTED = ["en", "ko", "zh-TW"];

// app.getLocale()이나 navigator.language 같은 BCP 47 문자열을 받아 지원 언어로 환원한다.
// 중국어는 번체만 제공하므로 zh 계열(zh, zh-Hant-TW, zh-HK, zh-CN...)은 모두 zh-TW로
// 모은다 — 웹 UI의 convertDetectedLanguage와 같은 판단이다.
export function pickLang(locale = "en") {
  const l = String(locale).toLowerCase();
  if (l.startsWith("ko")) return "ko";
  if (l === "zh" || l.startsWith("zh-") || l.startsWith("zh_")) return "zh-TW";
  return "en";
}

// 언어 결정: SBOM_LANG 환경변수가 있으면 우선(사용자가 언어를 강제하거나 스크린샷을 찍을 때),
// 없으면 시스템 로캘. 둘 다 지원 언어로 환원한다.
export function resolveLang(envLang, sysLocale) {
  return pickLang(envLang || sysLocale || "en");
}

// ContainerError의 not-ready detail(밀리초 문자열)을 사람이 읽는 초로. 값이 없거나
// 숫자가 아니면 "?" — 문구가 "NaN초"로 깨지는 것보다 낫다.
function secs(ms) {
  const n = Math.round(Number(ms) / 1000);
  return Number.isFinite(n) && n > 0 ? String(n) : "?";
}

// 메인 프로세스(main.mjs)가 status()로 흘리는 문구. 일부는 값이 끼어들어 함수로 둔다.
const MAIN = {
  ko: {
    dockerChecking: "Docker 상태를 확인하는 중...",
    firstPull: "처음 실행이라 스캐너 이미지를 내려받습니다 (약 250MB).",
    image: (img) => `이미지: ${img}`,
    network: "프로젝트를 처음 스캔할 때 언어별 이미지(0.6~1.7GB)를 한 번 더 내려받습니다...",
    // 화면에는 "다시 시도" 버튼이 있다. 문구가 "앱을 다시 실행"이라고 하면 서로 어긋난다.
    pullFailed: "이미지 다운로드에 실패했습니다. 아래 안내를 확인한 뒤 다시 시도를 눌러 주세요.",
    // non-TTY docker pull에는 바이트/퍼센트가 없어 레이어 개수로만 셀 수 있다(pullprogress.mjs).
    pullProgress: (complete, total, secs) =>
      total === 0
        ? `레지스트리에 접속하는 중... (${secs}초 경과)`
        : `이미지 레이어 내려받는 중: ${total}개 중 ${complete}개 완료 (${secs}초 경과)`,
    // 이미지가 이미 있어도 조용히 최신 여부를 확인하다가 실제로 새 버전을 받기 시작했을 때만 뜬다.
    updateFound: "새 버전의 스캐너 이미지를 내려받는 중입니다...",
    cleanedOrphans: (n) => `이전 실행에서 남은 컨테이너 ${n}개를 정리했습니다.`,
    startingUi: "UI 컨테이너를 시작하는 중...",
    ready: "준비 완료. UI를 엽니다.",
    startFailed: (msg) => `시작에 실패했습니다: ${msg}`,
    // container.mjs가 던지는 ContainerError.code를 사용자 문구로 옮긴다. detail은 docker
    // 원문 등 번역 대상이 아닌 부가 정보.
    containerError: (code, detail) => {
      if (code === "run-failed")
        return `Docker가 스캐너 컨테이너를 시작하지 못했습니다.${detail ? ` 원인: ${detail}` : ""}`;
      if (code === "exited-early") return "스캐너 컨테이너가 기동 도중 종료되었습니다.";
      if (code === "not-ready")
        return `스캐너가 ${secs(detail)}초 안에 준비되지 않았습니다. 다시 시도를 눌러 주세요.`;
      return String(code);
    },
    containerDied: "UI 컨테이너가 종료되었습니다. 다시 시도를 눌러 재시작하세요.",
    updateTitle: "업데이트 알림",
    updateMessage: (current, latest) =>
      `새 버전(v${latest})이 나왔습니다. 현재 버전은 v${current}입니다.`,
    updateDownload: "다운로드 페이지 열기",
    updateLater: "나중에",
    scanMountChooseTitle: "스캔할 폴더 선택",
  },
  "zh-TW": {
    dockerChecking: "正在確認 Docker 狀態…",
    firstPull: "初次執行，正在下載掃描器映像檔（約 250 MB）。",
    image: (img) => `映像檔：${img}`,
    network: "初次掃描專案時，會再下載一次語言專用映像檔（0.6-1.7 GB）…",
    // 畫面上的按鈕是「重試」，文案若寫成「重新啟動應用程式」就會對不上。
    pullFailed: "映像檔下載失敗。請先看下方的說明，然後按「重試」。",
    // non-TTY 的 docker pull 沒有位元組與百分比，只能數圖層（pullprogress.mjs）。
    pullProgress: (complete, total, secs) =>
      total === 0
        ? `正在連線到登錄伺服器…（已經過 ${secs} 秒）`
        : `正在下載映像檔圖層：${total} 個中已完成 ${complete} 個（已經過 ${secs} 秒）`,
    // 映像檔已存在時只會靜靜確認是否為最新，真的開始下載新版本才顯示。
    updateFound: "正在下載新版的掃描器映像檔…",
    cleanedOrphans: (n) => `已清理前次執行殘留的 ${n} 個容器。`,
    startingUi: "正在啟動 UI 容器…",
    ready: "準備完成，正在開啟 UI。",
    startFailed: (msg) => `啟動失敗：${msg}`,
    // 把 container.mjs 丟出的 ContainerError.code 轉成給人看的文案。detail 是 docker
    // 的原始輸出等附加資訊，不是翻譯對象。
    containerError: (code, detail) => {
      if (code === "run-failed")
        return `Docker 無法啟動掃描器容器。${detail ? ` 原因：${detail}` : ""}`;
      if (code === "exited-early") return "掃描器容器在啟動過程中結束了。";
      if (code === "not-ready")
        return `掃描器在 ${secs(detail)} 秒內沒有完成啟動。請按「重試」。`;
      return String(code);
    },
    containerDied: "UI 容器已結束。請按「重試」重新啟動。",
    updateTitle: "有可用的更新",
    updateMessage: (current, latest) =>
      `新版本（v${latest}）已經發佈。你目前使用的是 v${current}。`,
    updateDownload: "開啟下載頁面",
    updateLater: "稍後再說",
    scanMountChooseTitle: "選擇要掃描的資料夾",
  },
  en: {
    dockerChecking: "Checking Docker status...",
    firstPull: "First run: downloading the scanner image (about 250 MB).",
    image: (img) => `Image: ${img}`,
    network: "The first scan of a project also fetches a language image (0.6-1.7 GB)...",
    pullFailed: "Image download failed. Check the guidance below, then press Try again.",
    pullProgress: (complete, total, secs) =>
      total === 0
        ? `Contacting the registry... (${secs}s elapsed)`
        : `Downloading image layers: ${complete}/${total} done (${secs}s elapsed)`,
    updateFound: "Downloading a newer scanner image...",
    cleanedOrphans: (n) =>
      n === 1
        ? "Cleaned up 1 leftover container from a previous run."
        : `Cleaned up ${n} leftover containers from a previous run.`,
    startingUi: "Starting the UI container...",
    ready: "Ready. Opening the UI.",
    startFailed: (msg) => `Startup failed: ${msg}`,
    containerError: (code, detail) => {
      if (code === "run-failed")
        return `Docker could not start the scanner container.${detail ? ` Details: ${detail}` : ""}`;
      if (code === "exited-early") return "The scanner container stopped while starting up.";
      if (code === "not-ready")
        return `The scanner did not finish starting within ${secs(detail)} seconds. Press Try again.`;
      return String(code);
    },
    containerDied: "The UI container stopped. Press Try again to restart it.",
    updateTitle: "Update available",
    updateMessage: (current, latest) =>
      `A new version (v${latest}) is available. You are on v${current}.`,
    updateDownload: "Open download page",
    updateLater: "Later",
    scanMountChooseTitle: "Choose folders to scan",
  },
};

// 메인 프로세스 문구 묶음을 로캘에 맞춰 돌려준다.
export function mainMessages(locale) {
  return MAIN[pickLang(locale)];
}
