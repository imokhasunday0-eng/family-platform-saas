export function familyDisplayName(raw: string): string {
  // "Imokha's Family" / "Imokha Family" / "Imokha" -> "The Imokhas"
  const surname = raw
    .replace(/'s?\s*family$/i, "")
    .replace(/\s+family$/i, "")
    .replace(/'s$/i, "")
    .trim();
  if (!surname) return raw;
  if (/^the /i.test(surname)) return surname;
  const plural = /(s|x|z|ch|sh)$/i.test(surname)
    ? surname + "es"
    : surname + "s";
  return "The " + plural;
}
