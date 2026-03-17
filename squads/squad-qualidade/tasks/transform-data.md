---
task: Transform Data
responsavel: "@data-transformer"
responsavel_type: agent
atomic_layer: task
Entrada: |
  - source: Data source path or URL
  - format: Output format (json, csv, yaml)
Saida: |
  - data: Extracted data
  - status: Success or error message
Checklist:
  - "[ ] Validate input parameters"
  - "[ ] Connect to source"
  - "[ ] Extract data"
  - "[ ] Format output"
  - "[ ] Return result"
---

# *transform-data

Transforms data from the specified source.

## Usage

```
@data-transformer
*transform-data --source ./data/input.json --format json
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `--source` | string | Yes | Data source path or URL |
| `--format` | string | No | Output format (default: json) |

## Example

```javascript
// This is a placeholder - implement your logic here
async function execute(options) {
  const { source, format } = options;

  // TODO: Implement extraction logic
  console.log(`Extracting from ${source} as ${format}`);

  return { status: 'success', data: {} };
}
```
