import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stockCrossing } from "./notify.service.js";

describe("stockCrossing", () => {
  it("emits inventory.out when crossing to 0", () => {
    assert.equal(stockCrossing(3, 0), "inventory.out");
  });
  it("emits inventory.low when crossing into <=10 from above", () => {
    assert.equal(stockCrossing(15, 8), "inventory.low");
  });
  it("returns null when staying low without hitting 0", () => {
    assert.equal(stockCrossing(8, 5), null);
  });
  it("returns null when increasing stock", () => {
    assert.equal(stockCrossing(2, 20), null);
  });
  it("prefers out over low when landing on 0 from above threshold", () => {
    assert.equal(stockCrossing(15, 0), "inventory.out");
  });
});
