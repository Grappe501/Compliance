// apps/campaign_compliance/lib/env.ts
/**
 * env.ts — minimal environment helper
 *
 * Requirements (from master_build.md):
 * - Read DATABASE_URL (required)
 * - Read OPENAI_API_KEY (future)
 * - Provide assertEnv() that throws a user-safe error message
 */

type Env = {
    DATABASE_URL: string;
    OPENAI_API_KEY?: string;
  };
  
  function readEnv(): Env {
    const DATABASE_URL = process.env.DATABASE_URL?.trim() ?? "";
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
  
    return {
      DATABASE_URL,
      OPENAI_API_KEY: OPENAI_API_KEY && OPENAI_API_KEY.length > 0 ? OPENAI_API_KEY : undefined,
    };
  }
  
  /**
   * Throws a user-safe error message if required env vars are missing.
   * Keep this message suitable for displaying in UI logs.
   */
  export function assertEnv(): Env {
    const env = readEnv();
  
    if (!env.DATABASE_URL) {
      throw new Error(
        "Database connection not configured. Set DATABASE_URL in your environment (local .env or hosting provider settings)."
      );
    }
  
    return env;
  }
  
  /**
   * Non-throwing accessor, useful for places where you want to handle missing env gracefully.
   */
  export function getEnv(): Env {
    return readEnv();
  }
  