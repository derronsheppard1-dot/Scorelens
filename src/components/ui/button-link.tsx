import type { ReactNode } from "react";
import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition";

  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-black"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}