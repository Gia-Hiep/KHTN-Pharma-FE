/**
 * Per-service base URLs — microservices port mapping.
 * Override via .env (VITE_*_API_URL).
 */
export const SERVICE_URLS = {
  auth:         import.meta.env.VITE_AUTH_API_URL         || 'http://localhost:8081',
  purchase:     import.meta.env.VITE_PURCHASE_API_URL     || 'http://localhost:8083',
  inventory:    import.meta.env.VITE_INVENTORY_API_URL    || 'http://localhost:8084',
  sales:        import.meta.env.VITE_SALES_API_URL        || 'http://localhost:8085',
  customer:     import.meta.env.VITE_CUSTOMER_API_URL     || 'http://localhost:8086',
  catalog:      import.meta.env.VITE_CATALOG_API_URL      || 'http://localhost:8087',
  chatbot:      import.meta.env.VITE_CHATBOT_API_URL      || 'http://localhost:8090',
  chat:         import.meta.env.VITE_CHAT_API_URL         || 'http://localhost:8089',
  report:       import.meta.env.VITE_REPORT_API_URL       || 'http://localhost:8091',
  notification: import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8092',
};
