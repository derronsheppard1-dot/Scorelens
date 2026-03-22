import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}