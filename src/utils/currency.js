/**
 * Format an amount in Indian Rupees, e.g. formatRs(1240) -> "Rs. 1,240", formatRs(150, 2) -> "Rs. 150.00".
 * Uses Indian digit grouping (1,24,000).
 */
export function formatRs(amount, decimals = 0) {
  const value = Number(amount) || 0;
  return `Rs. ${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
