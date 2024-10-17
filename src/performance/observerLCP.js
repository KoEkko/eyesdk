import { lazyReportBatch } from "../report";

export default function observeLCP() {
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
        }
        lazyReportBatch(reportData);
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'paint', buffered: true });
}

