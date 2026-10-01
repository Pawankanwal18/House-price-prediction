"""Shared input contract and stateless transformations for training/inference."""
import math

import numpy as np
import pandas as pd

FIELDS = [
    {"name": "neighborhood", "label": "Neighborhood", "type": "category", "group": "location"},
    {"name": "area", "label": "Living area", "type": "number", "min": 300, "max": 6000, "step": 1, "unit": "sq ft", "group": "space"},
    {"name": "lot_area", "label": "Lot area", "type": "number", "min": 1000, "max": 220000, "step": 1, "unit": "sq ft", "group": "space"},
    {"name": "bedrooms", "label": "Bedrooms", "type": "number", "min": 0, "max": 8, "step": 1, "group": "space"},
    {"name": "full_baths", "label": "Full bathrooms", "type": "number", "min": 0, "max": 4, "step": 1, "group": "space"},
    {"name": "half_baths", "label": "Half bathrooms", "type": "number", "min": 0, "max": 2, "step": 1, "group": "space"},
    {"name": "property_age", "label": "Property age", "type": "number", "min": 0, "max": 140, "step": 1, "unit": "years", "group": "property"},
    {"name": "house_style", "label": "House style", "type": "category", "group": "property"},
    {"name": "garage_cars", "label": "Garage capacity", "type": "number", "min": 0, "max": 5, "step": 1, "unit": "cars", "group": "property"},
    {"name": "central_air", "label": "Central air", "type": "category", "group": "property"},
]
CATEGORICAL = [f["name"] for f in FIELDS if f["type"] == "category"]
NUMERIC = ["area", "lot_area", "bedrooms", "bathrooms", "property_age", "garage_cars"]
COLUMN_MAP = {
    "neighborhood": "Neighborhood", "area": "Gr_Liv_Area", "lot_area": "Lot_Area",
    "bedrooms": "Bedroom_AbvGr", "full_baths": "Full_Bath", "half_baths": "Half_Bath",
    "house_style": "House_Style", "garage_cars": "Garage_Cars", "central_air": "Central_Air",
}
STYLE_LABELS = {
    "One_Story": "Single story", "Two_Story": "Two story",
    "One_and_Half_Fin": "1½ stories · finished", "One_and_Half_Unf": "1½ stories · unfinished",
    "Two_and_Half_Fin": "2½ stories · finished", "Two_and_Half_Unf": "2½ stories · unfinished",
    "SFoyer": "Split foyer", "SLvl": "Split level",
}

NEIGHBORHOOD_LABELS = {
    "Bloomington_Heights": "Bloomington Heights",
    "Blueste": "Bluestem",
    "Briardale": "Briardale",
    "Brookside": "Brookside",
    "Clear_Creek": "Clear Creek",
    "College_Creek": "College Creek",
    "Crawford": "Crawford",
    "Edwards": "Edwards",
    "Gilbert": "Gilbert",
    "Green_Hills": "Green Hills",
    "Greens": "The Greens",
    "Iowa_DOT_and_Rail_Road": "Downtown / Rail District",
    "Landmark": "Landmark / Grand Avenue",
    "Meadow_Village": "Meadow Village",
    "Mitchell": "Mitchell",
    "North_Ames": "North Ames",
    "Northpark_Villa": "Northpark Villas",
    "Northridge": "Northridge",
    "Northridge_Heights": "Northridge Heights",
    "Northwest_Ames": "Northwest Ames",
    "Old_Town": "Old Town",
    "Sawyer": "Sawyer",
    "Sawyer_West": "Sawyer West",
    "Somerset": "Somerset",
    "South_and_West_of_Iowa_State_University": "Campustown / South ISU",
    "Stone_Brook": "Stone Brook",
    "Timberland": "Timberland Heights",
    "Veenker": "Veenker / Golf Course",
}

DISCLAIMER = "Historical Ames, Iowa sales (2006–2010), in USD. An estimated model prediction, not a current market valuation or professional appraisal."


def category_label(value):
    if value in NEIGHBORHOOD_LABELS:
        return NEIGHBORHOOD_LABELS[value]
    return STYLE_LABELS.get(value, {"Y": "Yes", "N": "No"}.get(value, value.replace("_", " ")))


def engineer_features(frame):
    result = frame.copy()
    result["bathrooms"] = result["full_baths"] + 0.5 * result["half_baths"]
    return result.drop(columns=["full_baths", "half_baths"])


def prepare_features(raw):
    frame = pd.DataFrame({key: raw[column] for key, column in COLUMN_MAP.items()})
    frame["property_age"] = raw["Year_Sold"] - raw["Year_Built"]
    invalid = {}
    for field in FIELDS:
        name = field["name"]
        if field["type"] == "number":
            values = pd.to_numeric(frame[name], errors="coerce")
            bad = values.notna() & (~np.isfinite(values) | (values < field["min"]) | (values > field["max"]) | (values % field["step"] != 0))
            invalid[name] = int(bad.sum())
            frame[name] = values.mask(bad)
        else:
            frame[name] = frame[name].replace(r"^\s*$", np.nan, regex=True)
    return frame, invalid


def validate_payload(payload, metadata):
    errors = {}
    if not isinstance(payload, dict):
        return {}, {"form": "Please send a JSON object with the property details."}
    fields = metadata["fields"]
    allowed = {field["name"] for field in fields}
    if set(payload) - allowed:
        errors["form"] = "Remove unsupported property fields."
    clean = {}
    for field in fields:
        name, value = field["name"], payload.get(field["name"])
        if value is None or value == "":
            errors[name] = f"Please enter {field['label'].lower()}."
        elif field["type"] == "category":
            if not isinstance(value, str) or value not in [o["value"] for o in field["options"]]:
                errors[name] = "Please select a supported option."
            else:
                clean[name] = value
        elif isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            errors[name] = "Please enter a finite number."
        elif not field["min"] <= value <= field["max"] or value % field["step"] != 0:
            errors[name] = f"Enter a whole number from {field['min']:,} to {field['max']:,}."
        else:
            clean[name] = int(value)
    return clean, errors
