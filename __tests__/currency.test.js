const { normalizeCurrency, DEFAULT_CURRENCY } = require("../src/utils/currency");

describe("normalizeCurrency", () => {
  it("returns uppercase trimmed ISO code", () => {
    expect(normalizeCurrency(" usd ")).toBe("USD");
  });

  it("falls back to default when value missing", () => {
    expect(normalizeCurrency(null)).toBe(DEFAULT_CURRENCY);
    expect(normalizeCurrency("")).toBe(DEFAULT_CURRENCY);
  });
});