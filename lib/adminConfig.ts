import prisma from "@/lib/prisma";

export interface AdminConfig {
  telegramBotToken: string;
  telegramChatId: string;
  adminEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  companyEmail: string;
}

const ENV_DEFAULTS: Record<string, string> = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  adminEmail: process.env.ADMIN_EMAIL || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: process.env.SMTP_PORT || "587",
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  companyEmail: "contact@realduckdistro.com",
};

export async function getAdminConfig(): Promise<AdminConfig> {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: Object.keys(ENV_DEFAULTS),
        },
      },
    });

    const config: Record<string, string> = { ...ENV_DEFAULTS };
    for (const row of rows) {
      if (row.value.trim()) {
        config[row.key] = row.value;
      }
    }

    return config as unknown as AdminConfig;
  } catch {
    return ENV_DEFAULTS as unknown as AdminConfig;
  }
}
