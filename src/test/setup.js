import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';
import i18n from '../i18n';

if (typeof Element !== 'undefined') {
  // jsdom: scrollIntoView may be undefined; some components call it in useLayoutEffect
  Element.prototype.scrollIntoView = vi.fn();
}

beforeEach(async () => {
  try {
    localStorage.removeItem('i18nextLng');
  } catch {
    /* ignore */
  }
  await i18n.changeLanguage('ar');
});
