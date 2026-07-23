const cardFiles = import.meta.glob<string>("../assets/cards/**/*.webp", { eager: true, import: "default" });

export function cardArtUrl(assetId: string): string {
  const match = Object.entries(cardFiles).find(([path]) => path.endsWith(`/${assetId}.webp`));
  return match?.[1] ?? "";
}
