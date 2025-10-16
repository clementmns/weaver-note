"use server";

import { createClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase/client'

export async function getUserProfile() {
  const client = await createClient()
  const { data: userData, error: userError } = await client.auth.getUser()

  if (userError || !userData?.user) {
    throw new Error('User not authenticated or unable to retrieve user.')
  }

  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('first_name, last_name, profile, selected_organization_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) throw profileError

  if (!profileData) {
    return null;
  }

  return {
    displayName: `${profileData.first_name} ${profileData.last_name.toUpperCase()}`,
    profilePicture: profileData.profile,
    selectedOrganizationId: profileData.selected_organization_id,
  }
}
