"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientConfig } from "@/lib/client-config";

async function requireAdmin() {
  if (!clientConfig.requireAdminAuth) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Not authenticated");
  }
}

export interface SubscriberInput {
  name: string;
  phone: string;
  email: string | null;
  batchNumber: number | null;
}

export async function createSubscriber(input: SubscriberInput) {
  await requireAdmin();

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  await prisma.subscriber.create({
    data: { name, phone, email, batchNumber: input.batchNumber },
  });

  revalidatePath("/admin/subscribers");

  return { success: true };
}

export async function updateSubscriber(id: string, input: SubscriberInput) {
  await requireAdmin();

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  await prisma.subscriber.update({
    where: { id },
    data: { name, phone, email, batchNumber: input.batchNumber },
  });

  revalidatePath("/admin/subscribers");

  return { success: true };
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();

  await prisma.subscriber.delete({ where: { id } });

  revalidatePath("/admin/subscribers");

  return { success: true };
}
