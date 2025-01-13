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
  const prompt = `Create a comprehensive trading lesson about "${topic}" for ${difficulty} level traders.
  The lesson should include:
  - A clear introduction
  - 3-5 key learning objectives
  - Detailed explanations of core concepts
  - Real-world examples
  - Common pitfalls to avoid
  - Practice questions with answers

  Format the response in markdown with clear sections.
  Keep the tone educational but engaging.
  Include specific examples and scenarios where applicable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are an expert trading educator creating clear, accurate lessons about trading and investing."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
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
    const content = await generateLesson(topic, difficulty);

    await db.insert(lessons).values({
      title,
      description,
      difficulty,
      content,
      order,
      xpReward,
    });

    console.log(`Generated and stored lesson: ${title}`);
  } catch (error) {
    console.error(`Error processing lesson ${title}:`, error);
    throw error;
  }
}

// Initial lessons to generate
const initialLessons = [
  {
    title: "Introduction to Stock Market Fundamentals",
    description: "Learn the essential concepts of how stock markets work, basic terminology, and fundamental principles of trading.",
    difficulty: "Beginner",
    topic: "Market Basics",
    order: 1,
    xpReward: 100
  },
  {
    title: "Advanced Chart Pattern Analysis",
    description: "Master complex technical analysis patterns and learn how to identify high-probability trading setups.",
    difficulty: "Intermediate",
    topic: "Technical Analysis",
    order: 2,
    xpReward: 150
  },
  {
    title: "Portfolio Risk Management Strategies",
    description: "Learn sophisticated approaches to managing trading risk, position sizing, and portfolio diversification.",
    difficulty: "Advanced",
    topic: "Risk Management",
    order: 3,
    xpReward: 200
  }
];

export async function generateInitialLessons(): Promise<void> {
  for (const lesson of initialLessons) {
    try {
      // Check if lesson already exists
      const existingLesson = await db.query.lessons.findFirst({
        where: eq(lessons.title, lesson.title)
      });

      if (!existingLesson) {
        await generateAndStoreLesson(lesson);
      }
    } catch (error) {
      console.error(`Failed to generate lesson ${lesson.title}:`, error);
    }
  }
}