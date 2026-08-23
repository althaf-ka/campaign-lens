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

export class SelfHealingUnavailableError extends BrightDataError {
  readonly retryable: boolean = true;

  constructor(message = "Self healing tool is temporarily disabled", options?: BrightDataErrorOptions) {
    super(message, { statusCode: 503, ...options });
    this.name = "SelfHealingUnavailableError";
  }
}

export class SelfHealingFailedError extends BrightDataError {
  readonly status?: string;

  constructor(message: string, status?: string, options?: BrightDataErrorOptions) {
    super(message, options);
    this.name = "SelfHealingFailedError";
    this.status = status;
  }
}
