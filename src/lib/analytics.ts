export type AppEvent =
  | 'auth_start'
  | 'auth_code_sent'
  | 'auth_success'
  | 'auth_fail'
  | 'role_select'
  | 'role_switch'
  | 'lang_change';

export function trackEvent<T extends AppEvent>(name: T, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[event] ${name}`, payload ?? {});
  }
}
