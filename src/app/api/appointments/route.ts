import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const appointments = db.prepare('SELECT * FROM appointments ORDER BY date DESC, time DESC').all();
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO appointments (id, clientId, clientName, coachName, appointmentType, date, time, duration, status, notes, location, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.clientId || '', body.clientName || '', body.coachName || '', body.appointmentType || '', body.date, body.time, body.duration || 60, body.status || 'scheduled', body.notes || '', body.location || '');

    const newAppointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE appointments SET clientId = ?, clientName = ?, coachName = ?, appointmentType = ?, date = ?, time = ?, duration = ?, status = ?, notes = ?, location = ?
      WHERE id = ?
    `);

    stmt.run(body.clientId, body.clientName, body.coachName, body.appointmentType, body.date, body.time, body.duration, body.status, body.notes, body.location, body.id);

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM appointments WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
