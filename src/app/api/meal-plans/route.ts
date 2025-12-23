import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const mealPlans = db.prepare('SELECT * FROM meal_plans ORDER BY createdAt DESC').all();
    return NextResponse.json(mealPlans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meal plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO meal_plans (id, clientId, clientName, name, description, category, calories, protein, carbs, fat, meals, duration, targetGoal, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.name, body.description || '', body.category || '', body.calories || 0, body.protein || 0, body.carbs || 0, body.fat || 0, body.meals || '', body.duration || '', body.targetGoal || '');

    const newPlan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Create meal plan error:', error);
    return NextResponse.json({ error: 'Failed to create meal plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE meal_plans SET clientId = ?, clientName = ?, name = ?, description = ?, category = ?, calories = ?, protein = ?, carbs = ?, fat = ?, meals = ?, duration = ?, targetGoal = ?
      WHERE id = ?
    `);

    stmt.run(body.clientId, body.clientName, body.name, body.description, body.category, body.calories, body.protein, body.carbs, body.fat, body.meals, body.duration, body.targetGoal, body.id);

    const updated = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update meal plan error:', error);
    return NextResponse.json({ error: 'Failed to update meal plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM meal_plans WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
  }
}
