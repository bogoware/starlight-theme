import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const architectCss = readFileSync(resolve(__dirname, '..', 'architect.css'), 'utf-8');

describe('architect.css', () => {
  it('should scope rules under [data-bw-style="architect"]', () => {
    expect(architectCss).toContain('[data-bw-style="architect"]');
  });

  it('should NOT contain @font-face declarations (moved to fonts.css)', () => {
    expect(architectCss).not.toContain('@font-face');
  });

  it('should define heading font token', () => {
    expect(architectCss).toContain("--bw-font-heading: 'Space Grotesk'");
  });

  it('should define body font token', () => {
    expect(architectCss).toContain("--bw-font-body: 'DM Sans'");
  });

  it('should define code font token', () => {
    expect(architectCss).toContain("--bw-font-code: 'Space Mono'");
  });

  it('should define display type scale at 2.25rem', () => {
    expect(architectCss).toContain('--bw-text-display: 2.25rem');
  });

  it('should map to Starlight font variables', () => {
    expect(architectCss).toContain('--sl-font: var(--bw-font-body)');
    expect(architectCss).toContain('--sl-font-mono: var(--bw-font-code)');
  });

  it('should scope heading styles under data-bw-style', () => {
    expect(architectCss).toContain('[data-bw-style="architect"] h1');
    expect(architectCss).toContain('[data-bw-style="architect"] h2');
    expect(architectCss).toContain('[data-bw-style="architect"] h3');
  });
});
