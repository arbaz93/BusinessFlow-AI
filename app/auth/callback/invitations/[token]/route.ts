import { completeAuthCallback } from "@/lib/auth/callback-handler";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return completeAuthCallback(request, token);
}
