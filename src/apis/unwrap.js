// File: src/apis/unwrap.js
/**
 * Unwrap Spring Boot API responses.
 * If response is { data: ..., message: ... }, return the nested data.
 * Otherwise return the raw response.
 */
export function unwrapResponse(data) {
  if (data && typeof data === 'object' && 'data' in data && !Array.isArray(data)) {
    return data.data;
  }
  return data;
}
