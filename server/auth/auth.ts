import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const appURL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const socialProviders =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
  },

  ...(socialProviders ? { socialProviders } : {}),

  secret:
    process.env.AUTH_SECRET || "development-only-change-this-secret",

  baseURL: appURL,

  trustedOrigins: [appURL],
});
