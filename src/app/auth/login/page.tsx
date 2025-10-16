import AuthForm from "@/features/auth/auth-form";

export default async function LoginPage({searchParams}: {searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) {
  const { error } = await searchParams;

  return <AuthForm error={error} />;
}
