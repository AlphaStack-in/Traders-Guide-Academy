// The marquee track duplicates its item list once, then loops the whole
// track by exactly -50% (see .thc-marquee-track in globals.css) so the
// second half seamlessly picks up where the first half started. That only
// looks seamless if a single "half" is already wider than any real viewport
// — otherwise the track runs out of content before the loop resets and
// visibly pauses/jumps. Client content length varies (a client might have
// 2 testimonials, another 6), so the repeat count must scale with both the
// per-item width and how many items there are, not a hardcoded multiplier.
const MIN_HALF_WIDTH_PX = 3200;

export function repeatForMarquee<T>(items: T[], itemWidthPx: number): T[] {
  if (items.length === 0) return items;
  const repeatCount = Math.max(1, Math.ceil(MIN_HALF_WIDTH_PX / (itemWidthPx * items.length)));
  return Array.from({ length: repeatCount }, () => items).flat();
}
