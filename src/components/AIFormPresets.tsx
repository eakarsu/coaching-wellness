"use client";

type Example = { label: string; fields: Record<string, string> };

const examples: Record<string, Example[]> = {
  client: [
    { label: "Walking client", fields: { name: "Alex Rivera (fictional)", email: "alex.rivera@example.com", phone: "555-0101", age: "38", gender: "Other", goals: "Walk three times weekly for eight weeks.", healthConditions: "No conditions supplied; confirm before planning.", status: "active", notes: "Illustrative profile; confirm all details before saving." } },
    { label: "Strength client", fields: { name: "Jordan Lee (fictional)", email: "jordan.lee@example.com", phone: "555-0102", age: "45", gender: "Female", goals: "Complete two introductory strength sessions weekly.", healthConditions: "Reports occasional fatigue; no diagnosis supplied.", status: "pending", notes: "Illustrative profile; review movement restrictions." } },
    { label: "Recovery client", fields: { name: "Morgan Chen (fictional)", email: "morgan.chen@example.com", phone: "555-0103", age: "52", gender: "Male", goals: "Resume short walks and track sleep consistency.", healthConditions: "Past knee discomfort; confirm current restrictions.", status: "active", notes: "Illustrative profile; confirm consent and history." } },
  ],
  appointment: [
    { label: "Walking check-in", fields: { appointmentType: "Follow-up", date: "2026-11-03", time: "10:00", duration: "30", status: "scheduled", notes: "Review walking routine and barriers; confirm with selected client and coach.", location: "Main Studio" } },
    { label: "Nutrition review", fields: { appointmentType: "Nutrition Review", date: "2026-11-05", time: "14:00", duration: "45", status: "scheduled", notes: "Review meal planning goals; confirm with selected client and coach.", location: "Nutrition Office" } },
    { label: "Goal setting", fields: { appointmentType: "Goal Setting", date: "2026-11-10", time: "09:30", duration: "60", status: "scheduled", notes: "Agree measurable goals and follow-up date; confirm with selected client and coach.", location: "Conference Room A" } },
  ],
  workout: [
    { label: "Walking circuit", fields: { name: "Gentle walking circuit", description: "Low impact introductory session.", category: "Cardio", difficulty: "beginner", duration: "30", caloriesBurned: "120", exercises: "Warm up 5 min; comfortable walk 20 min; cool down 5 min." } },
    { label: "Foundation strength", fields: { name: "Foundation strength", description: "Technique focused full-body session.", category: "Strength", difficulty: "beginner", duration: "40", caloriesBurned: "150", exercises: "Chair squats, wall push-ups, band rows; two sets each." } },
    { label: "Mobility day", fields: { name: "Mobility and recovery", description: "Gentle recovery session with breaks.", category: "Mobility", difficulty: "beginner", duration: "25", caloriesBurned: "80", exercises: "Easy walk, shoulder mobility, gentle stretching." } },
  ],
  exercise: [
    { label: "Chair squat", fields: { name: "Chair squat", description: "Controlled seated-to-standing movement.", muscleGroup: "Legs", equipment: "Stable chair", instructions: "Stand from chair slowly, then sit with control.", sets: "2", reps: "8", restTime: "60" } },
    { label: "Wall push-up", fields: { name: "Wall push-up", description: "Introductory upper-body movement.", muscleGroup: "Chest", equipment: "Clear wall", instructions: "Place hands on wall and bend elbows slowly.", sets: "2", reps: "10", restTime: "60" } },
    { label: "Band row", fields: { name: "Band row", description: "Light pulling movement.", muscleGroup: "Back", equipment: "Resistance band", instructions: "Pull band toward torso with shoulders relaxed.", sets: "2", reps: "10", restTime: "75" } },
  ],
  mealPlan: [
    { label: "Balanced weekdays", fields: { name: "Balanced weekday plan", description: "Regular meals and flexible portions.", category: "General wellness", calories: "2000", protein: "100", carbs: "240", fat: "70", meals: "Oatmeal and fruit; grain bowl; yogurt; beans and vegetables.", duration: "7", targetGoal: "Build a regular meal routine." } },
    { label: "Plant-forward week", fields: { name: "Plant-forward week", description: "Illustrative mix of legumes, grains and produce.", category: "Plant forward", calories: "2100", protein: "95", carbs: "260", fat: "75", meals: "Tofu scramble; lentil salad; nuts; bean chili.", duration: "7", targetGoal: "Plan varied lunches and dinners." } },
    { label: "Active day meals", fields: { name: "Active day meals", description: "Meals around a light training schedule.", category: "Active lifestyle", calories: "2300", protein: "110", carbs: "280", fat: "80", meals: "Eggs and toast; chicken rice bowl; fruit; salmon and potatoes.", duration: "5", targetGoal: "Prepare meals ahead of activity days." } },
  ],
  recipe: [
    { label: "Bean grain bowl", fields: { name: "Bean grain bowl", description: "Simple lunch with vegetables.", category: "Lunch", calories: "520", protein: "22", carbs: "68", fat: "18", ingredients: "Beans, cooked rice, greens, tomatoes, olive oil.", instructions: "Warm beans and rice; add vegetables and dressing.", prepTime: "15", cookTime: "10", servings: "2" } },
    { label: "Yogurt fruit bowl", fields: { name: "Yogurt fruit bowl", description: "Quick breakfast or snack.", category: "Breakfast", calories: "340", protein: "20", carbs: "42", fat: "10", ingredients: "Plain yogurt, berries, oats, seeds.", instructions: "Combine ingredients and serve chilled.", prepTime: "5", cookTime: "0", servings: "1" } },
    { label: "Vegetable pasta", fields: { name: "Vegetable pasta", description: "Easy dinner with greens.", category: "Dinner", calories: "610", protein: "24", carbs: "82", fat: "20", ingredients: "Whole-grain pasta, spinach, tomato sauce, chickpeas.", instructions: "Cook pasta; warm sauce and chickpeas; fold in spinach.", prepTime: "10", cookTime: "20", servings: "3" } },
  ],
  goal: [
    { label: "Walking goal", fields: { goalType: "Activity", title: "Walk three days weekly", description: "Build a sustainable walking habit.", targetValue: "3", currentValue: "1", unit: "walks per week", startDate: "2026-11-01", targetDate: "2026-12-27", status: "in_progress", notes: "Illustrative target; review with selected client." } },
    { label: "Sleep goal", fields: { goalType: "Sleep", title: "Track bedtime five nights", description: "Practice a steady evening routine.", targetValue: "5", currentValue: "2", unit: "nights per week", startDate: "2026-11-01", targetDate: "2026-12-13", status: "in_progress", notes: "Illustrative target; review with selected client." } },
    { label: "Hydration goal", fields: { goalType: "Hydration", title: "Log water intake", description: "Record daily water intake for coach review.", targetValue: "7", currentValue: "3", unit: "days per week", startDate: "2026-11-01", targetDate: "2026-12-06", status: "in_progress", notes: "Illustrative target; confirm individual needs." } },
  ],
  progress: [
    { label: "Steady check-in", fields: { date: "2026-11-03", weight: "165", bodyFat: "25", muscleMass: "62", waterIntake: "2.0", sleepHours: "7.2", energyLevel: "7", stressLevel: "4", notes: "Illustrative measurements; verify before saving." } },
    { label: "Busy week", fields: { date: "2026-11-05", weight: "166", bodyFat: "25.2", muscleMass: "61.8", waterIntake: "1.7", sleepHours: "6.3", energyLevel: "5", stressLevel: "7", notes: "Illustrative check-in; discuss schedule and recovery." } },
    { label: "Recovery week", fields: { date: "2026-11-10", weight: "164", bodyFat: "24.8", muscleMass: "62.1", waterIntake: "2.1", sleepHours: "7.8", energyLevel: "8", stressLevel: "3", notes: "Illustrative check-in; confirm all measurements." } },
  ],
};

export default function AIFormPresets<T extends object>({ kind, value, onChange, prerequisite }: {
  kind: keyof typeof examples; value: T; onChange: (value: T) => void; prerequisite?: string;
}) {
  return <section aria-label="Example requests" className="mb-4 rounded border border-gray-600 p-3 text-sm text-gray-200">
    <p className="mb-2">Fill every editable field with an illustrative example. Review before generating or saving.</p>
    <div className="flex flex-wrap gap-2">{examples[kind].map(example => <button key={example.label} type="button" className="rounded border border-gray-500 px-3 py-1.5" onClick={() => onChange({ ...value, ...example.fields } as T)}>{example.label}</button>)}</div>
    {prerequisite && <p className="mt-2 text-amber-300">{prerequisite}</p>}
  </section>;
}
