import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export default async function POST(request: Request) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { email, password } = await request.json();

  try {
    const { token, user } = await authenticateUser(email, password);
    return NextResponse.json({ token, user });
  } catch (error) {
    return NextResponse.error();
  }
}