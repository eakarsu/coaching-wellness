import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const workouts = db.prepare('SELECT * FROM workouts ORDER BY createdAt DESC').all();
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO workouts (id, clientId, clientName, name, description, category, difficulty, duration, caloriesBurned, exercises, imageUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.name, body.description || '', body.category || '', body.difficulty || 'beginner', body.duration || 30, body.caloriesBurned || 0, body.exercises || '', body.imageUrl || '');

    const newWorkout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(id);
    return NextResponse.json(newWorkout, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE workouts SET clientId = ?, clientName = ?, name = ?, description = ?, category = ?, difficulty = ?, duration = ?, caloriesBurned = ?, exercises = ?, imageUrl = ?
      WHERE id = ?
    `);

    stmt.run(body.clientId || '', body.clientName || '', body.name, body.description, body.category, body.difficulty, body.duration, body.caloriesBurned, body.exercises, body.imageUrl, body.id);

    const updated = db.prepare('SELECT * FROM workouts WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM workouts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workout error:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
}
