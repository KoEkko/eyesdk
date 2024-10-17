import { lazyReportBatch } from "../report";

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
    }
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
  }
}
export default function fetch() {
  overwriteFetch();
}
