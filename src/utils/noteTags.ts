export function parseCommaSeparatedTags(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((tag) => {
      const clean = tag.replace(/^#+/, "").toLowerCase();
      return clean ? `#${clean}` : "";
    })
    .filter(Boolean);
}
