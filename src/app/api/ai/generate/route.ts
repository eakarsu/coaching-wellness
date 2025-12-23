import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

export async function POST(request: NextRequest) {
  try {
    const { type, context } = await request.json();

    if (!OPENROUTER_API_KEY) {
      // Return sample data if no API key
      return NextResponse.json(getSampleData(type, context));
    }

    const prompt = getPromptForType(type, context);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Wellness Coach Pro'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a professional wellness coach assistant. Respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', await response.text());
      return NextResponse.json(getSampleData(type, context));
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(getSampleData(type, context));
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}

function getPromptForType(type: string, context: Record<string, string>): string {
  const clientInfo = context.clientName ? `for client ${context.clientName} with goals: ${context.clientGoals || 'general wellness'} and health conditions: ${context.clientHealthConditions || 'none'}` : '';

  switch (type) {
    case 'workout':
      return `Generate a personalized workout plan ${clientInfo} in JSON format with these fields: name, description, category (Strength/Cardio/HIIT/Flexibility), difficulty (Beginner/Intermediate/Advanced), duration (number in minutes), exercises (string with exercise list), caloriesBurned (number).`;
    case 'exercise':
      return `Generate a personalized exercise ${clientInfo} in JSON format with: name, description, category, muscleGroup, difficulty, sets (number), reps (number), restTime (number in seconds), equipment, instructions.`;
    case 'mealPlan':
      return `Generate a personalized meal plan ${clientInfo} in JSON format with: name, description, category (Weight Loss/Muscle Gain/Maintenance/Keto/Vegan), calories (number), protein (number), carbs (number), fat (number), meals (string describing daily meals), duration (e.g., "4 weeks"), targetGoal.`;
    case 'recipe':
      return `Generate a healthy recipe ${clientInfo} in JSON format with: name, description, category (Breakfast/Lunch/Dinner/Snack/Smoothie), calories (number), protein (number), carbs (number), fat (number), ingredients (string list), instructions (string), prepTime (number), cookTime (number), servings (number).`;
    case 'goal':
      return `Generate a wellness goal ${clientInfo} in JSON format with: title, description, goalType (Weight Loss/Muscle Gain/Flexibility/Endurance/Nutrition/Sleep/Stress), targetValue (number), unit (lbs/kg/%/hours/days), startDate (today's date), targetDate (3 months from now), notes.`;
    case 'appointment':
      return `Generate an appointment suggestion ${clientInfo} in JSON format with: appointmentType (Initial Consultation/Follow-up/Training Session/Nutrition Review/Progress Check/Goal Setting), duration (number in minutes, typically 30/45/60), notes (string with session focus), location (Main Studio/Online/Gym Floor).`;
    case 'client':
      return `Generate a sample client profile in JSON format with: name, email, phone, age (number), gender (Male/Female/Other), goals (string with fitness goals), healthConditions (string or "None"), status (active), notes.`;
    case 'progress':
      return `Generate a progress log entry ${clientInfo} in JSON format with: weight (number in lbs), bodyFat (number percentage), muscleMass (number in lbs), waterIntake (number in liters), sleepHours (number), energyLevel (number 1-10), stressLevel (number 1-10), notes.`;
    default:
      return 'Generate sample wellness data in JSON format.';
  }
}

function getSampleData(type: string, context: Record<string, string>) {
  const today = new Date().toISOString().split('T')[0];
  const threeMonths = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  switch (type) {
    case 'workout':
      return {
        name: 'AI Power Strength Circuit',
        description: 'A comprehensive strength training workout designed to build muscle and increase overall power. Perfect for intermediate fitness enthusiasts.',
        category: 'Strength',
        difficulty: 'Intermediate',
        duration: 45,
        exercises: '1. Barbell Squats - 4x8\n2. Bench Press - 4x8\n3. Bent Over Rows - 3x10\n4. Overhead Press - 3x10\n5. Romanian Deadlifts - 3x12\n6. Pull-ups - 3x8\n7. Plank Hold - 3x45sec'
      };
    case 'exercise':
      return {
        name: 'Bulgarian Split Squat',
        description: 'A unilateral leg exercise that targets the quadriceps, glutes, and hamstrings while improving balance and stability.',
        category: 'Strength',
        muscleGroup: 'Legs',
        difficulty: 'Intermediate',
        sets: 3,
        reps: 12,
        duration: 0,
        equipment: 'Dumbbells, Bench',
        instructions: '1. Stand 2 feet in front of a bench\n2. Place one foot behind you on the bench\n3. Lower your body until your front thigh is parallel to the ground\n4. Push through your front heel to return to starting position\n5. Complete all reps on one side, then switch legs'
      };
    case 'mealPlan':
      return {
        name: 'AI Balanced Nutrition Plan',
        description: 'A well-rounded meal plan focused on whole foods, lean proteins, and complex carbohydrates for sustained energy throughout the day.',
        category: 'Maintenance',
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 67,
        meals: 'Breakfast: Greek yogurt parfait with berries and granola\nSnack: Apple with almond butter\nLunch: Grilled chicken salad with quinoa\nSnack: Protein shake with banana\nDinner: Baked salmon with roasted vegetables and brown rice',
        duration: '4 weeks',
        targetGoal: 'Maintain healthy weight while building lean muscle'
      };
    case 'recipe':
      return {
        name: 'Protein-Packed Quinoa Bowl',
        description: 'A delicious and nutritious bowl featuring quinoa, grilled chicken, and fresh vegetables with a lemon tahini dressing.',
        category: 'Lunch',
        calories: 520,
        protein: 42,
        carbs: 48,
        fat: 18,
        ingredients: '1 cup cooked quinoa\n6 oz grilled chicken breast\n1 cup mixed greens\n1/2 cucumber, diced\n1/4 cup cherry tomatoes\n2 tbsp tahini\n1 tbsp lemon juice\nSalt and pepper to taste',
        instructions: '1. Cook quinoa according to package directions\n2. Season and grill chicken breast until cooked through\n3. Slice chicken and arrange over quinoa\n4. Add mixed greens, cucumber, and tomatoes\n5. Whisk tahini with lemon juice for dressing\n6. Drizzle dressing over bowl and serve',
        prepTime: 15,
        cookTime: 20,
        servings: 1
      };
    case 'goal':
      return {
        title: 'Build Core Strength',
        description: 'Develop a stronger core through consistent training and progressive exercises to improve posture and overall fitness.',
        goalType: 'Strength',
        targetValue: 60,
        currentValue: 0,
        unit: 'days',
        startDate: today,
        targetDate: threeMonths,
        notes: 'Focus on plank variations, ab exercises, and compound movements. Track progress with plank hold times.'
      };
    case 'appointment':
      return {
        appointmentType: 'Training Session',
        duration: 60,
        notes: 'Focus on strength training fundamentals and proper form. Review progress from last session.',
        location: 'Main Studio'
      };
    case 'client':
      return {
        name: 'Alex Johnson',
        email: 'alex.johnson@email.com',
        phone: '555-0199',
        age: 32,
        gender: 'Male',
        goals: 'Build muscle mass, improve cardiovascular health, maintain work-life balance',
        healthConditions: 'None',
        status: 'active',
        notes: 'Motivated individual looking to establish consistent fitness routine'
      };
    case 'progress':
      return {
        weight: 175,
        bodyFat: 18,
        muscleMass: 145,
        waterIntake: 8,
        sleepHours: 7.5,
        energyLevel: 7,
        stressLevel: 4,
        notes: 'Good progress this week. Energy levels improving with better sleep schedule.'
      };
    default:
      return { message: 'Sample data generated' };
  }
}
