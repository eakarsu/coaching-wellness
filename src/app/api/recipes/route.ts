import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const recipes = db.prepare('SELECT * FROM recipes ORDER BY category, name').all();
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO recipes (id, clientId, clientName, name, description, category, calories, protein, carbs, fat, ingredients, instructions, prepTime, cookTime, servings, imageUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.name, body.description || '', body.category || '', body.calories || 0, body.protein || 0, body.carbs || 0, body.fat || 0, body.ingredients || '', body.instructions || '', body.prepTime || 0, body.cookTime || 0, body.servings || 1, body.imageUrl || '');

    const newRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE recipes SET clientId = ?, clientName = ?, name = ?, description = ?, category = ?, calories = ?, protein = ?, carbs = ?, fat = ?, ingredients = ?, instructions = ?, prepTime = ?, cookTime = ?, servings = ?, imageUrl = ?
      WHERE id = ?
    `);

    stmt.run(body.clientId || '', body.clientName || '', body.name, body.description, body.category, body.calories, body.protein, body.carbs, body.fat, body.ingredients, body.instructions, body.prepTime, body.cookTime, body.servings, body.imageUrl, body.id);

    const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
