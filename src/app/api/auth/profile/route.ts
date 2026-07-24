import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user profile from the database
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, username, full_name, avatar_url, bio, role, diocese_id, church_id, is_active, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      logger.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (profile && !profile.is_active) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    logger.error('Error in profile route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
