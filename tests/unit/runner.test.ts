import { describe, expect, it } from "vitest";

describe("unit test runner", () => {
  it("executes tests in the Node.js environment", () => {
    expect(process.versions.node).toBeTruthy();
  });
});
