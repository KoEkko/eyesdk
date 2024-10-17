function getUUID() {
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function deepClone(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const clone = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}

const cache = [];

function clearCache() {
  cache.length = 0;
}

function addCache(data) {
  cache.push(data);
}

function getCache() {
  return deepClone(cache);
}

const config = {
  url: 'http://127.0.0.1:8080/api',
  project: 'webEyesSDK',
  version: '0.0.1',
  appID: '1234567890',
  userID: '1234567890',
  isImageUpload: false,
  batchSize: 5
};



function setConfig(options) {
  for (const key in config) {
    if (options[key] !== undefined) {
      config[key] = options[key];
    }
  }
}

const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

function report(data) {
  if (!config.url) {
    console.error("webEyesSDK: 请先配置上报地址");
    return;
  }
  const reportData = JSON.stringify({
    id: getUUID(),
    data,
  });
  // 上报数据，使用图片的方式
  if (config.isImageUpload) {
    imgRequest(reportData);
  } else {
    // 优先使用 sendBeacon 上报
    if (
      window.navigator.sendBeacon &&
      typeof window.navigator.sendBeacon === "function"
    ) {
      return beaconRequest(reportData);
    } else {
      xhrRequest(reportData);
    }
  }
}

// 批量上报数据
function lazyReportBatch(data) {
  addCache(data);
  const dataCache = getCache();
  console.error(data);
  if (dataCache.length && dataCache.length >= config.batchSize) {
    report(dataCache);
    clearCache();
  }
}

function imgRequest(data) {
  const img = new Image();
  img.src = `${config.url}?data=${encodeURIComponent(JSON.stringify(data))}`;
}

function xhrRequest(data) {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(
      () => {
        const xhr = new XMLHttpRequest();
        originalOpen.call(xhr, "post", config.url);
        originalSend.call(xhr, data);
      },
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => {
      const xhr = new XMLHttpRequest();
      originalOpen.call(xhr, "post", config.url);
      originalSend.call(xhr, data);
    }, 0);
  }
}

function beaconRequest(data) {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(
      () => {
        window.navigator.sendBeacon(config.url, data);
      },
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => {
      window.navigator.sendBeacon(config.url, data);
    }, 0);
  }
}

const originalFetch = window.fetch;

function overwriteFetch() {
  window.fetch = function newFetch(url, config) {
    const start = performance.now();
    const reportData = {
      type: 'performance',
      subType: 'fetch',
      url,
      startTime: start,
      endTime: 0,
      duration: 0,
      method: config?.method,
      status: 0,
      success: false,
    };
    return originalFetch(url, config).then((response) => {
      const end = performance.now();
      const duration = end - start;
      reportData.endTime = end;
      reportData.duration = duration;
      reportData.status = response.status;
      reportData.success = response.ok;
      lazyReportBatch(reportData);
      return response;
    }).catch((error) => {
      const end = performance.now();
      const duration = end - start;
      reportData.endTime = end;
      reportData.duration = duration;
      reportData.status = error.status;
      reportData.success = false;
      lazyReportBatch(reportData);
      return error;
    })
  };
}
function fetch() {
  overwriteFetch();
}

function observeEntries() {
  if (document.readyState === 'complete') {
    observeEvent();
  } else {
    const onload = () => {
      observeEvent();
      window.removeEventListener('load', onload);
    };
    window.addEventListener('load', onload);
  }
}
function observeEvent() {
  const entryHandler = (list) => {
    for (const entry of list.getEntries()) {
      if (observer) {
        observer.disconnect();
      }
      const reportData = {
        name: entry.name,
        type: 'performance',
        subType: entry.entryType,
        sourceType: entry.initiatorType,
        duration: entry.duration,
        startTime: entry.startTime,
        dns: entry.domainLookupEnd - entry.domainLookupStart, // 域名解析时间
        tcp: entry.connectEnd - entry.connectStart, // tcp连接时间
        redirect: entry.redirectEnd - entry.redirectStart, // 重定向时间
        ttfb: entry.responseStart, // 首字节实践
        responseBodySize: entry.encodedBodySize,
        responseHeaderSize: entry.transferSize - entry.encodedBodySize, // 响应头大小
        transferSize: entry.transferSize, // 传输大小
        resourceSize: entry.decodedBodySize, // 资源大小
        protocol: entry.nextHopProtocol,
      };
      lazyReportBatch(reportData);
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'resource', buffered: true });
}

