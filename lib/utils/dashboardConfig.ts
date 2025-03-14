'use client';

import { getCookie, setCookie } from 'cookies-next';

const DASHBOARD_CONFIG_KEY = 'dashboard_config';
const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production'
};

export interface DashboardConfig {
  layout: string[];
  activeComponents: string[];
}

export function saveDashboardConfig(config: DashboardConfig): void {
  setCookie(DASHBOARD_CONFIG_KEY, JSON.stringify(config), COOKIE_OPTIONS);
}

export function loadDashboardConfig(): DashboardConfig | null {
  const configStr = getCookie(DASHBOARD_CONFIG_KEY);
  if (!configStr) {
    // Import initial layout and components from constants
    const { INITIAL_LAYOUT, AVAILABLE_COMPONENT_TYPES } = require('./constants');
    return {
      layout: INITIAL_LAYOUT,
      activeComponents: INITIAL_LAYOUT.filter((component) => component.type !== 'csv upload')
    };
  }
  
  try {
    return JSON.parse(configStr as string);
  } catch {
    return null;
  }
}