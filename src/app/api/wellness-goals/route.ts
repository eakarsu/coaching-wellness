import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const goals = db.prepare('SELECT * FROM wellness_goals ORDER BY createdAt DESC').all();
    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wellness goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO wellness_goals (id, clientId, clientName, goalType, title, description, targetValue, currentValue, unit, startDate, targetDate, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.goalType || '', body.title, body.description || '', body.targetValue || 0, body.currentValue || 0, body.unit || '', body.startDate || new Date().toISOString().split('T')[0], body.targetDate || '', body.status || 'in_progress', body.notes || '');

    const newGoal = db.prepare('SELECT * FROM wellness_goals WHERE id = ?').get(id);
    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create wellness goal' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE wellness_goals SET clientId = ?, clientName = ?, goalType = ?, title = ?, description = ?, targetValue = ?, currentValue = ?, unit = ?, startDate = ?, targetDate = ?, status = ?, notes = ?, updatedAt = datetime('now')
      WHERE id = ?
    `);

    stmt.run(body.clientId, body.clientName, body.goalType, body.title, body.description, body.targetValue, body.currentValue, body.unit, body.startDate, body.targetDate, body.status, body.notes, body.id);

    const updated = db.prepare('SELECT * FROM wellness_goals WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update wellness goal' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM wellness_goals WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wellness goal error:', error);
    return NextResponse.json({ error: 'Failed to delete wellness goal' }, { status: 500 });
  }
}
