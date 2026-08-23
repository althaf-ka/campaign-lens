import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "./client.ts";

describe("createDb", () => {
  it("throws an error when DATABASE_URL is missing or empty", () => {
    assert.throws(
      () => {
        createDb("");
      },
      {
        message: "DATABASE_URL is required to initialize database client.",
      },
    );
  });

  it("instantiates Drizzle database with valid connection string format", () => {
    const db = createDb("postgresql://user:password@localhost:5432/testdb");
    assert.ok(db);
    assert.ok(typeof db.select === "function");
    assert.ok(typeof db.insert === "function");
  });
});
