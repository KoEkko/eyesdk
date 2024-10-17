import { lazyReportBatch } from "../report.js";

export default function pv() {
  const reportData = {
    type: "behavior",
    subType: "pv",
    pageUrl: window.location.href,
    startTime: performance.now(),
  };
  lazyReportBatch(reportData);
}
