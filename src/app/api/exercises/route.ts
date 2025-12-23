import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const exercises = db.prepare('SELECT * FROM exercises ORDER BY muscleGroup, name').all();
    return NextResponse.json(exercises);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO exercises (id, clientId, clientName, name, description, muscleGroup, equipment, instructions, sets, reps, restTime, videoUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.name, body.description || '', body.muscleGroup || '', body.equipment || '', body.instructions || '', body.sets || 3, body.reps || 10, body.restTime || 60, body.videoUrl || '');

    const newExercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
    return NextResponse.json(newExercise, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE exercises SET clientId = ?, clientName = ?, name = ?, description = ?, muscleGroup = ?, equipment = ?, instructions = ?, sets = ?, reps = ?, restTime = ?, videoUrl = ?
      WHERE id = ?
    `);

    stmt.run(body.clientId || '', body.clientName || '', body.name, body.description, body.muscleGroup, body.equipment, body.instructions, body.sets, body.reps, body.restTime, body.videoUrl, body.id);

    const updated = db.prepare('SELECT * FROM exercises WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exercise error:', error);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
