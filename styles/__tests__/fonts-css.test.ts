import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsCss = readFileSync(resolve(__dirname, '..', 'fonts.css'), 'utf-8');

describe('fonts.css', () => {
  it('should contain @font-face declarations', () => {
    expect(fontsCss).toContain('@font-face');
  });

  it('should register Architect mode fonts', () => {
    expect(fontsCss).toContain("font-family: 'Space Grotesk'");
    expect(fontsCss).toContain("font-family: 'DM Sans'");
    expect(fontsCss).toContain("font-family: 'Space Mono'");
  });

  it('should register Florentine mode fonts', () => {
    expect(fontsCss).toContain("font-family: 'Cormorant Garamond'");
    expect(fontsCss).toContain("font-family: 'Crimson Pro'");
    expect(fontsCss).toContain("font-family: 'Fira Code'");
  });

  it('should use font-display: swap for all font-faces', () => {
    const swapCount = (fontsCss.match(/font-display: swap/g) || []).length;
    expect(swapCount).toBeGreaterThanOrEqual(10);
  });

  it('should reference Google Fonts CDN woff2 files', () => {
    expect(fontsCss).toContain('fonts.gstatic.com');
    expect(fontsCss).toContain('.woff2');
  });

  it('should include Crimson Pro italic variant', () => {
    expect(fontsCss).toContain("font-family: 'Crimson Pro'");
    expect(fontsCss).toContain('font-style: italic');
  });
});
