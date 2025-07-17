// Global type declarations for browser and Node.js globals
/* eslint-disable */
declare global {
  var window: Window & typeof globalThis;
  var document: Document;
  var console: Console;
  var setTimeout: typeof global.setTimeout;
  var clearTimeout: typeof global.clearTimeout;
  var setInterval: typeof global.setInterval;
  var clearInterval: typeof global.clearInterval;
  var localStorage: Storage;
  var sessionStorage: Storage;
  var navigator: Navigator;
  var performance: Performance;
  var requestAnimationFrame: (callback: FrameRequestCallback) => number;
  var cancelAnimationFrame: (handle: number) => void;
  var process: any;
  var screen: Screen;
  var alert: (message?: any) => void;
  var HTMLDivElement: typeof HTMLDivElement;
  var HTMLInputElement: typeof HTMLInputElement;
  var FileReader: typeof FileReader;
  var MouseEvent: typeof MouseEvent;
  var IntersectionObserver: typeof IntersectionObserver;
  var IntersectionObserverInit: IntersectionObserverInit;
  var HTMLElement: typeof HTMLElement;
  var SuccessFeedback: any;
}

export {}; 