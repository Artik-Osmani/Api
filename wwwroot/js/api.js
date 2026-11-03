/**
 * The single fetch wrapper. Every request has a 10 second timeout, is cancellable, parses the one
 * ApiError envelope and never throws a bare network error.
 */

export class ApiError extends Error {
  constructor(status, code, message, fieldErrors = null, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors ?? {};
    this.details = details ?? null;
  }

  field(name) {
    return this.fieldErrors?.[name]?.[0] ?? "";
  }
}

export const NetworkMessage = "We could not reach the server. Check your connection and try again.";

export async function request(path, options = {}) {
  const { method = "GET", body, signal, timeout = 10_000 } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort("timeout"), timeout);
  const externalAbort = () => controller.abort("external");

  if (signal) {
    if (signal.aborted) {
      controller.abort("external");
    } else {
      signal.addEventListener("abort", externalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      credentials: "same-origin"
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.code ?? "HTTP_ERROR",
        data?.message ?? "The request could not be completed.",
        data?.fieldErrors ?? null,
        data?.details ?? null
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (controller.signal.aborted) {
      const timedOut = controller.signal.reason === "timeout";
      throw new ApiError(
        0,
        timedOut ? "REQUEST_TIMEOUT" : "REQUEST_ABORTED",
        timedOut ? "The request took too long. Try again." : "The request was cancelled."
      );
    }

    throw new ApiError(0, "NETWORK_ERROR", NetworkMessage);
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", externalAbort);
  }
}

const query = (params) => new URLSearchParams(params).toString();

export const api = {
  health: () => request("/v1/system/health"),
  stats: () => request("/v1/system/stats"),

  search: (payload, signal) => request("/v1/listings/search", { method: "POST", body: payload, signal }),
  listing: (id, signal) => request(`/v1/listings/${encodeURIComponent(id)}`, { signal }),
  availability: (id, start, end, signal) =>
    request(
      `/v1/listings/${encodeURIComponent(id)}/availability?${query({ start_date: start, end_date: end })}`,
      { signal }
    ),
  reviews: (id, page = 1, pageSize = 50, signal) =>
    request(`/v1/listings/${encodeURIComponent(id)}/reviews?${query({ page, pageSize })}`, { signal }),
  addReview: (id, payload) =>
    request(`/v1/listings/${encodeURIComponent(id)}/reviews`, { method: "POST", body: payload }),

  quote: (payload, signal) => request("/v1/reservations/quote", { method: "POST", body: payload, signal }),
  createReservation: (payload) => request("/v1/reservations", { method: "POST", body: payload }),
  reservations: () => request("/v1/reservations"),
  reservation: (id) => request(`/v1/reservations/${encodeURIComponent(id)}`),
  cancelReservation: (id, reason) =>
    request(`/v1/reservations/${encodeURIComponent(id)}/cancel?${query({ reason: reason ?? "" })}`, {
      method: "POST"
    }),
  updateStatus: (id, status) =>
    request(`/v1/reservations/${encodeURIComponent(id)}/status`, { method: "PATCH", body: { status } }),
  messages: (id) => request(`/v1/reservations/${encodeURIComponent(id)}/messages`),
  sendMessage: (id, body) =>
    request(`/v1/reservations/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      body: { senderRole: "guest", messageBody: body }
    }),

  favorites: () => request("/v1/favorites"),
  toggleFavorite: (id) => request(`/v1/favorites/${encodeURIComponent(id)}`, { method: "POST" }),

  hosts: () => request("/v1/hosts"),
  host: (id) => request(`/v1/hosts/${encodeURIComponent(id)}`),
  hostListings: (id) => request(`/v1/hosts/${encodeURIComponent(id)}/listings`),
  verification: (id) => request(`/v1/hosts/${encodeURIComponent(id)}/verification`),

  reset: () => request("/v1/system/reset", { method: "POST" })
};
