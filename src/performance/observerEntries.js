import { lazyReportBatch } from "../report";

export default function observeEntries() {
  if (document.readyState === 'complete') {
    observeEvent();
  } else {
    const onload = () => {
      observeEvent();
      window.removeEventListener('load', onload);
    }
    window.addEventListener('load', onload);
  }
}
export function observeEvent() {
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
      }
      lazyReportBatch(reportData);
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'resource', buffered: true });
}

