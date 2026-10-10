import { AuthForm } from "@/components/auth/auth-form";
import { isDemoModeEnabled } from "@/lib/demo/config";

type LoginPageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { notice } = await searchParams;
  const demoAvailable = isDemoModeEnabled();
  return (
    <AuthForm
      mode="login"
      notice={Array.isArray(notice) ? notice[0] : notice}
      demoAvailable={demoAvailable}
    />
  );
}