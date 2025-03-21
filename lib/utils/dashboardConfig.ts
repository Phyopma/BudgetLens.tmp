const DASHBOARD_CONFIG_KEY = "dashboard_config";
const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};

export interface DashboardConfig {
  layout: string[];
  activeComponents: string[];
}

export function saveDashboardConfig(config: DashboardConfig): void {
  // Since cookies() from next/headers can only be used in Server Components,
  // we need to modify our approach for client components
  document.cookie = `${DASHBOARD_CONFIG_KEY}=${JSON.stringify(
    config
  )}; max-age=${COOKIE_OPTIONS.maxAge}; path=${COOKIE_OPTIONS.path}; samesite=${
    COOKIE_OPTIONS.sameSite
  }; ${COOKIE_OPTIONS.secure ? "secure" : ""}`;
}

export function loadDashboardConfig(): DashboardConfig | null {
  // Read from document.cookie in client components
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const configStr = cookies[DASHBOARD_CONFIG_KEY];

  if (!configStr) {
    // Import initial layout and components from constants
    const {
      INITIAL_LAYOUT,
      AVAILABLE_COMPONENT_TYPES,
    } = require("./constants");
    return {
      layout: INITIAL_LAYOUT,
      activeComponents: INITIAL_LAYOUT.filter(
        (component: any) => component.type !== "csv upload"
      ),
    };
  }

  try {
    return JSON.parse(decodeURIComponent(configStr));
  } catch {
    return null;
  }
}
