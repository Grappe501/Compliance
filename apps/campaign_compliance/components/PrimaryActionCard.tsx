import Link from "next/link";

export default function PrimaryActionCard({
  title,
  description,
  href,
  cta = "Open",
}: {
  title: string;
  description: string;
  href: string;
  cta?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>

        <span className="shrink-0 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white">
          {cta}
        </span>
      </div>
    </Link>
  );
}
