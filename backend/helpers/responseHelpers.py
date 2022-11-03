from fastapi.responses import JSONResponse

def toJsonResponse(statusCode, body):
  return JSONResponse(status_code=statusCode, content=body)