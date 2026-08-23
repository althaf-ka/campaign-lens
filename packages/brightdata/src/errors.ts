export interface BrightDataErrorOptions {
  statusCode?: number;
  details?: unknown;
  cause?: unknown;
}

export class BrightDataError extends Error {
  readonly statusCode?: number;
  readonly details?: unknown;

  constructor(message: string, options?: BrightDataErrorOptions) {
    super(message);
    this.name = "BrightDataError";
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}
