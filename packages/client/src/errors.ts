/** Thrown by the helper methods (`orbit.news.list()`, `orbit.auth.login()`, ...) on any non-2xx response. */
export class TeamOrbitError extends Error {
  readonly status: number;
  /** Parsed error body from the API, e.g. `{ statusCode, message, error }`. */
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(messageFrom(status, body));
    this.name = 'TeamOrbitError';
    this.status = status;
    this.body = body;
  }
}

function messageFrom(status: number, body: unknown): string {
  const message = (body as { message?: string | string[] } | undefined)?.message;
  if (Array.isArray(message)) return message.join('; ');
  return message ?? `Request failed with status ${status}`;
}

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    throw new TeamOrbitError(result.response.status, result.error);
  }
  return result.data as T;
}
