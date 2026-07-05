"""
Day 2 - Field Type Library.

FIELD_TYPES is the single source of truth for which field types the platform
supports and what configurable properties each one exposes. The frontend's
Field Type Palette + config forms are driven entirely by GET /field-types,
which serializes this dict.
"""

FIELD_TYPES = {
    "text": {
        "label": "Text",
        "icon": "type",
        "properties": [
            {"name": "min_length", "type": "number", "label": "Minimum Length"},
            {"name": "max_length", "type": "number", "label": "Maximum Length"},
            {"name": "placeholder", "type": "text", "label": "Placeholder"},
        ],
    },
    "number": {
        "label": "Number",
        "icon": "hash",
        "properties": [
            {"name": "min", "type": "number", "label": "Minimum"},
            {"name": "max", "type": "number", "label": "Maximum"},
            {"name": "decimal", "type": "boolean", "label": "Allow Decimal"},
        ],
    },
    "email": {
        "label": "Email",
        "icon": "mail",
        "properties": [
            {"name": "placeholder", "type": "text", "label": "Placeholder"},
        ],
    },
    "dropdown": {
        "label": "Dropdown",
        "icon": "chevron-down",
        "properties": [
            {"name": "options", "type": "list", "label": "Options"},
        ],
    },
    "multi_checkbox": {
        "label": "Multi-Select Checkbox",
        "icon": "check-square",
        "properties": [
            {"name": "options", "type": "list", "label": "Options"},
            {"name": "min_select", "type": "number", "label": "Minimum Selections"},
            {"name": "max_select", "type": "number", "label": "Maximum Selections"},
        ],
    },
    "date": {
        "label": "Date",
        "icon": "calendar",
        "properties": [
            {"name": "min_date", "type": "date", "label": "Earliest Date"},
            {"name": "max_date", "type": "date", "label": "Latest Date"},
        ],
    },
    "file": {
        "label": "File Upload",
        "icon": "upload",
        "properties": [
            {"name": "allowed_types", "type": "list", "label": "Allowed Extensions"},
            {"name": "max_size_mb", "type": "number", "label": "Max Size (MB)"},
        ],
    },
    "rating": {
        "label": "Rating",
        "icon": "star",
        "properties": [
            {"name": "scale", "type": "number", "label": "Scale (e.g. 5)"},
        ],
    },
}

OPTION_TYPES = {"dropdown", "multi_checkbox"}


def list_field_types():
    return [{"type": key, **value} for key, value in FIELD_TYPES.items()]


def validate_field_config(field_type: str, config: dict) -> dict:
    """Lightweight validation/cleanup of a field's config against its type rules.
    Raises ValueError with a human-readable message on failure.
    """
    if field_type not in FIELD_TYPES:
        raise ValueError(f"Unsupported field type '{field_type}'")

    allowed_keys = {p["name"] for p in FIELD_TYPES[field_type]["properties"]}
    config = config or {}
    unknown = set(config.keys()) - allowed_keys
    if unknown:
        raise ValueError(f"Unknown config properties for '{field_type}': {sorted(unknown)}")

    if field_type == "text":
        if config.get("min_length") is not None and config.get("max_length") is not None:
            if config["min_length"] > config["max_length"]:
                raise ValueError("min_length cannot exceed max_length")

    if field_type == "number":
        if config.get("min") is not None and config.get("max") is not None:
            if config["min"] > config["max"]:
                raise ValueError("min cannot exceed max")

    if field_type in OPTION_TYPES:
        options = config.get("options", [])
        if not isinstance(options, list):
            raise ValueError("options must be a list")
        if field_type == "multi_checkbox":
            min_s, max_s = config.get("min_select"), config.get("max_select")
            if min_s is not None and max_s is not None and min_s > max_s:
                raise ValueError("min_select cannot exceed max_select")

    if field_type == "date":
        min_d, max_d = config.get("min_date"), config.get("max_date")
        if min_d and max_d and min_d > max_d:
            raise ValueError("min_date cannot be after max_date")

    if field_type == "rating":
        if config.get("scale") is not None and config["scale"] < 1:
            raise ValueError("scale must be at least 1")

    return config


def extract_options(config: dict):
    """Return a normalized list of {label, value} dicts for option-bearing fields."""
    raw = (config or {}).get("options", [])
    normalized = []
    for item in raw:
        if isinstance(item, dict):
            normalized.append({
                "label": item.get("label", item.get("value", "")),
                "value": item.get("value", item.get("label", "")),
            })
        else:
            normalized.append({"label": str(item), "value": str(item)})
    return normalized
