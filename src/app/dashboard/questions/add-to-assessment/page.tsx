import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bulkAddQuestionsToAssessment } from "@/lib/actions/assessment-questions";

type AddSelectedQuestionsPageProps = {
  searchParams?: Promise<{
    error?: string;
    added?: string;
    skipped?: string;
    questionIds?: string | string[];
  }>;
};

type AssessmentRow = {
  id: string;
  title: string;
  status: string | null;
  total_marks: number | null;
  created_at: string;
};

type QuestionPreviewRow = {
  id: string;
  question_text: string;
  marks: number;
  subject: string | null;
  topic: string | null;
  level: string | null;
};

function normalizeQuestionIds(
  value: string | string[] | undefined
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  return [value.trim()].filter(Boolean);
}

export default async function AddSelectedQuestionsPage({
  searchParams,
}: AddSelectedQuestionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const pageError = resolvedSearchParams?.error;
  const added = Number(resolvedSearchParams?.added ?? 0);
  const skipped = Number(resolvedSearchParams?.skipped ?? 0);
  const selectedQuestionIds = Array.from(
    new Set(normalizeQuestionIds(resolvedSearchParams?.questionIds))
  );

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  if (selectedQuestionIds.length === 0) {
    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "Select at least one question"
      )}`
    );
  }

  const { data: selectedQuestions, error: questionsError } = await supabase
    .from("questions")
    .select("id, question_text, marks, subject, topic, level")
    .eq("teacher_id", user.id)
    .in("id", selectedQuestionIds);

  if (questionsError) {
    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "Failed to load selected questions"
      )}`
    );
  }

  const { data: assessments, error: assessmentsError } = await supabase
    .from("assessments")
    .select("id, title, status, total_marks, created_at")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (assessmentsError) {
    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "Failed to load assessments"
      )}`
    );
  }

  const typedQuestions = (selectedQuestions ?? []) as QuestionPreviewRow[];
  const typedAssessments = (assessments ?? []) as AssessmentRow[];

  if (typedQuestions.length === 0) {
    redirect(
      `/dashboard/questions?error=${encodeURIComponent(
        "No valid questions selected"
      )}`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Add Selected Questions to Assessment
          </h1>
          <p className="text-sm text-slate-600">
            Choose one assessment to receive your selected questions.
          </p>
        </div>

        <Link
          href="/dashboard/questions"
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Question Bank
        </Link>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {!pageError && (added > 0 || skipped > 0) ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Added {added} question{added === 1 ? "" : "s"}
          {skipped > 0
            ? `, skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}.`
            : "."}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Selected Questions ({typedQuestions.length})
        </h2>

        <div className="mt-4 grid gap-3">
          {typedQuestions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {question.marks} mark{question.marks === 1 ? "" : "s"}
                </span>

                {question.subject ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {question.subject}
                  </span>
                ) : null}

                {question.topic ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {question.topic}
                  </span>
                ) : null}

                {question.level ? (
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                    {question.level}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                Question {index + 1}
              </p>
              <h3 className="mt-1 text-sm font-medium text-slate-900">
                {question.question_text}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {typedAssessments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No assessments available
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Create an assessment first, then come back and add these questions.
          </p>

          <div className="mt-4">
            <Link
              href="/dashboard/assessments/create"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Assessment
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {typedAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {assessment.title}
                  </h3>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {assessment.status ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                        Status: {assessment.status}
                      </span>
                    ) : null}

                    <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                      Total marks: {assessment.total_marks ?? 0}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Created: {new Date(assessment.created_at).toLocaleString()}
                  </p>
                </div>

                <form action={bulkAddQuestionsToAssessment}>
                  <input type="hidden" name="assessmentId" value={assessment.id} />
                  <input type="hidden" name="source" value="question-bank" />

                  {typedQuestions.map((question) => (
                    <input
                      key={question.id}
                      type="hidden"
                      name="questionIds"
                      value={question.id}
                    />
                  ))}

                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add to This Assessment
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}