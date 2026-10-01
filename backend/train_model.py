"""Run from the repository root: python -m backend.train_model."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from backend.dataset import BASE, explore, load_dataset
from backend.features import CATEGORICAL, DISCLAIMER, FIELDS, NUMERIC, category_label, engineer_features, prepare_features


def save_json(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False), encoding="utf-8")


def train(dataset_path=None, output=None):
    output = Path(output) if output else BASE / "model"
    output.mkdir(parents=True, exist_ok=True)
    raw, provenance = load_dataset(dataset_path)
    all_features, _ = prepare_features(raw)
    report = explore(raw, all_features, BASE / "analysis")
    clean = raw.drop_duplicates().copy()
    valid_target = np.isfinite(clean["Sale_Price"]) & (clean["Sale_Price"] > 0)
    invalid_targets = int((~valid_target).sum())
    clean = clean.loc[valid_target]
    features, invalid = prepare_features(clean)
    target = clean["Sale_Price"]
    x_train, x_test, y_train, y_test = train_test_split(features, target, test_size=0.2, random_state=42)
    numeric = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())])
    categorical = Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                            ("encode", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False))])
    pipeline = Pipeline([
        ("engineer", FunctionTransformer(engineer_features)),
        ("preprocess", ColumnTransformer([("numeric", numeric, NUMERIC), ("category", categorical, CATEGORICAL)])),
        ("regression", LinearRegression()),
    ])
    pipeline.fit(x_train, y_train)
    predictions = pipeline.predict(x_test)
    model_version = "ames-linear-" + provenance["sha256"][:8]
    fields = []
    for specification in FIELDS:
        field = specification.copy()
        series = x_train[field["name"]]
        if field["type"] == "category":
            field["options"] = [{"value": v, "label": category_label(v)} for v in sorted(series.dropna().unique())]
            field["default"] = str(series.mode().iloc[0])
        else:
            field["default"] = int(round(series.median()))
        fields.append(field)
    metadata = {
        "schema_version": 1, "model_version": model_version, "currency": "USD", "fields": fields,
        "disclaimer": DISCLAIMER, "market": "Ames, Iowa", "years": [int(clean.Year_Sold.min()), int(clean.Year_Sold.max())],
        "training_median_price": float(y_train.median()),
        "training_price_min": float(y_train.min()), "training_price_max": float(y_train.max()),
    }
    labels = {f["name"]: f["label"] for f in FIELDS} | {"bathrooms": "Bathroom equivalents"}
    coefficient_labels = [labels[name] for name in NUMERIC]
    encoder = pipeline.named_steps["preprocess"].named_transformers_["category"].named_steps["encode"]
    baselines = {}
    for field, categories, drop in zip(CATEGORICAL, encoder.categories_, encoder.drop_idx_):
        baselines[labels[field]] = category_label(str(categories[drop]))
        coefficient_labels.extend(f"{labels[field]}: {category_label(str(value))}" for i, value in enumerate(categories) if i != drop)
    coefficients = [{"feature": label, "value": float(value), "kind": "numeric" if i < len(NUMERIC) else "category"}
                    for i, (label, value) in enumerate(zip(coefficient_labels, pipeline.named_steps["regression"].coef_))]
    metrics = {
        "model_version": model_version, "model": "Linear Regression", "mae": float(mean_absolute_error(y_test, predictions)),
        "mse": float(mean_squared_error(y_test, predictions)), "rmse": float(np.sqrt(mean_squared_error(y_test, predictions))),
        "r2": float(r2_score(y_test, predictions)), "rows": len(clean), "source_rows": len(raw),
        "train_rows": len(x_train), "test_rows": len(x_test), "random_state": 42,
        "trained_at": datetime.now(timezone.utc).isoformat(), "sklearn_version": sklearn.__version__,
        "provenance": provenance, "duplicates_removed": report["duplicates"], "invalid_targets_removed": invalid_targets,
        "invalid_predictors_imputed": invalid, "predictor_missing_counts": features.isna().sum().to_dict(),
        "points": [{"id": int(index), "actual": float(actual), "predicted": float(predicted)}
                   for index, actual, predicted in zip(y_test.index, y_test, predictions)],
        "coefficients": sorted(coefficients, key=lambda c: abs(c["value"]), reverse=True), "baselines": baselines,
        "coefficient_note": "Numeric coefficients are USD per training standard deviation; categories are differences from a reference category. Associations are not causal effects.",
    }
    joblib.dump(pipeline, output / "model_pipeline.joblib")
    metadata["artifact_sha256"] = hashlib.sha256((output / "model_pipeline.joblib").read_bytes()).hexdigest()
    save_json(output / "metadata.json", metadata)
    save_json(output / "metrics.json", metrics)
    x_test.to_json(output / "test_features.json", orient="records", indent=2)
    save_json(output / "split.json", {"train_indices": x_train.index.tolist(), "test_indices": x_test.index.tolist()})
    print(json.dumps({k: metrics[k] for k in ["rows", "train_rows", "test_rows", "mae", "mse", "rmse", "r2"]}, indent=2))
    return pipeline, metadata, metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the historical Ames price model.")
    parser.add_argument("--dataset", help="Optional local Ames CSV path")
    parser.add_argument("--output", help="Optional model artifact directory")
    args = parser.parse_args()
    train(args.dataset, args.output)
