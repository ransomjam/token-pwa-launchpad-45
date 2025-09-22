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
  | 'checkout_view'
  | 'qty_change'
  | 'pickup_open'
  | 'pickup_select'
  | 'payment_method_select'
  | 'checkout_create_order'
  | 'psp_redirect'
  | 'psp_return_success'
  | 'psp_return_fail'
  | 'psp_return_cancel'
  | 'tab_change'
  | 'filter_open'
  | 'filter_apply'
  | 'sort_change'
  | 'infinite_scroll_next'
  | 'order_view'
  | 'order_refresh_auto'
  | 'order_refresh_manual'
  | 'refund_eligible_view'
  | 'refund_request_click'
  | 'refund_success'
  | 'dispute_open_click'
  | 'pickup_qr_open'
  | 'evidence_open';

export function trackEvent<T extends AppEvent>(name: T, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[event] ${name}`, payload ?? {});
  }
}
