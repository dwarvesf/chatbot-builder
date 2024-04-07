export function formatMoney(amount: number) {
  const formatter = new Intl.NumberFormat('en-US', {});
  return formatter.format(amount);
}
