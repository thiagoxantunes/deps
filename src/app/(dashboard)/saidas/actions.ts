'use server'

import { revalidatePath } from 'next/cache'

export async function revalidarSaidas() {
  revalidatePath('/saidas')
  revalidatePath('/dashboard')
  revalidatePath('/contas')
}
