class CustomResponse extends Response {
  constructor(data, status, pagination) {
    super(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(pagination && { "X-Pagination": JSON.stringify(pagination) }),
      },
    });
    this.data = data;
    this.pagination = pagination;
  }
}

export function jsonResponse(data, status = 200, pagination = null) {
  return new CustomResponse(data, status, pagination);
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

export function successResponse(data, message = "Success", pagination = null) {
  return jsonResponse({ data, message }, 200, pagination);
}