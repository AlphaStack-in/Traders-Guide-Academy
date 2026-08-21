export function SectionNumber({ n }: { n: number }) {
  return (
    <span className="font-heading text-xl font-bold leading-none signalflow-gold-text">
      {String(n).padStart(2, "0")}
    </span>
  );
}
