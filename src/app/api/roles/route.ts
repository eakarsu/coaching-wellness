import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const roles = db.prepare('SELECT * FROM roles ORDER BY createdAt ASC').all();
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();
    db.prepare(`INSERT INTO roles (id, name, description, permissions, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`)
      .run(id, body.name, body.description, body.permissions, body.isDefault ? 1 : 0);
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    db.prepare('UPDATE roles SET name = ?, description = ?, permissions = ?, isDefault = ? WHERE id = ?')
      .run(body.name, body.description, body.permissions, body.isDefault ? 1 : 0, body.id);
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(body.id);
    return NextResponse.json(role);
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
