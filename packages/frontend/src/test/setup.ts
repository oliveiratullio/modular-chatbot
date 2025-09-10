import "@testing-library/jest-dom";
import { beforeEach } from "vitest";

// Mock do ResizeObserver para componentes Radix UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Limpa localStorage antes de cada teste
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Mock do matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock do scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

// Mock do HTMLElement.scrollTo
Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  writable: true,
  value: () => {},
});
