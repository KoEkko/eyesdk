export const originalProto = XMLHttpRequest.prototype;
export const originalOpen = originalProto.open;
export const originalSend = originalProto.send;

function overwriteOpenAndSend() {
  originalProto.open = function (...args) {
    this.url = args[1];
    this.method = args[0];
    originalOpen.apply(this, args);
  }

  originalProto.send = function (...args) {
    const start = performance.now();
    const xhr = this;
    const onLoadEnd = () => {
      this.endTime = performance.now();
      const { url, method, endTime, duration, status } = this;
      const reportData = {
        url,
        method: method.toUpperCase(),
        endTime,
        duration,
        status,
        type: 'performance',
        success: status >= 200 && status < 300 || status === 304,
        subType: 'xhr',
      }
      this.removeEventListener('loadend', onLoadEnd, true);
    }
    this.addEventListener('loadend', onLoadEnd, true);
    originalSend.apply(xhr, args);
  }
}
export default function xhr() {
  overwriteOpenAndSend();
}