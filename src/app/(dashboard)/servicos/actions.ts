'use server'

import { revalidatePath } from 'next/cache'

export async function revalidarServicos() {
  revalidatePath('/dashboard')
  revalidatePath('/servicos')
}
