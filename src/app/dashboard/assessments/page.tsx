import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/card";
import PageHeader from "@/components/app/page-header";
import ButtonLink from "@/components/ui/button-link";

type AssessmentsPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AssessmentsPage({
  searchParams,
}: AssessmentsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assessments, error } = await supabase
    .from("assessments")
    .select("id, title, status, total_marks, created_at")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Create and manage your draft assessments."
        actions={
          <ButtonLink href="/dashboard/assessments/create">
            New Assessment
          </ButtonLink>
        }
      />

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {error ? (
        <Card>
          <pre className="text-sm text-red-700">
            {JSON.stringify(
              {
                message: error.message,
                code: error.code,
                details: error.details,
              },
              null,
              2
            )}
          </pre>
        </Card>
      ) : assessments?.length ? (
        <Card className="overflow-hidden p-0">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                  Title
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                  Total Marks
                </th>
                <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-slate-50">
                  <td className="border-b border-slate-200 px-4 py-3">
                    <Link
                      href={`/dashboard/assessments/${assessment.id}`}
                      className="font-medium text-slate-900 underline"
                    >
                      {assessment.title}
                    </Link>
                  </td>
                  <td className="border-b border-slate-200 px-4 py-3 capitalize">
                    {assessment.status}
                  </td>
                  <td className="border-b border-slate-200 px-4 py-3">
                    {assessment.total_marks}
                  </td>
                  <td className="border-b border-slate-200 px-4 py-3">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            No assessments yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create your first draft assessment to start adding MCQ questions.
          </p>
        </Card>
      )}
    </div>
  );
}