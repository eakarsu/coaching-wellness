import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const users = db.prepare('SELECT id, username, email, firstName, lastName, role, phone, isActive, lastLogin, createdAt, updatedAt FROM users ORDER BY createdAt DESC').all();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();
    db.prepare(`INSERT INTO users (id, username, email, password, firstName, lastName, role, phone, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`)
      .run(id, body.username, body.email, body.password || 'changeme123', body.firstName, body.lastName, body.role || 'viewer', body.phone || '');
    const user = db.prepare('SELECT id, username, email, firstName, lastName, role, phone, isActive, createdAt FROM users WHERE id = ?').get(id);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    db.prepare('UPDATE users SET username = ?, email = ?, firstName = ?, lastName = ?, role = ?, phone = ?, isActive = ?, updatedAt = datetime("now") WHERE id = ?')
      .run(body.username, body.email, body.firstName, body.lastName, body.role, body.phone || '', body.isActive ? 1 : 0, body.id);
    const user = db.prepare('SELECT id, username, email, firstName, lastName, role, phone, isActive, createdAt FROM users WHERE id = ?').get(body.id);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM notifications WHERE userId = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
