import PageHeader from "@/components/app/page-header";
import Card from "@/components/ui/card";
import { createAssessment } from "@/lib/actions/assessments";

type NewAssessmentPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewAssessmentPage({
  searchParams,
}: NewAssessmentPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Assessment"
        description="Create a draft assessment, then add MCQ questions."
      />

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <Card>
        <form action={createAssessment} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-slate-700"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Form 4 Plate Tectonics Quiz"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue="draft"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="total_marks"
              className="block text-sm font-medium text-slate-700"
            >
              Total Marks
            </label>
            <input
              id="total_marks"
              name="total_marks"
              type="number"
              min="1"
              required
              placeholder="10"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Assessment
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}