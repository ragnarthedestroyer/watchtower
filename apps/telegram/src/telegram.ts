type TelegramWebAppUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  colorScheme?: "light" | "dark";
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export type TelegramRuntime = {
  isTelegram: boolean;
  colorScheme: "light" | "dark" | "unknown";
  userLabel: string;
  initDataAvailable: boolean;
};

export function getTelegramRuntime(): TelegramRuntime {
  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    return {
      isTelegram: false,
      colorScheme: "unknown",
      userLabel: "Browser preview",
      initDataAvailable: false
    };
  }

  const user = webApp.initDataUnsafe?.user;
  const userLabel = user?.username
    ? `@${user.username}`
    : [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Telegram user";

  return {
    isTelegram: true,
    colorScheme: webApp.colorScheme || "unknown",
    userLabel,
    initDataAvailable: Boolean(webApp.initData)
  };
}

export function initializeTelegramApp(): TelegramRuntime {
  const webApp = window.Telegram?.WebApp;

  webApp?.ready?.();
  webApp?.expand?.();

  return getTelegramRuntime();
}
