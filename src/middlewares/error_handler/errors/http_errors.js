const HTTP_ERROR = {
  // 4xx code responses
  BAD_REQUEST: {
    statusCode: 400,
    message: 'BAD REQUEST',
    errors: '',
  },
  NOT_FOUND: {
    statusCode: 404,
    message: 'NOT_FOUND',
    errors: '',
  },
  FORBIDDEN: {
    statusCode: 403,
    message: 'FORBIDDEN',
    errors: '',
  },
  UNPROCESSABLE_ENTITY: {
    statusCode: 422,
    message: 'UNPROCESSABLE ENTITY',
    errors: '',
  },
  // 5xx code responses
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    message: 'INTERNAL SERVER ERROR',
    errors: '',
  },
  s3_ERROR: {
    statusCode: 500,
    message: 'INTERNAL SERVER ERROR(s3)',
    errors: '',
  },
  BAD_GATEWAY: {
    statusCode: 502,
    message: 'BAD GATEWAY',
    errors: '',
  },
  SERVICE_UNAVAILABLE: {
    statusCode: 503,
    message: 'SERVICE UNAVAILABLE',
    errors: '',
  },
  GATEWAY_TIMEOUT: {
    statusCode: 504,
    message: 'GATEWAY TIMEOUT',
    errors: '',
  },
  UNAUTHORIZED: {
    statusCode: 401,
    message: 'UNAUTHORIZED',
    errors: '',
  },
  SUCCESS: {
    statusCode: 200,
    message: 'OK',
    errors: '',
  },
}

module.exports = HTTP_ERROR
