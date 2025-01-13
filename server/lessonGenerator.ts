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
  const prompt = `Create an interactive, comprehensive trading lesson about "${topic}" for ${difficulty} level traders.

  Structure the lesson in this format:

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

  ### Practice Scenario 1
  **Situation:** [Real market situation]
  **Your Task:** [What needs to be analyzed/decided]
  <details>
  <summary>Click to see solution</summary>
  [Detailed explanation of the optimal approach]
  </details>

  ### Practice Scenario 2
  **Situation:** [Another market scenario]
  **Your Task:** [Decision making exercise]
  <details>
  <summary>Click to see solution</summary>
  [Step-by-step solution]
  </details>

  ## Common Mistakes
  [List of typical mistakes with prevention strategies]

  ## Knowledge Check
  ### Question 1
  **Q:** [Challenging question about the topic]
  <details>
  <summary>Show Answer</summary>
  [Detailed explanation]
  </details>

  ### Question 2
  **Q:** [Another scenario-based question]
  <details>
  <summary>Show Answer</summary>
  [Comprehensive answer]
  </details>

  ## Advanced Insights
  [Deeper analysis and advanced strategies]

  ## Summary
  [Key takeaways and action items]

  ## Further Resources
  [Suggested readings and tools]

  Format everything in proper markdown with clear sections and examples.`;

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
    const existingLesson = await db.query.lessons.findFirst({
      where: eq(lessons.title, title)
    });

    if (existingLesson) {
      console.log(`Lesson "${title}" already exists, skipping generation`);
      return;
    }

    console.log(`Generating lesson: ${title}`);
    const content = await generateLesson(topic, difficulty);

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