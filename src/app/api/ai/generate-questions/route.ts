import { NextResponse } from "next/server";
import type {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  GeneratedQuestion,
} from "@/lib/ai/question-generator";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function validateRequest(body: Partial<GenerateQuestionsRequest>) {
  if (!body.subject?.trim()) return "Subject is required.";
  if (!body.level?.trim()) return "Level is required.";
  if (!body.topic?.trim()) return "Topic is required.";

  if (
    typeof body.count !== "number" ||
    Number.isNaN(body.count) ||
    body.count < 1 ||
    body.count > 5
  ) {
    return "Count must be a number between 1 and 5.";
  }

  if (!body.difficulty?.trim()) return "Difficulty is required.";

  return null;
}

function validateGeneratedQuestion(
  question: Partial<GeneratedQuestion>,
): question is GeneratedQuestion {
  const validCorrectOptions = new Set(["A", "B", "C", "D"]);

  return Boolean(
    question.question_text?.trim() &&
      question.option_a?.trim() &&
      question.option_b?.trim() &&
      question.option_c?.trim() &&
      question.option_d?.trim() &&
      question.subject?.trim() &&
      question.topic?.trim() &&
      question.level?.trim() &&
      question.correct_option &&
      validCorrectOptions.has(question.correct_option),
  );
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as GenerateQuestionsRequest;
    const requestError = validateRequest(body);

    if (requestError) {
      return NextResponse.json({ error: requestError }, { status: 400 });
    }

    const {
      subject,
      level,
      topic,
      subtopic,
      difficulty,
      cognitiveLevel,
      questionStyle,
      count,
      preferCaribbeanContext = true,
      additionalInstructions,
    } = body;

    const systemPrompt = [
      "You are an expert teacher assessment writer.",
      "Generate high-quality multiple-choice questions for school use.",
      "Questions must be clear, unambiguous, and appropriate for the requested level.",
      "All options must be plausible.",
      'Do not use "all of the above" or "none of the above".',
      "Avoid trick wording.",
      preferCaribbeanContext
        ? "Use Caribbean/CXC-style wording or context where appropriate."
        : "Use general academic wording.",
    ].join(" ");

    const userPrompt = [
      `Create ${count} MCQ question(s).`,
      `Subject: ${subject}`,
      `Level: ${level}`,
      `Topic: ${topic}`,
      subtopic ? `Subtopic: ${subtopic}` : null,
      `Difficulty: ${difficulty}`,
      cognitiveLevel ? `Cognitive level: ${cognitiveLevel}` : null,
      questionStyle ? `Question style: ${questionStyle}` : null,
      additionalInstructions
        ? `Additional instructions: ${additionalInstructions}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const schema = {
      name: "scorelens_generated_questions",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          questions: {
            type: "array",
            minItems: count,
            maxItems: count,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                question_text: { type: "string" },
                option_a: { type: "string" },
                option_b: { type: "string" },
                option_c: { type: "string" },
                option_d: { type: "string" },
                correct_option: {
                  type: "string",
                  enum: ["A", "B", "C", "D"],
                },
                subject: { type: "string" },
                topic: { type: "string" },
                level: { type: "string" },
                subtopic: { type: "string" },
              },
              required: [
                "question_text",
                "option_a",
                "option_b",
                "option_c",
                "option_d",
                "correct_option",
                "subject",
                "topic",
                "level",
                "subtopic",
              ],
            },
          },
        },
        required: ["questions"],
      },
    };

    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            ...schema,
          },
        },
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return NextResponse.json(
        { error: `OpenAI request failed: ${errorText}` },
        { status: 500 },
      );
    }

    const data = await openAiResponse.json();

    const outputText = data.output_text;
    if (!outputText) {
      return NextResponse.json(
        { error: "OpenAI returned no structured output." },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(outputText) as GenerateQuestionsResponse;

    if (
      !parsed.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length !== count
    ) {
      return NextResponse.json(
        { error: "AI returned an unexpected number of questions." },
        { status: 500 },
      );
    }

    const allValid = parsed.questions.every(validateGeneratedQuestion);

    if (!allValid) {
      return NextResponse.json(
        { error: "AI returned invalid question data." },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("generate-questions route error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions." },
      { status: 500 },
    );
  }
}