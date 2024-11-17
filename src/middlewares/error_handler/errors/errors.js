const ERRORS = {
  EMAIL_ALREADY_TAKEN: {
    statusCode: 400,
    message: 'BAD REQUEST',
    errors: 'Email already exists.',
  },
  MISSING_REQ_DATA: {
    statusCode: 400,
    message: 'Req with complete Details',
    errors: 'Data is missing in req body',
  },
  AUTH_WEAK_PASSWORD: {
    statusCode: 400,
    message: 'BAD REQUEST',
    errors: 'Weak Password.',
  },
  ACCOUNT_NOT_FOUND: {
    statusCode: 404,
    message: 'Account Not Found',
    errors: 'Create an Account',
  },
  ACCOUNT_ALREADY_EXISTS: {
    statusCode: 400,
    message: 'Already exists',
    errors: 'Account already exists',
  },
  ACCOUNT_EXISTED_EARLIER: {
    statusCode: 400,
    message: 'This Account existed earlier but deleted',
    errors: '',
  },
  REQUESTED_ALREADY: {
    statusCode: 400,
    message: 'Request Already Sent to HM for this deleted Account',
    errors: '',
  },
  UNAUTHORIZED: {
    statusCode: 400,
    message: 'BAD REQUEST',
    errors: 'Unauthorized, token required.',
  },
  INVALID_PASSWORD: {
    statusCode: 400,
    message: 'BAD REQUEST',
    errors: 'incorrect password.',
  },
  TOKEN_EXPIRED: {
    statusCode: 403,
    message: 'BAD REQUEST',
    errors: 'Token Expired.',
  },
  INVALID_TOKEN: {
    statusCode: 403,
    message: 'BAD REQUEST',
    errors: 'Invalid Token.',
  },
  INVALID_USER_DETAILS: {
    statusCode: 403,
    message: 'BAD REQUEST',
    errors: 'Invalid user details',
  },
  // error should be provide at time of using it.
  VALIDATION_ERROR: {
    statusCode: 400,
    message: 'Unprocessable Entity',
    errors: '',
  },
  VEHICLE_ALREADY_EXISTS: {
    statusCode: 400,
    message: 'Already exists',
    errors: 'vehicle already exists',
  },
  FAILED_TO_INITIATE_TRANSACTION: {
    statusCode: 400,
    message: 'Failed to initiate transaction',
    errors: '',
  },
  HUB_NOT_ASSIGNED: {
    statusCode: 400,
    message: 'No hub assigned',
    errors: '',
  },
  INVALID_VALIDATION_TYPE: {
    statusCode: 500,
    message: 'INTERNAL SERVER ERROR',
    errors: 'invalid value to validation type argument in payload validation',
  },
}

module.exports = ERRORS
