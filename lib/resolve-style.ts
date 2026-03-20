export type StyleMode = 'architect' | 'florentine';

export interface StyleConfig {
  readonly mode: StyleMode;
  readonly styleRoutes: ReadonlyArray<{ readonly pattern: string; readonly style: StyleMode }>;
}

/**
 * Resolve the typography style for a page.
 *
 * Resolution order (highest → lowest priority):
 * 1. Frontmatter `themeStyle` field
 * 2. First matching `styleRoutes` pattern
 * 3. Global `mode` default
 */
export function resolveStyle(
  slug: string,
  frontmatterStyle: StyleMode | undefined,
  config: StyleConfig,
): StyleMode {
  if (frontmatterStyle) return frontmatterStyle;

  for (const route of config.styleRoutes) {
    if (matchRoute(slug, route.pattern)) return route.style;
  }

  return config.mode;
}

/**
 * Match a page slug against a route pattern.
 *
 * Supported patterns:
 * - `blog/**`  — matches `blog/foo`, `blog/foo/bar`, etc. (recursive)
 * - `blog/*`   — matches `blog/foo` but NOT `blog/foo/bar` (single level)
 * - `blog/foo` — exact match only
 */
export function matchRoute(slug: string, pattern: string): boolean {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return slug === prefix || slug.startsWith(prefix + '/');
  }

  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    if (!slug.startsWith(prefix)) return false;
    const rest = slug.slice(prefix.length);
    return rest.length > 0 && !rest.includes('/');
  }

  return slug === pattern;
}
