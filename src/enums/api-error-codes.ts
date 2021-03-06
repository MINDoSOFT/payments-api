export const ERROR_UNAUTHORIZED_CODE = 'ERR_UNAUTHORIZED';
export const ERROR_UNAUTHORIZED_MESSAGE = 'No auth token provided';
export const ERROR_AUTH_TOKEN_EXPIRED_CODE = 'ERR_AUTH_TOKEN_EXPIRED';
export const ERROR_AUTH_TOKEN_EXPIRED_MESSAGE = 'Auth token expired';
export const ERROR_VALIDATION_CODE = 'ERR_VALIDATION';
export const ERROR_VALIDATION_MESSAGE = 'Validation failed';
export const ERROR_CANNOT_APPROVE_CODE = 'ERR_CANNOT_APPROVE';
export const ERROR_CANNOT_APPROVE_MESSAGE =
  'Cannot approve a payment that has already been cancelled';
export const ERROR_CANNOT_CANCEL_CODE = 'ERR_CANNOT_CANCEL';
export const ERROR_CANNOT_CANCEL_MESSAGE =
  'Cannot cancel a payment that has already been approved';
export const ERROR_ALREADY_APPROVED_CODE = 'ERR_ALREADY_APPROVED';
export const ERROR_ALREADY_APPROVED_MESSAGE =
  'This payment was already approved';
export const ERROR_ALREADY_CANCELLED_CODE = 'ERR_ALREADY_CANCELLED';
export const ERROR_ALREADY_CANCELLED_MESSAGE =
  'This payment was already cancelled';
export const ERROR_NOT_FOUND_CODE = 'ERR_NOT_FOUND';
export const ERROR_NOT_FOUND_MESSAGE = 'The resource you have requested cannot be found';