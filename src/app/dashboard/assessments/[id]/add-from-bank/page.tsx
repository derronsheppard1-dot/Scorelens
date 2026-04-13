import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bulkAddQuestionsToAssessment } from "@/lib/actions/assessment-questions";

type AddFromBankPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    added?: string;
    skipped?: string;
    search?: string;
    subject?: string;
    topic?: string;
    level?: string;
  }>;
};

type AssessmentRow = {
  id: string;
  title: string;
  status: string | null;
  total_marks: number | null;
};

type QuestionRow = {
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
  created_at: string;
};

function uniqueSorted(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b)
  );
}

export default async function AddFromBankPage({
  params,
  searchParams,
}: AddFromBankPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const pageError = resolvedSearchParams?.error;
  const added = Number(resolvedSearchParams?.added ?? 0);
  const skipped = Number(resolvedSearchParams?.skipped ?? 0);

  const search = (resolvedSearchParams?.search ?? "").trim();
  const subject = (resolvedSearchParams?.subject ?? "").trim();
  const topic = (resolvedSearchParams?.topic ?? "").trim();
  const level = (resolvedSearchParams?.level ?? "").trim();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, title, status, total_marks")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();

  if (assessmentError || !assessment) {
    redirect(
      `/dashboard/assessments?error=${encodeURIComponent("Assessment not found")}`
    );
  }

  const { data: allTeacherQuestions, error: allQuestionsError } = await supabase
    .from("questions")
    .select("id, subject, topic, level")
    .eq("teacher_id", user.id);

  if (allQuestionsError) {
    redirect(
      `/dashboard/assessments/${id}?error=${encodeURIComponent(
        "Failed to load filter data"
      )}`
    );
  }

  let questionsQuery = supabase
    .from("questions")
    .select(`
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
      level,
      created_at
    `)
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  if (search) {
    questionsQuery = questionsQuery.ilike("question_text", `%${search}%`);
  }

  if (subject) {
    questionsQuery = questionsQuery.eq("subject", subject);
  }

  if (topic) {
    questionsQuery = questionsQuery.eq("topic", topic);
  }

  if (level) {
    questionsQuery = questionsQuery.eq("level", level);
  }

  const { data: questions, error: questionsError } = await questionsQuery;

  if (questionsError) {
    redirect(
      `/dashboard/assessments/${id}?error=${encodeURIComponent(
        "Failed to load question bank"
      )}`
    );
  }

  const { data: linkedQuestions, error: linkedQuestionsError } = await supabase
    .from("assessment_questions")
    .select("question_id")
    .eq("assessment_id", id);

  if (linkedQuestionsError) {
    redirect(
      `/dashboard/assessments/${id}?error=${encodeURIComponent(
        "Failed to load assessment questions"
      )}`
    );
  }

  const linkedQuestionIds = new Set(
    (linkedQuestions ?? []).map((row) => row.question_id)
  );

  const subjectOptions = uniqueSorted(
    (allTeacherQuestions ?? []).map((q) => q.subject)
  );
  const topicOptions = uniqueSorted((allTeacherQuestions ?? []).map((q) => q.topic));
  const levelOptions = uniqueSorted((allTeacherQuestions ?? []).map((q) => q.level));

  const typedAssessment = assessment as AssessmentRow;
  const typedQuestions = (questions ?? []) as QuestionRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Add from Question Bank
          </h1>
          <p className="text-sm text-slate-600">
            Select one or more questions to add to this assessment.
          </p>
        </div>

        <Link
          href={`/dashboard/assessments/${typedAssessment.id}`}
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Assessment
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            Assessment
          </span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {typedAssessment.status ?? "draft"}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Total marks: {typedAssessment.total_marks ?? 0}
          </span>
        </div>

        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          {typedAssessment.title}
        </h2>
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

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <form method="get" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="md:col-span-2 xl:col-span-2">
            <label
              htmlFor="search"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Search question text
            </label>
            <input
              id="search"
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by keyword"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              defaultValue={subject}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="topic"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Topic
            </label>
            <select
              id="topic"
              name="topic"
              defaultValue={topic}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All topics</option>
              {topicOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="level"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Level
            </label>
            <select
              id="level"
              name="level"
              defaultValue={level}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All levels</option>
              {levelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3 md:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply Filters
            </button>

            <Link
              href={`/dashboard/assessments/${typedAssessment.id}/add-from-bank`}
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </Link>
          </div>
        </form>
      </div>

      {typedQuestions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No matching questions found
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try changing your search or filters, or create new questions in the
            bank.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/dashboard/questions/new"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create Question
            </Link>

            <Link
              href={`/dashboard/assessments/${typedAssessment.id}/add-from-bank`}
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </Link>
          </div>
        </div>
      ) : (
        <form action={bulkAddQuestionsToAssessment} className="space-y-6">
          <input type="hidden" name="assessmentId" value={typedAssessment.id} />
          <input type="hidden" name="source" value="assessment-page" />
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              Tick the questions you want to add. Questions already in this
              assessment are disabled.
            </p>

            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add Selected Questions
            </button>
          </div>

          <div className="grid gap-4">
            {typedQuestions.map((question, index) => {
              const alreadyLinked = linkedQuestionIds.has(question.id);

              return (
                <label
                  key={question.id}
                  className={`block rounded-xl border bg-white p-5 shadow-sm ${
                    alreadyLinked ? "opacity-70" : "cursor-pointer"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        name="questionIds"
                        value={question.id}
                        disabled={alreadyLinked}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          MCQ
                        </span>

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

                        {alreadyLinked ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                            Already in assessment
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Question {index + 1}
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-slate-900">
                          {question.question_text}
                        </h2>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700">
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">A.</span> {question.option_a}
                        </div>
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">B.</span> {question.option_b}
                        </div>
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">C.</span> {question.option_c}
                        </div>
                        <div className="rounded-md border border-slate-200 px-3 py-2">
                          <span className="font-medium">D.</span> {question.option_d}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-green-700">
                        Correct answer: {question.correct_option}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add Selected Questions
            </button>
          </div>
        </form>
      )}
    </div>
  );
}