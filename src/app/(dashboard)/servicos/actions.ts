'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revalidarServicos() {
  revalidatePath('/dashboard')
  revalidatePath('/servicos')
}
