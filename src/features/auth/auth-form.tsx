import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './actions'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthForm({error}: {error?: string | string[] | null }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/app'); // Redirect to the app if the user is logged in
  }

  return (
    <form className="mx-auto mt-16 flex w-full max-w-sm flex-col gap-4 rounded-lg border border-gray-200 bg-white p-8 shadow">
      <Label htmlFor="email">Email:</Label>
      <Input id="email" name="email" type="email" placeholder="example@test.com" required />
      <Label htmlFor="password">Password:</Label>
      <Input id="password" name="password" type="password" placeholder="••••••••" required />
      {error && <p className="text-red-500 text-center">{error}</p>}
      <Button formAction={login} className="mt-4 w-full">
      Log in
      </Button>
    </form>
  )
}
