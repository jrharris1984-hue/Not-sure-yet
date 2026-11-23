"""Advisory compatibility checks for ComfyUI API-format workflow graphs."""
from typing import Any, Dict, List, Optional, Tuple


def _schema_inputs(spec: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    inputs = spec.get("input", {}) if isinstance(spec, dict) else {}
    required = inputs.get("required", {}) if isinstance(inputs, dict) else {}
    optional = inputs.get("optional", {}) if isinstance(inputs, dict) else {}
    return (
        required if isinstance(required, dict) else {},
        optional if isinstance(optional, dict) else {},
    )


def _socket_type(spec: Any) -> Optional[str]:
    """Read a ComfyUI socket type; combo widgets are lists of values, not sockets."""
    if isinstance(spec, (list, tuple)) and spec:
        value = spec[0]
        if isinstance(value, str):
            return value
    return None


def _choice_values(spec: Any) -> Optional[List[Any]]:
    """Return live ComfyUI combo choices, distinct from typed socket specs."""
    if not isinstance(spec, (list, tuple)) or not spec:
        return None
    values = spec[0]
    if isinstance(values, list) and all(not isinstance(item, (dict, list, tuple)) for item in values):
        return values
    return None


def _issue(code: str, message: str, node_id: Optional[str] = None) -> Dict[str, str]:
    issue = {"severity": "error", "code": code, "message": message}
    if node_id is not None:
        issue["node_id"] = str(node_id)
    return issue


def validate_workflow_graph(
    workflow: Any, object_info: Any, max_issues: int = 200
) -> Dict[str, Any]:
    """Compare a serialized ComfyUI prompt graph with the connected node registry.

    The check intentionally does not claim runtime or output compatibility.
    It validates node classes, declared choices, required inputs, and known link types.
    """
    if not isinstance(workflow, dict) or not workflow:
        return {"compatible": False, "checked_nodes": 0,
                "issues": [_issue("invalid_graph", "Workflow must be a non-empty API-format node object.")]}
    if not isinstance(object_info, dict) or not object_info:
        return {"compatible": False, "checked_nodes": 0,
                "issues": [_issue("schema_unavailable", "ComfyUI returned no node schema.")]}

    issues: List[Dict[str, str]] = []
    nodes = {str(node_id): node for node_id, node in workflow.items()}
    schemas: Dict[str, Dict[str, Any]] = {}

    for node_id, node in nodes.items():
        if not isinstance(node, dict):
            issues.append(_issue("invalid_node", "Node entry must be an object.", node_id))
            continue
        class_type = node.get("class_type")
        if not isinstance(class_type, str) or not class_type:
            issues.append(_issue("missing_class_type", "Node is missing class_type.", node_id))
            continue
        schema = object_info.get(class_type)
        if not isinstance(schema, dict):
            issues.append(_issue("missing_node_type", f"ComfyUI does not expose node type '{class_type}'.", node_id))
            continue
        schemas[node_id] = schema
        inputs = node.get("inputs", {})
        if not isinstance(inputs, dict):
            issues.append(_issue("invalid_inputs", "Node inputs must be an object.", node_id))
            continue
        required, optional = _schema_inputs(schema)
        declared = set(required) | set(optional)
        for name in sorted(set(inputs) - declared):
            issues.append(_issue("unknown_input", f"Input '{name}' is not declared by node type '{class_type}'.", node_id))
        for name in sorted(set(required) - set(inputs)):
            issues.append(_issue("missing_required_input", f"Required input '{name}' is missing.", node_id))
        for name, value in inputs.items():
            choices = _choice_values(required.get(name, optional.get(name)))
            if choices is not None and value not in choices:
                allowed = ", ".join(str(item) for item in choices[:4])
                remaining = len(choices) - 4
                if remaining > 0:
                    allowed += f", and {remaining} more"
                issues.append(_issue(
                    "unsupported_option",
                    f"Saved value '{value}' for '{name}' is not available in ComfyUI" +
                    (f" (available examples: {allowed})." if allowed else "."),
                    node_id,
                ))

    for node_id, node in nodes.items():
        if not isinstance(node, dict) or node_id not in schemas:
            continue
        inputs = node.get("inputs", {})
        if not isinstance(inputs, dict):
            continue
        required, optional = _schema_inputs(schemas[node_id])
        for input_name, value in inputs.items():
            if not (isinstance(value, (list, tuple)) and len(value) == 2):
                continue
            source_id, output_index = str(value[0]), value[1]
            source = nodes.get(source_id)
            if source is None:
                issues.append(_issue("missing_link_source", f"Input '{input_name}' links to missing node '{source_id}'.", node_id))
                continue
            try:
                index = int(output_index)
            except (TypeError, ValueError):
                issues.append(_issue("invalid_link_index", f"Input '{input_name}' has an invalid output index.", node_id))
                continue
            if index < 0:
                issues.append(_issue("invalid_link_index", f"Input '{input_name}' has an invalid output index.", node_id))
                continue
            source_schema = schemas.get(source_id)
            if not source_schema:
                continue
            outputs = source_schema.get("output", [])
            if isinstance(outputs, list) and index >= len(outputs):
                issues.append(_issue("missing_link_output", f"Input '{input_name}' links to output {index}, but node '{source_id}' exposes {len(outputs)} output(s).", node_id))
                continue
            target_spec = required.get(input_name, optional.get(input_name))
            target_type = _socket_type(target_spec)
            source_type = outputs[index] if isinstance(outputs, list) and index < len(outputs) else None
            if (target_type and isinstance(source_type, str)
                    and target_type not in {"*", "ANY"}
                    and source_type not in {"*", "ANY"}
                    and target_type != source_type):
                issues.append(_issue("link_type_mismatch", f"Input '{input_name}' expects {target_type}, but node '{source_id}' outputs {source_type}.", node_id))

    issues = issues[:max(1, int(max_issues))]
    errors = sum(item["severity"] == "error" for item in issues)
    return {"compatible": errors == 0, "checked_nodes": len(nodes), "issues": issues}
