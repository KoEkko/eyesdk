import { lazyReportBatch } from "../report";
import { getUUID } from "../utils";

export default function onClick() {
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
