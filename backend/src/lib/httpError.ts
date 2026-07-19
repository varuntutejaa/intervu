// Thrown from anywhere in the service layer to signal a specific HTTP
// outcome — asyncHandler forwards it to the global error handler, which
// knows to trust its status/message instead of collapsing to a generic 500.
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = "Not authenticated") => new HttpError(401, message);
export const forbidden = (message: string) => new HttpError(403, message);
export const notFound = (message: string) => new HttpError(404, message);
export const unprocessable = (message: string) => new HttpError(422, message);
export const badGateway = (message: string) => new HttpError(502, message);
