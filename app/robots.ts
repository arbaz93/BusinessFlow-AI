import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://businessflow.ai";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/features",
        "/how-it-works",
        "/solutions",
        "/security",
        "/privacy",
        "/terms",
        "/login",
        "/signup",
      ],
      disallow: [
        "/dashboard",
        "/leads",
        "/clients",
        "/projects",
        "/tasks",
        "/assistant",
        "/settings",
        "/onboarding",
        "/no-workspace",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}