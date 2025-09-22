export type AppEvent =
  | 'auth_start'
  | 'auth_code_sent'
  | 'auth_success'
  | 'auth_fail'
  | 'role_select'
  | 'role_switch'
  | 'lang_change'
  | 'feed_section_view'
  | 'listing_card_view'
  | 'listing_card_click'
  | 'listing_view'
  | 'share_click'
  | 'cta_preorder_click'
  | 'pickup_select_open'
  | 'pickup_select_confirm'
  | 'tab_change'
  | 'filter_open'
  | 'filter_apply'
  | 'sort_change'
  | 'infinite_scroll_next';

export function trackEvent<T extends AppEvent>(name: T, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[event] ${name}`, payload ?? {});
  }
}