function observeFCP() {
  const entryHandler = (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        observer.disconnect();
        const json = entry.toJSON();
        const reportData = {
          ...json,
          type: 'performance',
          subType: entry.name,
          pageUrl: window.location.href,
        };
        lazyReportBatch(reportData);
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'paint', buffered: true });
}

function observeLCP() {
  const entryHandler = (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'largest-contentful-paint') {
        observer.disconnect();
        const json = entry.toJSON();
        const reportData = {
          ...json,
          type: 'performance',
          subType: entry.name,
          pageUrl: window.location.href,
        };
        lazyReportBatch(reportData);
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'paint', buffered: true });
}

function observerLoad() {
  window.addEventListener('load', (event) => {
    requestAnimationFrame(() => {
      ['load'].forEach(type => {
        const reportData = {
          type: 'performance',
          subType: type,
          pageUrl: window.location.href,
          startTime: performance.now() - event.timeStamp,
        };
        lazyReportBatch(reportData);
      });
    });
  }, true);
}

function observePaint() {
  const entryHandler = (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        observer.disconnect();
        const json = entry.toJSON();
        const reportData = {
          ...json,
          type: "performance",
          subType: entry.name,
          pageUrl: window.location.href,
        };
        lazyReportBatch(reportData);
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "paint", buffered: true });
}

function performance$1() {
  fetch();
  observeEntries();
  observeFCP();
  observeLCP();
  observerLoad();
  observePaint();
}

function error() {
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

function pv() {
  const reportData = {
    type: "behavior",
    subType: "pv",
    pageUrl: window.location.href,
    startTime: performance.now(),
  };
  lazyReportBatch(reportData);
}

function onClick() {
  ["mousedown", "touchstart"].forEach((type) => {
    window.addEventListener(type, (e) => {
      const target = e.target;
      if (target.tagName) {
        const reportData = {
          type: "behavior",
          subType: type,
          tagName: target.tagName,
          startTime: e.timeStamp,
          innerHTML: target.innerHTML,
          outerHTML: target.outerHTML,
          width: target.offsetWidth,
          height: target.offsetHeight,
          eventType: e.type,
          // path: e.path,
          uuid: getUUID(),
        };
        lazyReportBatch(reportData);
      }
    });
  });
}

function pageChange() {
  // hash histroy
  let oldUrl = "";
  window.addEventListener(
    "hashchange",
    function (event) {
      console.error("hashchange", event);
      const newUrl = event.newURL;
      const reportData = {
        form: oldUrl,
        to: newUrl,
        type: "behavior",
        subType: "hashchange",
        startTime: performance.now(),
        uuid: getUUID(),
      };
      lazyReportBatch(reportData);
      oldUrl = newUrl;
    },
    true
  );

  let from = "";
  window.addEventListener(
    "popstate",
    function (event) {
      console.error("popstate", event);
      const to = window.location.href;
      const reportData = {
        form: from,
        to: to,
        type: "behavior",
        subType: "popstate",
        startTime: performance.now(),
        uuid: getUUID(),
      };
      lazyReportBatch(reportData);
      from = to;
    },
    true
  );
}

function behavior() {
  pv();
  onClick();
  pageChange();
}

window.__webEyesSDK__ = {
  version: "0.0.1",
};
// 针对Vue项目的错误捕获
function install(Vue, options) {
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
function errorBoundary(err, info) {
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

function init(options) {
  setConfig(options);
  // error();
  behavior();
  // performance();
}
var webEyesSDK = {
  install,
  errorBoundary,
  init,
  performance: performance$1,
  behavior,
  error,
};

export { webEyesSDK as default, errorBoundary, init, install };
//# sourceMappingURL=monitor.esm.js.map
