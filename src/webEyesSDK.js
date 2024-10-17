import performance from "./performance/index.js";
import error from "./error/index.js";
import behavior from "./behavior/index.js";
import { setConfig } from "./config.js";
import { lazyReportBatch } from "./report.js";

window.__webEyesSDK__ = {
  version: "0.0.1",
};
// 针对Vue项目的错误捕获
export function install(Vue, options) {
  if (__webEyesSDK__.vue) return;
  __webEyesSDK__.vue = true;
  setConfig(options);
  const handler = Vue.config.errorHandler;
  Vue.config.errorHandler = function (err, vm, info) {
    if (handler) {
      handler(err, vm, info);
    }
    const reportData = {
      type: "error",
      subType: "vue",
      info,
      startTime: window.performance.now(),
      pageURL: window.location.href,
    };
    console.log("vue error", reportData);
    lazyReportBatch(reportData);
  };
}

// 针对 react 项目的错误捕获
export function errorBoundary(err, info) {
  if (__webEyesSDK__.react) return;
  __webEyesSDK__.react = true;
  const reportData = {
    type: "error",
    subType: "react",
    info,
    startTime: window.performance.now(),
    pageURL: window.location.href,
  };
  lazyReportBatch(reportData);
}

export function init(options) {
  setConfig(options);
  // error();
  behavior();
  // performance();
}
export default {
  install,
  errorBoundary,
  init,
  performance,
  behavior,
  error,
};
