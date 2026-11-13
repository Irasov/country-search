export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message = `HTTP error ${status}`) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
