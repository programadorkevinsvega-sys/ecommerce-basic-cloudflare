/// <reference types="@cloudflare/vitest-plugin/types" />
import type { Env as WorkerEnv } from '../../src/platform/Env.js';
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv { TEST_MIGRATIONS: Array<{ name: string; sql: string }> }
    interface GlobalProps { mainModule: typeof import('../../src/index.js') }
  }
}
