"use server";

import { supabase } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(name: string) {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData) {
    throw new Error("User not found or unable to retrieve user.");
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert([{ name, owner_id: userData.user?.id, created_at: new Date() }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function inviteToOrganization(organizationId: string, email: string) {
  const client = await createClient();

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError || !userData) {
    throw new Error("User not found or unable to retrieve user.");
  }

  const { data, error } = await supabase
    .from("user_organizations")
    .insert([{ organization_id: organizationId, user_id: userData.id, role: "member", created_at: new Date() }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getOrganizations() {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error("User not authenticated or unable to retrieve user.");
  }

  const { data, error } = await supabase
    .from("user_organizations")
    .select("organization_id, organizations(name, profile)")
    .eq("user_id", userData.user.id);

  if (error) throw error;

  return data.map((entry: any) => ({ id: entry.organization_id, name: entry.organizations.name, profile: entry.organizations.profile }) );
}
