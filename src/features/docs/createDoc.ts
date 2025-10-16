"use server";

import { supabase } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export async function createDoc(name: string) {
  const client = await createClient();
  const { data: userData, error: userError } = await client.auth.getUser();

  if (userError || !userData?.user) {
    throw new Error("User not authenticated or unable to retrieve user.");
  }

  const { data, error } = await supabase
    .from("docs")
    .insert([{ name, created_by: userData.user.id, updated_at: new Date() }])
    .select()
    .single();

  if (error) throw error;

  console.log("Created doc:", data);
  return data;
}
