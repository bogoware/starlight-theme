import { describe, it, expect } from 'vitest';
import { resolveStyle, matchRoute, type StyleConfig } from './resolve-style.js';

describe('matchRoute', () => {
  it('should match exact slug', () => {
    expect(matchRoute('blog/my-post', 'blog/my-post')).toBe(true);
  });

  it('should not match different slug on exact pattern', () => {
    expect(matchRoute('blog/other', 'blog/my-post')).toBe(false);
  });

  it('should match recursive pattern (/**)', () => {
    expect(matchRoute('blog/foo', 'blog/**')).toBe(true);
    expect(matchRoute('blog/foo/bar', 'blog/**')).toBe(true);
    expect(matchRoute('blog/foo/bar/baz', 'blog/**')).toBe(true);
  });

  it('should match the prefix itself with recursive pattern', () => {
    expect(matchRoute('blog', 'blog/**')).toBe(true);
  });

  it('should not match unrelated slug with recursive pattern', () => {
    expect(matchRoute('docs/foo', 'blog/**')).toBe(false);
    expect(matchRoute('blogging/foo', 'blog/**')).toBe(false);
  });

  it('should match single-level pattern (/*)', () => {
    expect(matchRoute('blog/foo', 'blog/*')).toBe(true);
  });

  it('should not match nested slug with single-level pattern', () => {
    expect(matchRoute('blog/foo/bar', 'blog/*')).toBe(false);
  });

  it('should not match the prefix itself with single-level pattern', () => {
    expect(matchRoute('blog', 'blog/*')).toBe(false);
  });

  it('should not match unrelated slug with single-level pattern', () => {
    expect(matchRoute('docs/foo', 'blog/*')).toBe(false);
  });
});

describe('resolveStyle', () => {
  const defaultConfig: StyleConfig = {
    mode: 'architect',
    styleRoutes: [
      { pattern: 'blog/**', style: 'florentine' },
      { pattern: 'philosophy/*', style: 'florentine' },
    ],
  };

  it('should return frontmatter style when provided', () => {
    expect(resolveStyle('architecture/panoramica', 'florentine', defaultConfig)).toBe('florentine');
  });

  it('should prefer frontmatter over route match', () => {
    expect(resolveStyle('blog/my-post', 'architect', defaultConfig)).toBe('architect');
  });

  it('should match route pattern when no frontmatter', () => {
    expect(resolveStyle('blog/my-post', undefined, defaultConfig)).toBe('florentine');
  });

  it('should match recursive route pattern for nested slugs', () => {
    expect(resolveStyle('blog/2024/my-post', undefined, defaultConfig)).toBe('florentine');
  });

  it('should match single-level route pattern', () => {
    expect(resolveStyle('philosophy/zen', undefined, defaultConfig)).toBe('florentine');
  });

  it('should not match single-level pattern for nested slugs', () => {
    expect(resolveStyle('philosophy/zen/deep', undefined, defaultConfig)).toBe('architect');
  });

  it('should fall back to default mode when no match', () => {
    expect(resolveStyle('architecture/panoramica', undefined, defaultConfig)).toBe('architect');
  });

  it('should use first matching route', () => {
    const config: StyleConfig = {
      mode: 'architect',
      styleRoutes: [
        { pattern: 'blog/**', style: 'florentine' },
        { pattern: 'blog/**', style: 'architect' },
      ],
    };
    expect(resolveStyle('blog/foo', undefined, config)).toBe('florentine');
  });

  it('should handle empty styleRoutes', () => {
    const config: StyleConfig = { mode: 'florentine', styleRoutes: [] };
    expect(resolveStyle('anything', undefined, config)).toBe('florentine');
  });

  it('should handle root slug', () => {
    expect(resolveStyle('', undefined, defaultConfig)).toBe('architect');
  });
});
