export {};

declare global {
  interface Window {
    cheerpjInit?: (options?: unknown) => Promise<void> | void;
    cheerpjRunMain?: (className: string, jarPath: string) => Promise<void> | void;
    cjCall?: (className: string, method: string, ...args: unknown[]) => Promise<unknown> | unknown;
  }
}
