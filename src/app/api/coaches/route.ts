import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const coaches = db.prepare('SELECT * FROM coaches ORDER BY rating DESC').all();
    return NextResponse.json(coaches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coaches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO coaches (id, name, email, specialization, certifications, experience, bio, availability, rating, imageUrl, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, body.name, body.email, body.specialization || '', body.certifications || '', body.experience || 0, body.bio || '', body.availability || '', body.rating || 0, body.imageUrl || '');

    const newCoach = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id);
    return NextResponse.json(newCoach, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create coach' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();

    const stmt = db.prepare(`
      UPDATE coaches SET name = ?, email = ?, specialization = ?, certifications = ?, experience = ?, bio = ?, availability = ?, rating = ?, imageUrl = ?
      WHERE id = ?
    `);

    stmt.run(body.name, body.email, body.specialization, body.certifications, body.experience, body.bio, body.availability, body.rating, body.imageUrl, body.id);

    const updated = db.prepare('SELECT * FROM coaches WHERE id = ?').get(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update coach' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM coaches WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coach' }, { status: 500 });
  }
}
