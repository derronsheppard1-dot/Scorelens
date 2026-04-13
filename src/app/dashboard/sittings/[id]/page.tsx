import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SittingDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function SittingDetailPage({
  params,
  searchParams,
}: SittingDetailPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const { data: sitting, error } = await supabase
    .from("assessment_sittings")
    .select(`
      id,
      open_time,
      close_time,
      duration_minutes,
      preload_enabled,
      preload_available_from,
      status,
      created_at,
      assessments(title),
      classes(name, subject, grade_level)
    `)
    .eq("id", id)
    .single();

  if (error || !sitting) {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        error?.message || "Sitting not found."
      )}`
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sitting Details</h1>
          <p className="text-sm text-neutral-600">
            Review and manage this assessment sitting.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
        >
          Back
        </Link>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Assessment</dt>
            <dd className="mt-1 text-sm font-medium">
              {(sitting.assessments as { title?: string } | null)?.title ?? "Untitled"}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Class</dt>
            <dd className="mt-1 text-sm font-medium">
              {(sitting.classes as { name?: string } | null)?.name ?? "Unnamed class"}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Open time</dt>
            <dd className="mt-1 text-sm">{new Date(sitting.open_time).toLocaleString()}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Close time</dt>
            <dd className="mt-1 text-sm">{new Date(sitting.close_time).toLocaleString()}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Duration</dt>
            <dd className="mt-1 text-sm">{sitting.duration_minutes} minutes</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Status</dt>
            <dd className="mt-1 text-sm">{sitting.status}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Preload enabled</dt>
            <dd className="mt-1 text-sm">{sitting.preload_enabled ? "Yes" : "No"}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Preload from</dt>
            <dd className="mt-1 text-sm">
              {sitting.preload_available_from
                ? new Date(sitting.preload_available_from).toLocaleString()
                : "Not set"}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}