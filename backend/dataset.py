"""Public dataset acquisition and reproducible exploration artifacts."""
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SOURCE = "https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/master/csv/modeldata/ames.csv"
BASE = Path(__file__).resolve().parent


def load_dataset(path=None):
    path = Path(path) if path else BASE / "dataset" / "ames.csv"
    if not path.exists():
        if path.name != "ames.csv" or path.parent != BASE / "dataset":
            raise FileNotFoundError(f"Dataset not found: {path}")
        path.parent.mkdir(parents=True, exist_ok=True)
        request = Request(SOURCE, headers={"User-Agent": "Housely-Educational-App/1.0"})
        with urlopen(request, timeout=60) as response:
            content = response.read(10_000_001)
        if len(content) > 10_000_000:
            raise ValueError("Dataset exceeds the expected size.")
        path.write_bytes(content)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    frame = pd.read_csv(path).drop(columns=["rownames"], errors="ignore")
    return frame, {"source": SOURCE, "sha256": digest, "local_file": path.name}


def explore(raw, features, output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    report = {
        "rows": len(raw), "columns": len(raw.columns), "features": raw.columns.tolist(),
        "dtypes": raw.dtypes.astype(str).to_dict(), "missing": raw.isna().sum().to_dict(),
        "duplicates": int(raw.duplicated().sum()),
        "statistics": json.loads(raw.describe(include="all").to_json()),
    }
    (output / "exploration.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    plt.style.use("seaborn-v0_8-whitegrid")
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.hist(raw["Sale_Price"].dropna(), bins=40, color="#6561e8", edgecolor="white")
    ax.set(xlabel="Historical sale price (USD)", ylabel="Properties", title="Ames sale price distribution")
    fig.tight_layout()
    fig.savefig(output / "price_distribution.png", dpi=140)
    plt.close(fig)
    numeric = features.select_dtypes(include=np.number)
    axes = numeric.hist(figsize=(12, 9), bins=25, color="#6561e8")
    axes.flat[0].figure.tight_layout()
    axes.flat[0].figure.savefig(output / "feature_distributions.png", dpi=140)
    plt.close(axes.flat[0].figure)
    correlation = numeric.assign(sale_price=raw["Sale_Price"]).corr()
    fig, ax = plt.subplots(figsize=(10, 8))
    image = ax.imshow(correlation, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(correlation)), correlation.columns, rotation=45, ha="right")
    ax.set_yticks(range(len(correlation)), correlation.columns)
    fig.colorbar(image, ax=ax)
    ax.set_title("Numerical correlations (not causal effects)")
    fig.tight_layout()
    fig.savefig(output / "correlation.png", dpi=140)
    plt.close(fig)
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.scatter(features["area"], raw["Sale_Price"], s=10, alpha=0.35, color="#6561e8")
    ax.set(xlabel="Above-ground living area (sq ft)", ylabel="Historical sale price (USD)", title="Living area and sale price")
    fig.tight_layout()
    fig.savefig(output / "area_vs_price.png", dpi=140)
    plt.close(fig)
    return report
