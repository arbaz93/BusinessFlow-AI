import { AuthForm } from "@/components/auth/auth-form";

type LoginPageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { notice } = await searchParams;
  return (
    <AuthForm
      mode="login"
      notice={Array.isArray(notice) ? notice[0] : notice}
    />
  );
}