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
      return NextResponse.json({ theme: null });
    }

    // Get user's diocese_id, church_id and role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('diocese_id, church_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ theme: null });
    }

    let dioceseId = profile.diocese_id;

    // If no direct diocese_id, resolve via church
    if (!dioceseId && profile.church_id) {
      const { data: church } = await supabase
        .from('churches')
        .select('diocese_id')
        .eq('id', profile.church_id)
        .maybeSingle();

      dioceseId = church?.diocese_id ?? null;
    }

    // If still no diocese, check if user is a diocese admin via junction table
    if (!dioceseId) {
      const { data: adminEntry } = await supabase
        .from('diocese_admins')
        .select('diocese_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      dioceseId = adminEntry?.diocese_id ?? null;
    }

    if (!dioceseId) {
      return NextResponse.json({ theme: null });
    }

    // Fetch diocese theme colors
    const { data: diocese, error: dioceseError } = await supabase
      .from('dioceses')
      .select('theme_enabled, theme_primary_color, theme_secondary_color, theme_accent_color')
      .eq('id', dioceseId)
      .maybeSingle();

    if (dioceseError || !diocese || !diocese.theme_enabled) {
      return NextResponse.json({ theme: null });
    }

    return NextResponse.json({
      theme: {
        primary: diocese.theme_primary_color,
        secondary: diocese.theme_secondary_color,
        accent: diocese.theme_accent_color,
      },
    });
  } catch (error) {
    logger.error('Error fetching diocese theme:', error);
    return NextResponse.json({ theme: null });
  }
}
