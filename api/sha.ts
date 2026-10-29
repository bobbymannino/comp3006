/**
 * SHA-256 hash a given value and return it as a hex string.
 *
 * @param value A SHA-256 hex value.
 */
export async function sha256(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
