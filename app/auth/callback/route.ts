import { completeAuthCallback } from "@/lib/auth/callback-handler";

export async function GET(request: Request) {
  return completeAuthCallback(request);
}