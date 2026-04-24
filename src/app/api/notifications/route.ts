import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    initializeDb();
    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC').all();
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    const id = uuidv4();
    db.prepare(`INSERT INTO notifications (id, userId, title, message, type, isRead, link, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'))`)
      .run(id, body.userId || '', body.title, body.message, body.type || 'info', body.link || '');
    const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    return NextResponse.json(notif, { status: 201 });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const body = await request.json();
    if (body.markAllRead) {
      db.prepare('UPDATE notifications SET isRead = 1').run();
      return NextResponse.json({ success: true });
    }
    db.prepare('UPDATE notifications SET isRead = ? WHERE id = ?').run(body.isRead ? 1 : 0, body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
