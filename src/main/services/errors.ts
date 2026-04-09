// Thrown by service layer for expected, user-facing errors (validation, business rule violations).
// Caught by IPC handlers to return errorCode: 'BUSINESS_ERROR' so the renderer
// can distinguish permanent failures from transient system errors.
export class BusinessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessError'
  }
}
