import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const { action } = body;

    if (action === 'login') {
      const { email, password } = body;
      const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      db.prepare('UPDATE users SET lastLogin = datetime("now") WHERE id = ?').run((user as Record<string, unknown>).id);
      return NextResponse.json({ ...user as Record<string, unknown>, password: undefined });
    }

    if (action === 'register') {
      const { username, email, password, firstName, lastName, role } = body;
      const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
      if (existing) {
        return NextResponse.json({ error: 'User already exists with this email or username' }, { status: 409 });
      }
      const id = uuidv4();
      db.prepare(`INSERT INTO users (id, username, email, password, firstName, lastName, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`).run(id, username, email, password, firstName || '', lastName || '', role || 'viewer');
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return NextResponse.json({ ...user as Record<string, unknown>, password: undefined }, { status: 201 });
    }

    if (action === 'reset-password') {
      const { email, newPassword } = body;
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (!user) {
        return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
      }
      db.prepare('UPDATE users SET password = ?, updatedAt = datetime("now") WHERE email = ?').run(newPassword, email);
      return NextResponse.json({ message: 'Password reset successfully' });
    }

    if (action === 'update-profile') {
      const { id, firstName, lastName, phone, avatar, email } = body;
      db.prepare('UPDATE users SET firstName = ?, lastName = ?, phone = ?, avatar = ?, email = ?, updatedAt = datetime("now") WHERE id = ?')
        .run(firstName, lastName, phone || '', avatar || '', email, id);
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return NextResponse.json({ ...user as Record<string, unknown>, password: undefined });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
