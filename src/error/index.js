import { lazyReportBatch } from "../report";

export default function error() {
  // 捕获 JS \ CSS 资源加载错误
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target && (target.src || target.href)) {
        const url = target.src || target.href;
        const reportData = {
          type: "error",
          subType: "resource",
          url,
          html: target.outerHTML,
          pageUrl: window.location.href,
          // pahts: event.path, // 事件捕获路径
        };
        lazyReportBatch(reportData);
      }
    },
    true
  );
  // 捕获未处理的 Promise 错误
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const { reason } = event;
      const reportData = {
        type: "error",
        subType: "promise",
        reason: reason?.stack,
        pageUrl: window.location.href,
        startTime: performance.now(),
      };
      lazyReportBatch(reportData);
    },
    true
  );
  // 捕获未处理的 JS 错误
  window.onerror = function (message, source, lineno, colno, error) {
    const reportData = {
      type: "error",
      subType: "js",
      message,
      source,
      lineno,
      colno,
      error: error?.stack,
      pageUrl: window.location.href,
      startTime: performance.now(),
    };
    lazyReportBatch(reportData);
  };
}
