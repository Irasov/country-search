export class HttpError extends Error {
    status;
    constructor(status, message = `HTTP error ${status}`) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}
