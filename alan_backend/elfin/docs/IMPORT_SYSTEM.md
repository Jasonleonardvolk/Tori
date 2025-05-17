# ELFIN Import System

## Overview

The ELFIN Import System (code-named "Acyclic Import Kiwi") provides a simple, direct way to reuse code across ELFIN files. This feature enables modular code organization through a straightforward `import ... from "..."` mechanism.

## Features

- **Simple Syntax**: Clear, straightforward import syntax
- **Direct Text Substitution**: Imports are resolved through a direct text substitution process
- **Standard Library**: Common helper functions available in `std/helpers.elfin`
- **CI Integration**: Built-in verification for imports in CI pipelines

## Import Syntax

```
import SectionName from "path/to/file.elfin";
```

Where:
- `SectionName` is the name of a section (like `StdHelpers`) in the imported file
- `path/to/file.elfin` is the path to the ELFIN file containing the section

## How It Works

The import processor:

1. Finds all `import ... from "..."` statements in the ELFIN file
2. Resolves the file path and reads the imported file
3. Extracts the specified section from the imported file
4. Replaces the import statement with the content of the section
5. Produces a processed file with all imports resolved

## Limitations

- **No Recursion**: Import chains are not supported (imports within imported files)
- **No Templates**: Parameterized imports are not supported
- **Section Types**: Currently only supports importing `helpers` sections

## Example Usage

### Standard Helpers

```
// In your ELFIN file
import StdHelpers from "std/helpers.elfin";

// Use imported functions
system ExampleSystem {
  // ...
  flow_dynamics {
    // Use imported hMin function
    safe_speed = hMin(desired_speed, max_speed);
    // Use imported wrapAngle function
    heading = wrapAngle(raw_heading);
  }
}
```

### Custom Helpers

```
// In custom_helpers.elfin
helpers MyMathHelpers {
  square(x) = x * x;
  cube(x) = x * x * x;
  pythagorean(a, b) = sqrt(square(a) + square(b));
}

// In your ELFIN file
import MyMathHelpers from "path/to/custom_helpers.elfin";

// Use the imported functions
system ExampleSystem {
  // ...
  flow_dynamics {
    distance = pythagorean(x, y);
  }
}
```

## Standard Library

The standard library is located in `alan_backend/elfin/templates/std/` and includes:

### std/helpers.elfin

```
helpers StdHelpers {
  // Absolute value function
  hAbs(x) = if x >= 0 then x else -x;
  
  // Minimum of two values
  hMin(a, b) = if a <= b then a else b;
  
  // Maximum of two values
  hMax(a, b) = if a >= b then a else b;
  
  // Angle wrapping function to normalize angles to [-π, π]
  wrapAngle(theta) = mod(theta + pi, 2*pi) - pi;
}
```

## Path Resolution

The import system resolves paths in the following order:

1. Relative to the importing file
2. Relative to the templates directory
3. Direct path within the templates directory

## CI Integration

To verify imports in CI pipelines, use the `verify_imports.py` script:

```bash
python alan_backend/elfin/ci/verify_imports.py <directory_or_file>
```

This script:
- Processes all ELFIN files with imports in the specified path
- Verifies that imports are correctly resolved
- Returns a non-zero exit code if verification fails

Example CI command:

```bash
python alan_backend/elfin/ci/verify_imports.py alan_backend/elfin/templates && echo "All imports verified!" || echo "Import verification failed"
```

## Implementation Details

The import processing is implemented in `import_processor.py`, which provides:

- `process_imports(file_path, output_path)`: Processes all imports in a file
- `resolve_import_path(import_path, base_dir)`: Resolves import paths
- `extract_section(file_content, section_name)`: Extracts sections from imported files

For testing imports, use:

```bash
python alan_backend/elfin/test_import_processor.py
