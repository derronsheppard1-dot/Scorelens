import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/card";
import PageHeader from "@/components/app/page-header";
import ButtonLink from "@/components/ui/button-link";
import AssessmentQuestionsList from "@/components/app/assessment-question-list";

type AssessmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type QuestionBankQuestion = {
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

type RawAssessmentQuestionRow = {
  id: string;
  assessment_id: string;
  question_id: string;
  position: number;
  questions: QuestionBankQuestion | QuestionBankQuestion[] | null;
};

type AssessmentQuestionRow = {
  id: string;
  assessment_id: string;
  question_id: string;
  position: number;
  questions: QuestionBankQuestion | null;
};

function normalizeJoinedQuestion(
  value: QuestionBankQuestion | QuestionBankQuestion[] | null
): QuestionBankQuestion | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: AssessmentDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageError = resolvedSearchParams?.error;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("id, title, status, total_marks, created_at")
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .maybeSingle();

  if (error || !assessment) {
    notFound();
  }

  const { data: rawQuestions, error: questionsError } = await supabase
    .from("assessment_questions")
    .select(`
      id,
      assessment_id,
      question_id,
      position,
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
    .eq("assessment_id", assessment.id)
    .order("position", { ascending: true });

  const normalizedQuestions: AssessmentQuestionRow[] = (
    (rawQuestions ?? []) as RawAssessmentQuestionRow[]
  )
    .map((row) => ({
      id: row.id,
      assessment_id: row.assessment_id,
      question_id: row.question_id,
      position: row.position,
      questions: normalizeJoinedQuestion(row.questions),
    }))
    .filter((row) => row.questions !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.title}
        description="Assessment details and question setup."
        actions={
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/dashboard/assessments/${assessment.id}/questions/new`}>
              Create & Add Question
            </ButtonLink>
            <ButtonLink href={`/dashboard/assessments/${assessment.id}/questions/add`}>
              Add from Question Bank
            </ButtonLink>
          </div>
        }
      />

      {pageError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      <Card>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-slate-500">Status</dt>
            <dd className="mt-1 text-sm capitalize text-slate-900">
              {assessment.status}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">Total Marks</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {assessment.total_marks}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-slate-500">Created</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {new Date(assessment.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </Card>

      {questionsError ? (
        <Card>
          <pre className="text-sm text-red-700">
            {JSON.stringify(
              {
                message: questionsError.message,
                code: questionsError.code,
                details: questionsError.details,
              },
              null,
              2
            )}
          </pre>
        </Card>
      ) : (
        <Card>
          <AssessmentQuestionsList
            assessmentId={assessment.id}
            questions={normalizedQuestions}
          />
        </Card>
      )}
    </div>
  );
}