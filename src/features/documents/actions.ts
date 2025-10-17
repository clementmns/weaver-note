"use server";

import { supabase } from "@/lib/supabase/client";

export async function createDoc(name: string) {
  const document = {
    name,
    content: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("documents")
    .insert([document])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getDocs() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function getDoc(docUrl: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("url", docUrl)
    .single();

  if (error) throw error;

  return data;
}
