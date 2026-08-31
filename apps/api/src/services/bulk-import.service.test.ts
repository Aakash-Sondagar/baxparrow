import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleBulkProducts } from "./bulk-import.service.js";

const row = (over: Record<string, string> = {}) => ({
  product_key: "BX-MSG",
  name: "Heritage Messenger",
  category: "Office Bags",
  description: "Leather",
  sizes: "",
  status: "active",
  color: "Brown",
  sku: "BX-MSG-BRN",
  price: "1899",
  mrp: "2499",
  stock: "40",
  image_urls: "https://res.cloudinary.com/demo/image/upload/a.jpg",
  youtube_url: "",
  ...over,
});

describe("assembleBulkProducts", () => {
  it("groups two colours into one product", () => {
    const { docs, errors, variantCount } = assembleBulkProducts([
      row(),
      row({ color: "Tan", sku: "BX-MSG-TAN", stock: "25", image_urls: "" }),
    ]);
    assert.equal(errors.length, 0);
    assert.equal(docs.length, 1);
    assert.equal(variantCount, 2);
    assert.equal(docs[0].sku, "BX-MSG-BRN");
    assert.equal(docs[0].stock, 65);
    assert.deepEqual(
      (docs[0].variants as { color: string }[]).map((v) => v.color),
      ["Brown", "Tan"]
    );
  });

  it("rejects missing product_key column", () => {
    const { errors } = assembleBulkProducts([{ name: "Bag", sku: "X" }]);
    assert.match(errors[0]?.error ?? "", /product_key/);
  });

  it("rejects empty CSV", () => {
    const { errors, docs } = assembleBulkProducts([]);
    assert.equal(docs.length, 0);
    assert.match(errors[0]?.error ?? "", /empty/i);
  });

  it("rejects disagreeing names for same product_key", () => {
    const { errors } = assembleBulkProducts([
      row(),
      row({ name: "Other", color: "Tan", sku: "BX-MSG-TAN" }),
    ]);
    assert.ok(errors.some((e) => /disagrees/.test(e.error)));
  });

  it("rejects disagreeing description / sizes / status", () => {
    const { errors } = assembleBulkProducts([
      row({ description: "First", sizes: "M|L", status: "active" }),
      row({
        description: "Second",
        sizes: "S",
        status: "draft",
        color: "Tan",
        sku: "BX-MSG-TAN",
      }),
    ]);
    assert.ok(errors.some((e) => /description disagrees/.test(e.error)));
    assert.ok(errors.some((e) => /sizes disagrees/.test(e.error)));
    assert.ok(errors.some((e) => /status/.test(e.error) && /disagrees/.test(e.error)));
  });

  it("rejects duplicate SKU", () => {
    const { errors } = assembleBulkProducts([
      row(),
      row({ color: "Tan", sku: "BX-MSG-BRN" }),
    ]);
    assert.ok(errors.some((e) => /Duplicate SKU/.test(e.error)));
  });

  it("rejects duplicate colour within a product", () => {
    const { errors } = assembleBulkProducts([
      row(),
      row({ sku: "BX-MSG-BRN2" }),
    ]);
    assert.ok(errors.some((e) => /Duplicate colour/.test(e.error)));
  });

  it("rejects unknown category", () => {
    const { errors } = assembleBulkProducts([row({ category: "Totes" })]);
    assert.ok(errors.some((e) => /Unknown category/.test(e.error)));
  });

  it("accepts a custom category when allow-listed", () => {
    const { errors, docs } = assembleBulkProducts([row({ category: "Totes" })], {
      allowedCategories: ["Totes"],
    });
    assert.equal(errors.length, 0);
    assert.equal(docs.length, 1);
  });

  it("rejects invalid image URLs", () => {
    const { errors } = assembleBulkProducts([row({ image_urls: "not-a-url" })]);
    assert.ok(errors.some((e) => /Invalid image URL/.test(e.error)));
  });

  it("rejects more than 12 colours", () => {
    const colours = Array.from({ length: 13 }, (_, i) =>
      row({
        color: `C${i}`,
        sku: `BX-MSG-${String(i).padStart(2, "0")}`,
      })
    );
    const { errors } = assembleBulkProducts(colours);
    assert.ok(errors.some((e) => /Max 12 colours/.test(e.error)));
  });

  it("maps skuRows to the CSV row index", () => {
    const { errors, skuRows } = assembleBulkProducts([
      row(),
      row({ color: "Tan", sku: "BX-MSG-TAN" }),
    ]);
    assert.equal(errors.length, 0);
    assert.equal(skuRows["BX-MSG-BRN"], 2);
    assert.equal(skuRows["BX-MSG-TAN"], 3);
  });
});
