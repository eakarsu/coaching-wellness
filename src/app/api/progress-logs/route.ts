import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const logs = db.prepare('SELECT * FROM progress_logs ORDER BY date DESC').all();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch progress logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO progress_logs (id, clientId, clientName, date, weight, bodyFat, muscleMass, waterIntake, sleepHours, energyLevel, stressLevel, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.date || new Date().toISOString().split('T')[0], body.weight || 0, body.bodyFat || 0, body.muscleMass || 0, body.waterIntake || 0, body.sleepHours || 0, body.energyLevel || 5, body.stressLevel || 5, body.notes || '');

    const newLog = db.prepare('SELECT * FROM progress_logs WHERE id = ?').get(id);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create progress log' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE progress_logs SET clientId = ?, clientName = ?, date = ?, weight = ?, bodyFat = ?, muscleMass = ?, waterIntake = ?, sleepHours = ?, energyLevel = ?, stressLevel = ?, notes = ?
      WHERE id = ?
    `);

    stmt.run(body.clientId, body.clientName, body.date, body.weight, body.bodyFat, body.muscleMass, body.waterIntake, body.sleepHours, body.energyLevel, body.stressLevel, body.notes, body.id);

    const updated = db.prepare('SELECT * FROM progress_logs WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update progress log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM progress_logs WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete progress log error:', error);
    return NextResponse.json({ error: 'Failed to delete progress log' }, { status: 500 });
  }
}
