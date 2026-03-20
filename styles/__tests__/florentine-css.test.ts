import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const florentineCss = readFileSync(resolve(__dirname, '..', 'florentine.css'), 'utf-8');

describe('florentine.css', () => {
  it('should scope rules under [data-bw-style="florentine"]', () => {
    expect(florentineCss).toContain('[data-bw-style="florentine"]');
  });

  it('should NOT contain @font-face declarations (moved to fonts.css)', () => {
    expect(florentineCss).not.toContain('@font-face');
  });

  it('should define heading font token', () => {
    expect(florentineCss).toContain("--bw-font-heading: 'Cormorant Garamond'");
  });

  it('should define body font token', () => {
    expect(florentineCss).toContain("--bw-font-body: 'Crimson Pro'");
  });

  it('should define code font token', () => {
    expect(florentineCss).toContain("--bw-font-code: 'Fira Code'");
  });

  it('should define display type scale at 2.5rem', () => {
    expect(florentineCss).toContain('--bw-text-display: 2.5rem');
  });

  it('should map to Starlight font variables', () => {
    expect(florentineCss).toContain('--sl-font: var(--bw-font-body)');
    expect(florentineCss).toContain('--sl-font-mono: var(--bw-font-code)');
  });

  it('should scope heading styles under data-bw-style', () => {
    expect(florentineCss).toContain('[data-bw-style="florentine"] h1');
    expect(florentineCss).toContain('[data-bw-style="florentine"] h2');
    expect(florentineCss).toContain('[data-bw-style="florentine"] h3');
  });

  it('should include blockquote styles', () => {
    expect(florentineCss).toContain('[data-bw-style="florentine"] blockquote');
  });
});
