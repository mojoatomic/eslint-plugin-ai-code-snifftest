# Rule Integration Plan (v2)

- no-redundant-calculations: uses domain annotations (parser) and config to skip domain constants
- no-generic-names: skip when names contain recognized domain terms (done)
- enforce-domain-terms: will prefer suggestions from active domains
- enforce-naming-conventions: no domain dependency (config-driven)

Follow-ups:
- Add ambiguity warnings for constants present in multiple domains unless annotated