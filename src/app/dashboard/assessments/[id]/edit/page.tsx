import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateQuestion } from "@/lib/actions/assessments";

type EditQuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    questionId?: string;
    error?: string;
  }>;
};

type JoinedQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  subject: string | null;
  topic: string | null;
  level: string | null;
};

type AssessmentQuestionRow = {
  id: string;
  assessment_id: string;
  question_id: string;
  questions: JoinedQuestion | JoinedQuestion[] | null;
};

function normalizeJoinedQuestion(
  value: JoinedQuestion | JoinedQuestion[] | null
): JoinedQuestion | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function EditQuestionPage({
  params,
  searchParams,
}: EditQuestionPageProps) {
  const { id: assessmentId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const questionId = resolvedSearchParams.questionId ?? "";
  const pageError = resolvedSearchParams.error;

  if (!questionId) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Missing question id.
        </div>

        <Link
          href={`/dashboard/assessments/${assessmentId}`}
          className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to assessment
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assessment_questions")
    .select(`
      id,
      assessment_id,
      question_id,
      questions (
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        marks,
        subject,
        topic,
        level
      )
    `)
    .eq("id", questionId)
    .eq("assessment_id", assessmentId)
    .single();

  const questionRow = data as AssessmentQuestionRow | null;
  const linkedQuestion = normalizeJoinedQuestion(questionRow?.questions ?? null);

  if (error || !questionRow || !linkedQuestion) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Question not found.
        </div>

        <Link
          href={`/dashboard/assessments/${assessmentId}`}
          className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Question
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Update the question text, options, correct answer, marks, and tags.
          </p>
        </div>

        <Link
          href={`/dashboard/assessments/${assessmentId}`}
          className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back
        </Link>
      </div>

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <form
        action={updateQuestion}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="assessmentId" value={assessmentId} />
        <input type="hidden" name="questionId" value={questionRow.id} />

        <div className="space-y-2">
          <label
            htmlFor="questionText"
            className="block text-sm font-medium text-slate-700"
          >
            Question Text
          </label>
          <textarea
            id="questionText"
            name="questionText"
            defaultValue={linkedQuestion.question_text}
            rows={4}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
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
              defaultValue={linkedQuestion.subject ?? ""}
              placeholder="e.g. Geography"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
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
              defaultValue={linkedQuestion.topic ?? ""}
              placeholder="e.g. Climate"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
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
              defaultValue={linkedQuestion.level ?? ""}
              placeholder="e.g. Form 4"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Select the correct answer
          </p>

          {[
            { key: "A", name: "optionA", value: linkedQuestion.option_a },
            { key: "B", name: "optionB", value: linkedQuestion.option_b },
            { key: "C", name: "optionC", value: linkedQuestion.option_c },
            { key: "D", name: "optionD", value: linkedQuestion.option_d },
          ].map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50"
            >
              <input
                type="radio"
                name="correctOption"
                value={opt.key}
                defaultChecked={linkedQuestion.correct_option === opt.key}
                className="h-4 w-4"
                required
              />

              <span className="font-medium text-slate-700">{opt.key}.</span>

              <input
                type="text"
                name={opt.name}
                defaultValue={opt.value}
                required
                className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
              />
            </label>
          ))}
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
            min={1}
            defaultValue={linkedQuestion.marks}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save Changes
          </button>

          <Link
            href={`/dashboard/assessments/${assessmentId}`}
            className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}