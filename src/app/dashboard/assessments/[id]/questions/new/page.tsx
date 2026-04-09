import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/app/page-header";
import Card from "@/components/ui/card";
import { addQuestion } from "@/lib/actions/assessments";

type NewQuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewQuestionPage({
  params,
  searchParams,
}: NewQuestionPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("id, title")
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .maybeSingle();

  if (error || !assessment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Question"
        description={`Create a new question and add it to ${assessment.title}.`}
      />

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <Card>
        <form action={addQuestion} className="space-y-5">
          <input type="hidden" name="assessmentId" value={assessment.id} />

          <div className="space-y-2">
            <label
              htmlFor="questionText"
              className="block text-sm font-medium text-slate-700"
            >
              Question
            </label>
            <textarea
              id="questionText"
              name="questionText"
              required
              rows={4}
              placeholder="Enter the question stem"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-700"
              >
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="e.g. Geography"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-slate-700"
              >
                Topic
              </label>
              <input
                id="topic"
                name="topic"
                type="text"
                placeholder="e.g. Climate"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="level"
                className="block text-sm font-medium text-slate-700"
              >
                Level
              </label>
              <input
                id="level"
                name="level"
                type="text"
                placeholder="e.g. Form 4"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="optionA"
                className="block text-sm font-medium text-slate-700"
              >
                Option A
              </label>
              <input
                id="optionA"
                name="optionA"
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="optionB"
                className="block text-sm font-medium text-slate-700"
              >
                Option B
              </label>
              <input
                id="optionB"
                name="optionB"
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="optionC"
                className="block text-sm font-medium text-slate-700"
              >
                Option C
              </label>
              <input
                id="optionC"
                name="optionC"
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="optionD"
                className="block text-sm font-medium text-slate-700"
              >
                Option D
              </label>
              <input
                id="optionD"
                name="optionD"
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="correctOption"
                className="block text-sm font-medium text-slate-700"
              >
                Correct Option
              </label>
              <select
                id="correctOption"
                name="correctOption"
                defaultValue="A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="marks"
                className="block text-sm font-medium text-slate-700"
              >
                Marks
              </label>
              <input
                id="marks"
                name="marks"
                type="number"
                min="1"
                defaultValue="1"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Question
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}