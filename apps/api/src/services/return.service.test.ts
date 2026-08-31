import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { returnWindowOpen, requestReturnSchema, updateReturnSchema, RETURN_WINDOW_DAYS } from "@baxparrow/shared";
import { canTransition, returnEligible } from "./return.service.js";

const DAY = 86_400_000;
const now = new Date("2026-08-30T12:00:00Z");

const deliveredOrder = (over: Record<string, unknown> = {}) => ({
  status: "delivered",
  payment: { status: "paid", razorpayPaymentId: "pay_123" },
  timeline: [{ status: "delivered", at: new Date(now.getTime() - 2 * DAY).toISOString() }],
  ...over,
});

describe("returnWindowOpen", () => {
  it("is open within the window and closed beyond it", () => {
    assert.equal(returnWindowOpen(new Date(now.getTime() - (RETURN_WINDOW_DAYS - 1) * DAY), now), true);
    assert.equal(returnWindowOpen(new Date(now.getTime() - RETURN_WINDOW_DAYS * DAY), now), true);
    assert.equal(returnWindowOpen(new Date(now.getTime() - (RETURN_WINDOW_DAYS + 1) * DAY), now), false);
  });

  it("returns false for missing delivery date", () => {
    assert.equal(returnWindowOpen(null, now), false);
    assert.equal(returnWindowOpen(undefined, now), false);
  });
});

describe("returnEligible", () => {
  it("allows a paid, delivered order inside the window", () => {
    assert.equal(returnEligible(deliveredOrder(), now).ok, true);
  });

  it("rejects a non-delivered order", () => {
    const r = returnEligible(deliveredOrder({ status: "shipped" }), now);
    assert.equal(r.ok, false);
    assert.match(r.reason, /not delivered/i);
  });

  it("rejects an unpaid order", () => {
    const r = returnEligible(deliveredOrder({ payment: { status: "pending" } }), now);
    assert.equal(r.ok, false);
    assert.match(r.reason, /not paid/i);
  });

  it("rejects when no payment id to refund", () => {
    const r = returnEligible(deliveredOrder({ payment: { status: "paid" } }), now);
    assert.equal(r.ok, false);
    assert.match(r.reason, /no payment/i);
  });

  it("rejects a second return request", () => {
    const r = returnEligible(deliveredOrder({ return: { status: "requested" } }), now);
    assert.equal(r.ok, false);
    assert.match(r.reason, /already requested/i);
  });

  it("rejects once the 7-day window has closed", () => {
    const late = deliveredOrder({
      timeline: [{ status: "delivered", at: new Date(now.getTime() - 10 * DAY).toISOString() }],
    });
    const r = returnEligible(late, now);
    assert.equal(r.ok, false);
    assert.match(r.reason, /window closed/i);
  });
});

describe("canTransition", () => {
  it("permits the happy path", () => {
    assert.equal(canTransition("none", "requested"), false); // requested is customer-only, not admin
    assert.equal(canTransition("requested", "approved"), true);
    assert.equal(canTransition("approved", "received"), true);
    assert.equal(canTransition("received", "refunded"), true);
  });

  it("permits rejection from requested and approved only", () => {
    assert.equal(canTransition("requested", "rejected"), true);
    assert.equal(canTransition("approved", "rejected"), true);
    assert.equal(canTransition("received", "rejected"), false);
  });

  it("blocks skipping and reversing", () => {
    assert.equal(canTransition("requested", "received"), false);
    assert.equal(canTransition("requested", "refunded"), false);
    assert.equal(canTransition("approved", "refunded"), false);
    assert.equal(canTransition("received", "approved"), false);
  });

  it("treats refunded and rejected as terminal", () => {
    for (const next of ["requested", "approved", "received", "refunded", "rejected"] as const) {
      assert.equal(canTransition("refunded", next), false);
      assert.equal(canTransition("rejected", next), false);
    }
  });
});

describe("return schemas", () => {
  const img = "https://res.cloudinary.com/demo/image/upload/r1.jpg";
  it("requires a valid reason enum and at least one photo", () => {
    assert.equal(requestReturnSchema.safeParse({ reason: "bad", images: [img] }).success, false);
    assert.equal(requestReturnSchema.safeParse({ reason: "Damaged or defective", images: [] }).success, false);
    assert.equal(requestReturnSchema.safeParse({ reason: "Damaged or defective", images: [img] }).success, true);
  });

  it("only allows admin return transitions", () => {
    assert.equal(updateReturnSchema.safeParse({ status: "requested" }).success, false);
    assert.equal(updateReturnSchema.safeParse({ status: "refunded" }).success, true);
  });
});
