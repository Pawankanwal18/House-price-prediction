"""Flask application factory. Start with python -m backend.app."""
import hashlib
import json
import logging
import math
import os
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException

from backend.features import FIELDS, validate_payload

BASE = Path(__file__).resolve().parent


def create_app(model_dir=None):
    app = Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
    directory = Path(model_dir) if model_dir else BASE / "model"
    frontend = BASE.parent / "frontend" / "dist"
    state = {"pipeline": None, "metadata": None, "metrics": None}
    try:
        metadata = json.loads((directory / "metadata.json").read_text(encoding="utf-8"))
        metrics = json.loads((directory / "metrics.json").read_text(encoding="utf-8"))
        artifact = directory / "model_pipeline.joblib"
        if hashlib.sha256(artifact.read_bytes()).hexdigest() != metadata["artifact_sha256"]:
            raise ValueError("Model artifact checksum mismatch")
        if metadata["model_version"] != metrics["model_version"] or metadata["schema_version"] != 1:
            raise ValueError("Inconsistent model artifacts")
        if {f["name"] for f in metadata["fields"]} != {f["name"] for f in FIELDS}:
            raise ValueError("Incompatible model inputs")
        if not all(math.isfinite(metrics[key]) for key in ("mae", "mse", "rmse", "r2")):
            raise ValueError("Invalid evaluation metrics")
        pipeline = joblib.load(artifact)
        defaults = {f["name"]: f["default"] for f in metadata["fields"]}
        _, errors = validate_payload(defaults, metadata)
        if errors or not math.isfinite(float(pipeline.predict(pd.DataFrame([defaults]))[0])):
            raise ValueError("Invalid model metadata")
        state.update(pipeline=pipeline, metadata=metadata, metrics=metrics)
    except Exception:
        app.logger.exception("Model startup failed. Regenerate trusted local model artifacts.")
    app.extensions["housing"] = state

    @app.get("/api/health")
    @app.get("/health")
    def health():
        ready = state["pipeline"] is not None
        return jsonify(status="ok" if ready else "unavailable", model_loaded=ready), 200 if ready else 503

    @app.before_request
    def require_model():
        if request.path.removeprefix("/api") in {"/predict", "/metrics", "/metadata"} and state["pipeline"] is None:
            return jsonify(error="The prediction model is unavailable. Please try again later."), 503

    @app.get("/api/metadata")
    @app.get("/metadata")
    def metadata_endpoint():
        return jsonify(state["metadata"])

    @app.get("/api/metrics")
    @app.get("/metrics")
    def metrics_endpoint():
        return jsonify(state["metrics"])

    @app.post("/api/predict")
    @app.post("/predict")
    def predict():
        if not request.is_json:
            return jsonify(error="Please send property details as JSON."), 415
        data = request.get_json(silent=True)
        clean, errors = validate_payload(data, state["metadata"])
        if errors:
            return jsonify(error="Please check the highlighted property details.", fields=errors), 400
        try:
            value = float(state["pipeline"].predict(pd.DataFrame([clean]))[0])
            if not math.isfinite(value) or value <= 0:
                return jsonify(error="We cannot provide a reliable estimate for this combination. Please check the property details."), 422
            return jsonify(predicted_price=round(value, 2), currency="USD", features=clean,
                           model_version=state["metadata"]["model_version"], disclaimer=state["metadata"]["disclaimer"])
        except Exception:
            app.logger.exception("Prediction failed")
            return jsonify(error="We could not calculate an estimate. Please try again."), 500

    @app.get("/")
    def index():
        if not (frontend / "index.html").exists():
            return jsonify(message="Housely API is running. Start the Vite frontend on port 5173."), 200
        return send_from_directory(frontend, "index.html")

    @app.get("/<path:path>")
    def frontend_asset(path):
        return send_from_directory(frontend, path)

    @app.errorhandler(HTTPException)
    def http_error(error):
        messages = {404: "This resource was not found.", 405: "This request method is not supported.",
                    413: "The submitted request is too large."}
        return jsonify(error=messages.get(error.code, "We could not process this request.")), error.code

    @app.errorhandler(Exception)
    def unexpected(error):
        app.logger.exception("Unhandled request error")
        return jsonify(error="Something went wrong. Please try again."), 500

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Frame-Options"] = "DENY"
        if request.path.removeprefix("/api") in {"/predict", "/metrics", "/metadata", "/health"}:
            response.headers["Cache-Control"] = "no-store"
        return response

    return app


if __name__ == "__main__":
    from waitress import serve
    logging.basicConfig(level=logging.INFO)
    serve(create_app(), host="127.0.0.1", port=int(os.environ.get("PORT", "5000")))
