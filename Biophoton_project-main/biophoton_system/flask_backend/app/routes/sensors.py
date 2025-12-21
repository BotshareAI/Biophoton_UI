from flask import Blueprint, jsonify
bp = Blueprint('sensors', __name__)
@bp.route('/sensor')
def get_sensor():
    return jsonify({"temperature": 36.5, "signal": 0.8})
