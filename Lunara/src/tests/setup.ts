import '@testing-library/jest-dom';
import { Response, Request, Headers } from 'cross-fetch';

// Mock the Vite environment
process.env.VITE_API_BASE_URL = 'http://localhost:8080';
process.env.VITE_CLOUDINARY_CLOUD_NAME = 'test-cloud-name';

// Note: import.meta.env is Vite-specific; source code uses process.env instead for Jest compat

// Add required globals
globalThis.Response = Response;
globalThis.Request = Request;
globalThis.Headers = Headers;

// Unified listener type for the mock BroadcastChannel
type BCListener = (this: BroadcastChannel, ev: MessageEvent) => void;

// Mock BroadcastChannel
class MockBroadcastChannel implements BroadcastChannel {
  readonly name: string;
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => void) | null = null;
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => void) | null = null;
  private listeners: Record<string, Set<BCListener>> = {};
  private closed = false;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(message: unknown): void {
    if (this.closed) return;
    // Fire onmessage asynchronously to mimic real behavior
    queueMicrotask(() => {
      const event = new MessageEvent('message', { data: message });
      this.onmessage?.(event);
      const ls = this.listeners['message'];
      if (ls) {
        for (const listener of ls) {
          listener.call(this, event);
        }
      }
    });
  }

  addEventListener<K extends keyof BroadcastChannelEventMap>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => void,
    _options?: boolean | AddEventListenerOptions
  ): void {
    if (!this.listeners[type]) {
      this.listeners[type] = new Set();
    }
    // @ts-expect-error -- BroadcastChannelEventMap[K] narrows to MessageEvent; safe for test mock
    this.listeners[type]!.add(listener);
  }

  removeEventListener<K extends keyof BroadcastChannelEventMap>(
    type: K,
    listener: (this: BroadcastChannel, ev: BroadcastChannelEventMap[K]) => void,
    _options?: boolean | EventListenerOptions
  ): void {
    // @ts-expect-error -- BroadcastChannelEventMap[K] narrows to MessageEvent; safe for test mock
    this.listeners[type]?.delete(listener);
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }

  close(): void {
    this.closed = true;
    this.listeners = {};
  }
}

// Assign without redundant assertions
Object.defineProperty(globalThis, 'BroadcastChannel', { value: MockBroadcastChannel, writable: true });

// Add TextEncoder/TextDecoder to global scope
if (globalThis.TextEncoder === undefined) {
  const { TextEncoder, TextDecoder } = require('node:util');
  Object.assign(globalThis, { TextEncoder, TextDecoder, ArrayBuffer });
}

// Add Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// Polyfill TransformStream for MSW/interceptors if not available
// Minimal fallback transform (moved to outer scope for reuse)
const FallbackTransform = function TransformStreamFallback() {
  // Minimal no-op constructor to satisfy code paths expecting a callable
} as unknown as typeof TransformStream;

if (globalThis.TransformStream === undefined) {
  try {
    // Node 18+ provides TransformStream in "stream/web"
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TransformStream } = require('node:stream/web');
    // @ts-ignore: Assigning to global
    globalThis.TransformStream = TransformStream;
  } catch {
    // Fallback: assign minimal stub from outer scope
    // @ts-ignore: Assign to global TransformStream for tests
    globalThis.TransformStream = FallbackTransform;
  }
}
