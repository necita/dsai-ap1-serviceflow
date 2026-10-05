import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../../../src/modules/auth/password";

describe("Argon2id password helpers", () => {
  it("stores passwords as Argon2id hashes and verifies credentials", async () => {
    const hash = await hashPassword("correct-password");

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(hash, "correct-password")).resolves.toBe(true);
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });

  it("rejects empty passwords and malformed or non-Argon2id hashes", async () => {
    await expect(hashPassword("")).rejects.toThrow("Password must not be empty.");
    await expect(verifyPassword("plaintext", "plaintext")).resolves.toBe(false);
    await expect(verifyPassword("$argon2id$malformed", "password")).resolves.toBe(false);
  });
});
