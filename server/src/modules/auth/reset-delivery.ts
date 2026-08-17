import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export interface PasswordResetDelivery {
  send(input: { email: string; token: string }): Promise<void>;
}

export const passwordResetDelivery: PasswordResetDelivery = {
  async send({ email, token }) {
    const url = new URL(env.PASSWORD_RESET_URL);
    url.searchParams.set("token", token);
    if (env.NODE_ENV === "development") {
      logger.info({ email, resetUrl: url.toString() }, "Development password reset link");
      return;
    }
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      logger.warn({ email }, "Password reset requested but no production email adapter is configured");
      return;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email],
        subject: "Reset your SocialVerse password",
        html: `<p>Use the secure link below to reset your password. It expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes.</p><p><a href="${url.toString()}">Reset password</a></p>`,
      }),
    });
    if (!response.ok) {
      logger.error({ email, status: response.status }, "Password reset email delivery failed");
      throw new Error("Password reset email delivery failed");
    }
  },
};
