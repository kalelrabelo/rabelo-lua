from functools import wraps
from flask import request, jsonify
import jwt
from src.models.user import User

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'message': 'Token é necessário!'}), 401

        try:
            data = jwt.decode(token, 'antonio_rabelo_joalheria_2025_jwt_secret', algorithms=['HS256'])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token é inválido!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated
