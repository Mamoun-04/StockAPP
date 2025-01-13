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

// Export the function so it can be used by learning.ts
export async function generateLesson(topic: string, difficulty: string): Promise<string> {
  const prompt = `Create a comprehensive trading lesson about "${topic}" for ${difficulty} level traders.
  The lesson should include:
  - A clear introduction
  - 3-5 key learning objectives
  - Detailed explanations of core concepts
  - Real-world examples
  - Common pitfalls to avoid
  - Practice questions with answers

  Format the response in markdown with these sections:

  # ${topic}

  ## Learning Objectives
  [List 3-5 specific learning objectives]

  ## Introduction
  [Brief overview and importance of the topic]

  ## Core Concepts
  [Explain main concepts with examples]

  ### Key Terms
  [Define important terminology]

  ## Real-World Applications
  [At least 2 detailed real-world trading scenarios]

  ## Common Mistakes
  [List of typical mistakes with prevention strategies]

  ## Knowledge Check
  [Include practice questions with detailed answers]

  ## Summary
  [Key takeaways and action items]

  Format everything in proper markdown with clear sections and examples.
  Keep the tone educational but engaging.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are an expert trading educator creating clear, accurate lessons about trading and investing. Focus on practical examples and real market scenarios."
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

async function generateAndStoreLesson({
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
    const content = await generateLesson(title, difficulty);

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
    title: "Introduction to Stock Markets",
    description: "Learn the basics of how stock markets work, including market structure, order types, and trading fundamentals",
    difficulty: "Beginner",
    topic: "Stock Market Fundamentals",
    order: 1,
    xpReward: 100
  }
];

export async function generateInitialLessons(): Promise<void> {
  console.log("Starting initial lesson generation...");

  try {
    await generateAndStoreLesson(initialLessons[0]);
  } catch (error) {
    console.error(`Failed to generate lesson ${initialLessons[0].title}:`, error);
  }

  console.log("Completed initial lesson generation");
}