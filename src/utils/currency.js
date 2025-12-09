const DEFAULT_CURRENCY = "INR";

function normalizeCurrency(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().toUpperCase();
  }
  return DEFAULT_CURRENCY;
}

module.exports = {
  DEFAULT_CURRENCY,
  normalizeCurrency,
};