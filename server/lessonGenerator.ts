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
  const prompt = `Create a comprehensive, in-depth trading lesson about "${topic}" for ${difficulty} level traders.
  The lesson should be detailed enough to take 5-10 minutes to read and understand thoroughly.

  Structure the lesson with the following sections:
  1. Introduction
     - Overview of the topic
     - Why this knowledge is important
     - What traders will learn

  2. Core Concepts (3-5 main concepts)
     - Detailed explanations with real-world examples
     - Historical context where relevant
     - Common misconceptions and how to avoid them

  3. Practical Application
     - Step-by-step guides
     - Real market scenarios
     - Decision-making frameworks
     - Tools and techniques

  4. Risk Considerations
     - Potential pitfalls
     - Risk management strategies
     - Common mistakes to avoid

  5. Advanced Concepts (for intermediate/advanced lessons)
     - Complex strategies
     - Market psychology
     - Advanced tools and techniques

  6. Practice and Exercises
     - Case studies
     - Practice scenarios
     - Self-assessment questions
     - Homework assignments

  7. Summary and Key Takeaways
     - Main points recap
     - Action items
     - Further reading suggestions

  Format the response in markdown with clear sections.
  Use tables, bullet points, and numbered lists where appropriate.
  Include specific examples from real market situations.
  Add practical exercises that readers can complete.
  Keep the tone educational but engaging.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are an expert trading educator with decades of experience creating clear, accurate, and comprehensive lessons about trading and investing. Your goal is to create content that is both educational and engaging, with a focus on practical application and real-world examples."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7,
      max_tokens: 4000, // Increased for longer content
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

// Initial lessons to generate
const initialLessons = [
  {
    title: "Understanding Market Psychology and Trading Behavior",
    description: "Learn the fundamental psychological principles that drive market movements and how to master your own trading psychology for better decision-making.",
    difficulty: "Beginner",
    topic: "Trading Psychology",
    order: 1,
    xpReward: 100
  },
  {
    title: "Advanced Options Trading Strategies",
    description: "Master complex options trading strategies including multi-leg positions, volatility trading, and advanced risk management techniques.",
    difficulty: "Advanced",
    topic: "Options Trading",
    order: 2,
    xpReward: 200
  },
  {
    title: "Technical Analysis: From Basics to Advanced Patterns",
    description: "A comprehensive guide to technical analysis, covering everything from basic chart patterns to complex indicators and their practical application in trading.",
    difficulty: "Intermediate",
    topic: "Technical Analysis",
    order: 3,
    xpReward: 150
  }
];

export async function generateInitialLessons(): Promise<void> {
  console.log("Starting initial lesson generation...");

  for (const lesson of initialLessons) {
    try {
      await generateAndStoreLesson(lesson);
    } catch (error) {
      console.error(`Failed to generate lesson ${lesson.title}:`, error);
    }
  }

  console.log("Completed initial lesson generation");
}