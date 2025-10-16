"use server";

import { supabase } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { Document } from "@/types/documents";

export async function createDoc(name: string, organization_id: number | null = null) {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error("User not authenticated or unable to retrieve user.");
  }

  const document = {
    name,
    content: null,
    owner_id: userData.user.id,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    organization_id: organization_id,
  };

  const { data, error } = await supabase
    .from("documents")
    .insert([document])
    .select()
    .single();

  if (error) throw error;

  console.log("Created doc:", data);
  return data;
}

// Fetch documents for the authenticated user where they are the owner or a member
export async function getDocs() {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error("User not authenticated or unable to retrieve user.");
  }

  // Fetch document IDs where the user is a member
  const { data: roleDocs, error: roleError } = await supabase
    .from("document_roles")
    .select("document_id")
    .eq("user_id", userData.user.id);

  if (roleError) throw roleError;

  const documentIds = roleDocs?.map((role) => role.document_id) || [];

  // Fetch documents where the user is the owner or a member
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .or(
      `owner_id.eq.${userData.user.id},id.in.(${documentIds.join(",")})`
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data;
}
