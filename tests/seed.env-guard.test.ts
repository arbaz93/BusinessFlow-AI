import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

describe("seed environment guard", () => {
  const originalEnv: Record<string, string | undefined> = {};

  const envKeys = [
    "NODE_ENV",
    "VERCEL",
    "VERCEL_ENV",
    "DATABASE_URL",
    "DIRECT_URL",
    "SEED_DATA_ENABLED",
  ];

  function setEnv(key: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      (process.env as Record<string, string | undefined>)[key] = value;
    }
  }

  beforeEach(() => {
    for (const key of envKeys) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      setEnv(key, originalEnv[key]);
    }
  });

  async function loadGuard() {
    const mod = await import("@/prisma/seed/env-guard");
    return mod.isSeedEnvironmentAllowed;
  }

  it("allows test environment", async () => {
    setEnv("NODE_ENV", "test");
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), true);
  });

  it("allows development with local database", async () => {
    setEnv("NODE_ENV", "development");
    setEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    setEnv("VERCEL", undefined);
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), true);
  });

  it("allows development with no database configured", async () => {
    setEnv("NODE_ENV", "development");
    setEnv("DATABASE_URL", undefined);
    setEnv("DIRECT_URL", undefined);
    setEnv("VERCEL", undefined);
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), true);
  });

  it("blocks production NODE_ENV", async () => {
    setEnv("NODE_ENV", "production");
    setEnv("DATABASE_URL", undefined);
    setEnv("DIRECT_URL", undefined);
    setEnv("VERCEL", undefined);
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), false);
  });

  it("blocks Vercel production environment", async () => {
    setEnv("NODE_ENV", "production");
    setEnv("VERCEL", "1");
    setEnv("VERCEL_ENV", "production");
    setEnv("DATABASE_URL", undefined);
    setEnv("DIRECT_URL", undefined);
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), false);
  });

  it("blocks Vercel preview even with remote database (no explicit enable)", async () => {
    setEnv("NODE_ENV", "development");
    setEnv("VERCEL", "1");
    setEnv("VERCEL_ENV", "preview");
    setEnv("DATABASE_URL", "postgresql://user:pass@remote.db.com:5432/db");
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), false);
  });

  it("blocks remote Supabase database without explicit enable", async () => {
    setEnv("NODE_ENV", "development");
    setEnv("DATABASE_URL", "postgresql://user:pass@aws-0-dev-123.pooler.supabase.co:6543/postgres");
    setEnv("VERCEL", undefined);
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), false);
  });

  it("allows remote Supabase database with SEED_DATA_ENABLED=true", async () => {
    setEnv("NODE_ENV", "development");
    setEnv("DATABASE_URL", "postgresql://user:pass@aws-0-dev-123.pooler.supabase.co:6543/postgres");
    setEnv("VERCEL", undefined);
    setEnv("SEED_DATA_ENABLED", "true");
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), true);
  });

  it("blocks when NODE_ENV is unexpected (not test/dev/prod) with remote db", async () => {
    setEnv("NODE_ENV", "staging");
    setEnv("DATABASE_URL", "postgresql://user:pass@remote.db.com:5432/db");
    setEnv("VERCEL", undefined);
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), false);
  });

  it("blocks when NODE_ENV is unexpected even with explicit enable", async () => {
    setEnv("NODE_ENV", "staging");
    setEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    setEnv("SEED_DATA_ENABLED", "true");
    const isAllowed = await loadGuard();
    assert.equal(isAllowed(), false);
  });
});
