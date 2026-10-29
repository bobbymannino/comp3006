/** How many words of each post's content the list of posts shows */
export const PREVIEW_WORDS = 50;

/** Cut text down to its first `PREVIEW_WORDS` words, ending with an ellipsis if cut */
export function preview(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length <= PREVIEW_WORDS) return text;
  return `${words.slice(0, PREVIEW_WORDS).join(" ")}…`;
}
