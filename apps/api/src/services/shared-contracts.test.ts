import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cartItemSchema, youtubeVideoId, MAX_CART_QTY, forgotPasswordSchema, resetPasswordSchema, requestReturnSchema, MAX_RETURN_IMAGES } from "@baxparrow/shared";

describe("youtubeVideoId", () => {
  it("returns null for undefined / null / empty", () => {
    assert.equal(youtubeVideoId(undefined), null);
    assert.equal(youtubeVideoId(null), null);
    assert.equal(youtubeVideoId(""), null);
  });

  it("extracts id from watch URLs", () => {
    assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  });
});

describe("cartItemSchema", () => {
  it(`rejects qty above ${MAX_CART_QTY}`, () => {
    const parsed = cartItemSchema.safeParse({
      product: "abc",
      qty: MAX_CART_QTY + 1,
    });
    assert.equal(parsed.success, false);
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects a malformed email", () => {
    assert.equal(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success, false);
  });
  it("accepts a valid email", () => {
    assert.equal(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success, true);
  });
});

describe("resetPasswordSchema", () => {
  const validToken = "a".repeat(64);
  it("rejects a non-64-hex token", () => {
    assert.equal(resetPasswordSchema.safeParse({ token: "xyz", password: "secret123" }).success, false);
  });
  it("rejects a password shorter than 6", () => {
    assert.equal(resetPasswordSchema.safeParse({ token: validToken, password: "short" }).success, false);
  });
  it("accepts a valid token + password", () => {
    assert.equal(resetPasswordSchema.safeParse({ token: validToken, password: "secret123" }).success, true);
  });
});

describe("requestReturnSchema", () => {
  const img = "https://res.cloudinary.com/demo/image/upload/r1.jpg";
  it("accepts a reason + at least one photo", () => {
    assert.equal(requestReturnSchema.safeParse({ reason: "Damaged or defective", images: [img] }).success, true);
  });
  it("rejects an unknown reason", () => {
    assert.equal(requestReturnSchema.safeParse({ reason: "It broke", images: [img] }).success, false);
  });
  it("requires a photo", () => {
    assert.equal(requestReturnSchema.safeParse({ reason: "Wrong item delivered", images: [] }).success, false);
  });
  it(`rejects more than ${MAX_RETURN_IMAGES} photos`, () => {
    const many = Array.from({ length: MAX_RETURN_IMAGES + 1 }, (_, i) => `${img}?${i}`);
    assert.equal(requestReturnSchema.safeParse({ reason: "Other", reasonDetail: "changed mind", images: many }).success, false);
  });
  it("requires a description when reason is Other", () => {
    assert.equal(requestReturnSchema.safeParse({ reason: "Other", images: [img] }).success, false);
    assert.equal(requestReturnSchema.safeParse({ reason: "Other", reasonDetail: "ab", images: [img] }).success, false);
    assert.equal(requestReturnSchema.safeParse({ reason: "Other", reasonDetail: "long enough", images: [img] }).success, true);
  });
});
