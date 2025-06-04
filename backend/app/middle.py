from flask import request
import bleach
from functools import wraps

def sanitize_input(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.is_json:
            # Sanitize JSON data
            sanitized_json = {}
            for key, value in request.get_json().items():
                if isinstance(value, str):
                    sanitized_json[key] = bleach.clean(value)
                else:
                    sanitized_json[key] = value
            request._cached_json = (sanitized_json, request._cached_json[1])
        return f(*args, **kwargs)
    return decorated_function