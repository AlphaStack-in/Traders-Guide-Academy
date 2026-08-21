export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-28 border-t border-white/5 pt-6 first:border-t-0 first:pt-0"
    >
      <h2 className="font-heading text-lg font-bold signalflow-gold-text">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
