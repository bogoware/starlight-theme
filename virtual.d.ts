declare module 'virtual:bogoware-theme/config' {
  import type { StyleMode } from './lib/resolve-style.js';

  const config: {
    readonly mode: StyleMode;
    readonly styleRoutes: ReadonlyArray<{
      readonly pattern: string;
      readonly style: StyleMode;
    }>;
  };
  export default config;
}
