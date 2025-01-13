import OpenAI from "openai";
import { db } from "@db";
import { lessons } from "@db/schema";
import { eq } from "drizzle-orm";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateLesson(topic: string, difficulty: string): Promise<string> {
  const prompt = `Create a comprehensive, multi-section trading lesson about "${topic}" for ${difficulty} level traders.

  Structure the lesson in multiple sections, each starting with "## " to denote a new section:

  # ${topic}

  ## Introduction
  [Brief overview of what will be covered and why it's important]

  ## Key Concepts
  [Detailed explanation of the fundamental concepts]

  ## Technical Details
  [In-depth technical information with examples]

  ## Practical Applications
  [Real-world trading scenarios and examples]

  ## Common Mistakes and How to Avoid Them
  [Detailed analysis of common pitfalls]

  ## Advanced Strategies
  [More sophisticated approaches and techniques]

  ## Practice Exercises
  [Hands-on exercises with solutions]

  ## Summary
  [Key takeaways and next steps]

  Make each section substantial with detailed explanations, examples, and where appropriate, code snippets or mathematical formulas. Format everything in proper markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are an expert trading educator with decades of experience creating clear, accurate, and comprehensive lessons about trading and investing. Focus on practical examples and real market scenarios."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating lesson:', error);
    throw error;
  }
}

export async function generateAndStoreLesson({
  title,
  description,
  difficulty,
  topic,
  order,
  xpReward
}: {
  title: string;
  description: string;
  difficulty: string;
  topic: string;
  order: number;
  xpReward: number;
}): Promise<void> {
  try {
    // Check if lesson already exists
    const existingLesson = await db.query.lessons.findFirst({
      where: eq(lessons.title, title)
    });

    if (existingLesson) {
      console.log(`Lesson "${title}" already exists, skipping generation`);
      return;
    }

    console.log(`Generating lesson: ${title}`);
    const content = await generateLesson(topic, difficulty);

    // Store the lesson in the database
    await db.insert(lessons).values({
      title,
      description,
      difficulty,
      content,
      order,
      xpReward,
    });

    console.log(`Successfully generated and stored lesson: ${title}`);
  } catch (error) {
    console.error(`Error processing lesson ${title}:`, error);
    throw error;
  }
}

// Single test lesson
const initialLessons = [
  {
    title: "Technical Analysis Mastery",
    description: "A comprehensive guide to technical analysis, covering chart patterns, indicators, and practical trading strategies",
    difficulty: "Intermediate",
    topic: "Technical Analysis",
    order: 1,
    xpReward: 150
  }
];

export async function generateInitialLessons(): Promise<void> {
  console.log("Starting initial lesson generation...");

  // Clear existing lessons first
  await db.delete(lessons);

  // Generate new lesson
  for (const lesson of initialLessons) {
    try {
      await generateAndStoreLesson(lesson);
    } catch (error) {
      console.error(`Failed to generate lesson ${lesson.title}:`, error);
    }
  }

  console.log("Completed initial lesson generation");
}