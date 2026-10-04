export function formatAddress(addr: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Unassigned / None";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatGen(weiStr: string | bigint | number): string {
  try {
    const val = BigInt(weiStr.toString());
    const whole = val / 10n ** 18n;
    const remainder = val % 10n ** 18n;
    const dec = (remainder / 10n ** 14n).toString().padStart(4, '0');
    return `${whole}.${dec} GEN`;
  } catch {
    return "0.0000 GEN";
  }
}

export function truncateText(text: string, maxLen = 120): string {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}
