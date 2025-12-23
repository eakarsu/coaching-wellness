import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const clients = db.prepare('SELECT * FROM clients ORDER BY createdAt DESC').all();
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO clients (id, name, email, phone, age, gender, goals, healthConditions, startDate, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      id,
      body.name,
      body.email,
      body.phone || '',
      body.age || 0,
      body.gender || '',
      body.goals || '',
      body.healthConditions || '',
      body.startDate || new Date().toISOString().split('T')[0],
      body.status || 'active',
      body.notes || ''
    );

    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE clients SET
        name = ?, email = ?, phone = ?, age = ?, gender = ?,
        goals = ?, healthConditions = ?, status = ?, notes = ?, updatedAt = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      body.name,
      body.email,
      body.phone,
      body.age,
      body.gender,
      body.goals,
      body.healthConditions,
      body.status,
      body.notes,
      body.id
    );

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Delete related records first to avoid foreign key constraint issues
    db.prepare('DELETE FROM wellness_goals WHERE clientId = ?').run(id);
    db.prepare('DELETE FROM appointments WHERE clientId = ?').run(id);
    db.prepare('DELETE FROM progress_logs WHERE clientId = ?').run(id);

    // Now delete the client
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
