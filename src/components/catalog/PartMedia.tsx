/** Always show image when URL exists (plan: image-forward lists). */
export function PartMedia({
  src,
  alt,
  className = "h-28 w-full rounded-lg object-cover",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100">
      <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
    </div>
  );
}
