# ELFIN Enhancement Implementation Plan

This document outlines the detailed implementation plan for enhancing the ELFIN domain-specific language with unit annotations, module system, and code generation capabilities.

## Phase 1: Module System Foundations (2-3 weeks)

### Design Document: Import System

#### 1. Syntax

We'll extend the ELFIN grammar to support imports:

```
import_statement ::= "import" identifier ["as" identifier] "from" string_literal ";"
                   | "import" "{" identifier_list "}" "from" string_literal ";"
```

Examples:
```elfin
import RigidBody6DoF from "physics/rigid_body.elfin";
import { Vector3, Quaternion } from "math/spatial.elfin";
import Pendulum as SimplePendulum from "examples/pendulum.elfin";
```

#### 2. Module Resolution

The import resolver will:
1. Maintain a search path for modules (configurable)
2. Resolve relative and absolute paths
3. Cache parsed modules to avoid repeated parsing
4. Detect and prevent circular imports

```python
class ImportResolver:
    def __init__(self, search_paths=None):
        self.search_paths = search_paths or [".", "./lib"]
        self.module_cache = {}  # path -> parsed module
        
    def resolve(self, import_path, from_path=None):
        # Convert relative to absolute path
        if from_path and not import_path.startswith("/"):
            base_dir = os.path.dirname(from_path)
            absolute_path = os.path.normpath(os.path.join(base_dir, import_path))
        else:
            # Try each search path
            for path in self.search_paths:
                candidate = os.path.join(path, import_path)
                if os.path.exists(candidate):
                    absolute_path = candidate
                    break
            else:
                raise ImportError(f"Could not resolve import: {import_path}")
        
        # Check cache
        if absolute_path in self.module_cache:
            return self.module_cache[absolute_path]
        
        # Parse module
        with open(absolute_path, 'r') as f:
            content = f.read()
        
        # Parse and process imports recursively...
        module = parse_module(content, path=absolute_path, resolver=self)
        
        # Cache and return
        self.module_cache[absolute_path] = module
        return module
```

#### 3. Symbol Table

We'll enhance the symbol table to handle scopes:

```python
class Scope:
    def __init__(self, parent=None):
        self.symbols = {}
        self.parent = parent
    
    def define(self, name, symbol):
        self.symbols[name] = symbol
        
    def resolve(self, name):
        if name in self.symbols:
            return self.symbols[name]
        if self.parent:
            return self.parent.resolve(name)
        return None

class SymbolTable:
    def __init__(self):
        self.global_scope = Scope()
        self.current_scope = self.global_scope
        
    def enter_scope(self):
        self.current_scope = Scope(self.current_scope)
        return self.current_scope
        
    def exit_scope(self):
        if self.current_scope.parent:
            self.current_scope = self.current_scope.parent
            
    def define(self, name, symbol):
        self.current_scope.define(name, symbol)
        
    def resolve(self, name):
        return self.current_scope.resolve(name)
```

### Pull Request Template: Module System

```markdown
# Module System Implementation

## Description
This PR implements the basic module system for ELFIN, including import statements, module resolution, and scoped symbol tables.

## Changes
- Extended grammar to support import statements
- Added ImportResolver class for module resolution
- Enhanced symbol table with scope management
- Modified parser to handle imports
- Added tests for module system

## Example
```elfin
# physics/rigid_body.elfin
template RigidBody6DoF(mass, inertia) {
  params { 
    m: mass[kg] = mass; 
    I: inertia = inertia; 
  }
  # ... state + dynamics ...
}

# robot.elfin
import RigidBody6DoF from "physics/rigid_body.elfin";

system MyBot { 
  body: RigidBody6DoF(1.5, diag(0.1, 0.1, 0.2)); 
}
```

## Testing
- Added unit tests for import resolution
- Added integration tests with example files
- Verified backward compatibility with existing ELFIN files
```

## Phase 2: Integrated Dimensional Checking (2 weeks)

### Design Document: Integrated Dimensional Checker

#### 1. AST Annotation

We'll extend the main parser's AST to include dimensional information:

```python
class ExpressionNode:
    def __init__(self, node_type, value=None, children=None):
        self.node_type = node_type
        self.value = value
        self.children = children or []
        self.dimension = None  # Will be populated during checking

class DimensionChecker:
    def __init__(self, unit_table, symbol_table):
        self.unit_table = unit_table
        self.symbol_table = symbol_table
        
    def check(self, ast):
        """Annotate AST with dimensional information and check consistency."""
        return self._check_node(ast)
        
    def _check_node(self, node):
        # Dispatch based on node type...
        if node.node_type == "BinaryOp":
            return self._check_binary_op(node)
        elif node.node_type == "Identifier":
            return self._check_identifier(node)
        # etc...
        
    def _check_binary_op(self, node):
        left_dim = self._check_node(node.children[0])
        right_dim = self._check_node(node.children[1])
        
        if node.value in ("+", "-"):
            if left_dim != right_dim:
                self._report_error(node, f"Cannot add/subtract {left_dim} and {right_dim}")
            node.dimension = left_dim
        elif node.value == "*":
            node.dimension = left_dim * right_dim
        # etc...
        
        return node.dimension
```

#### 2. Diagnostic System

We'll implement a configurable diagnostic system for warnings and errors:

```python
class Diagnostic:
    def __init__(self, message, location, severity="error"):
        self.message = message
        self.location = location
        self.severity = severity  # "error", "warning", "info"

class DiagnosticCollector:
    def __init__(self, error_level="warning"):
        self.diagnostics = []
        self.error_level = error_level  # "error", "warning", "off"
        
    def report(self, message, location, severity="error"):
        self.diagnostics.append(Diagnostic(message, location, severity))
        
    def has_errors(self):
        if self.error_level == "off":
            return False
        if self.error_level == "error":
            return any(d.severity == "error" for d in self.diagnostics)
        return len(self.diagnostics) > 0
```

#### 3. Integration with Parser

We'll integrate the dimensional checker with the main parser:

```python
def parse_and_check(content, unit_annotations=True, error_level="warning"):
    """Parse ELFIN content and check dimensional consistency."""
    # Parse the content
    ast = parse(content)
    
    # Exit early if not checking dimensions
    if not unit_annotations:
        return ast, []
    
    # Setup checking environment
    symbol_table = build_symbol_table(ast)
    unit_table = UnitTable()
    diagnostics = DiagnosticCollector(error_level)
    
    # Check dimensions
    checker = DimensionChecker(unit_table, symbol_table, diagnostics)
    checker.check(ast)
    
    return ast, diagnostics.diagnostics
```

### Pull Request Template: Integrated Dimensional Checker

```markdown
# Integrated Dimensional Checker

## Description
This PR integrates the dimensional checking system with the main ELFIN parser, initially as warnings to maintain backward compatibility.

## Changes
- Extended AST nodes with dimensional information
- Implemented configurable diagnostic system (warnings vs. errors)
- Added dimensional checking pass to main parser
- Added configuration options for enabling/disabling dimensional checking
- Added tests for dimensional checking integration

## Example
Input:
```elfin
system Pendulum {
  continuous_state {
    theta: angle[rad];
    omega: angular_velocity[rad/s];
  }

  flow_dynamics {
    theta_dot = omega;
    omega_dot = -9.81 * sin(theta);  # Dimensionally incorrect
  }
}
```

Output:
```
Warning at line 9, col 19: Dimensional mismatch in assignment:
  Expected type 'angular_acceleration [rad/s²]'
  Found type 'acceleration [m/s²]'
```

## Testing
- Added unit tests for dimensional checking
- Added integration tests with example files
- Verified backward compatibility with existing ELFIN files
```

## Phase 3: Extended Code Generation (3-4 weeks)

### Design Document: C++ Code Generation

#### 1. C++ Units Library Selection

We'll initially support two C++ units libraries:

1. **units**: A compact, header-only library similar to `uom` in Rust
2. **Boost.Units**: A more comprehensive library with wide industry adoption

The generator will accept a configuration option to select the target library:

```python
def generate_cpp_code(ast, output_file, units_library="units", include_runtime=True):
    """Generate C++ code from ELFIN AST."""
    if units_library == "units":
        generator = UnitsGenerator(include_runtime)
    elif units_library == "boost":
        generator = BoostUnitsGenerator(include_runtime)
    else:
        generator = RawGenerator(include_runtime)
    
    code = generator.generate(ast)
    
    with open(output_file, 'w') as f:
        f.write(code)
    
    return output_file
```

#### 2. Code Generation Template (units library)

For the `units` library, the generated code will look like:

```cpp
// Generated from ELFIN specification
#include <units.h>
#include <cmath>
#include <iostream>

using namespace units::literals;
using namespace units::angle;

class Pendulum {
private:
    // Parameters
    const units::mass::kilogram_t m{1.0};
    const units::length::meter_t l{1.0};
    const units::acceleration::meters_per_second_squared_t g{9.81};
    const units::torque::newton_meter_t b{0.1};

public:
    // State
    radian_t theta{0.0};
    units::angular_velocity::radians_per_second_t omega{0.0};

    // Input
    units::torque::newton_meter_t u{0.0};

    // Update state with explicit Euler integration
    void step(units::time::second_t dt) {
        // Dynamics
        auto theta_dot = omega;
        auto omega_dot = -g / l * sin(theta.value()) 
                        - b / (m * l * l) * omega 
                        + u / (m * l * l);
        
        // Euler integration
        theta += theta_dot * dt;
        omega += omega_dot * dt;
    }

    // Reset state to initial conditions
    void reset() {
        theta = 0.0_rad;
        omega = 0.0_rad_per_s;
    }
};
```

#### 3. Visitor Pattern for Code Generation

We'll implement a visitor pattern to traverse the AST and generate code:

```python
class CppVisitor:
    def __init__(self, units_library="units"):
        self.units_library = units_library
        self.indent = 0
        
    def visit(self, node):
        method_name = f"visit_{node.node_type}"
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node)
        
    def generic_visit(self, node):
        result = ""
        for child in node.children:
            result += self.visit(child)
        return result
        
    def visit_System(self, node):
        # Generate class declaration, constructor, methods, etc.
        # ...
        
    def visit_State(self, node):
        # Generate state variables with appropriate units
        # ...
        
    def visit_Parameters(self, node):
        # Generate parameters with appropriate units
        # ...
        
    def visit_Dynamics(self, node):
        # Generate dynamics equations
        # ...
```

### Pull Request Template: C++ Code Generation

```markdown
# C++ Code Generation

## Description
This PR adds C++ code generation capabilities to ELFIN, supporting both the `units` and Boost.Units libraries for dimensional safety.

## Changes
- Implemented C++ code generation framework
- Added support for the `units` library
- Added support for the Boost.Units library
- Added raw f32/double generation for constrained environments
- Added CLI options for selecting C++ generation mode
- Added tests for C++ code generation

## Example
Input:
```elfin
system Pendulum {
  continuous_state {
    theta: angle[rad];
    omega: angular_velocity[rad/s];
  }

  parameters {
    m: mass[kg] = 1.0;
    l: length[m] = 1.0;
    g: acceleration[m/s^2] = 9.81;
    b: angular_damping[N·m·s/rad] = 0.1;
  }

  flow_dynamics {
    theta_dot = omega;
    omega_dot = -g/l * sin(theta) - b/(m*l^2) * omega;
  }
}
```

Output:
```cpp
// Generated from ELFIN specification
#include <units.h>
#include <cmath>

using namespace units::literals;

class Pendulum {
private:
    // Parameters
    const units::mass::kilogram_t m{1.0};
    const units::length::meter_t l{1.0};
    const units::acceleration::meters_per_second_squared_t g{9.81};
    const units::torque::newton_meter_t b{0.1};

public:
    // State
    units::angle::radian_t theta{0.0};
    units::angular_velocity::radians_per_second_t omega{0.0};

    // Update state with explicit Euler integration
    void step(units::time::second_t dt) {
        // Dynamics
        auto theta_dot = omega;
        auto omega_dot = -g / l * sin(theta.value()) 
                        - b / (m * l * l) * omega;
        
        // Euler integration
        theta += theta_dot * dt;
        omega += omega_dot * dt;
    }

    // Reset state to initial conditions
    void reset() {
        theta = 0.0_rad;
        omega = 0.0_rad_per_s;
    }
};
```

## Testing
- Added unit tests for C++ code generation
- Added integration tests with example files
- Verified C++ code compilation with both `units` and Boost.Units
- Benchmarked performance against raw f32/double implementation
```

## Phase 4: Developer Experience (2-3 weeks)

### Design Document: Language Server Protocol Implementation

#### 1. LSP Server Architecture

We'll implement a Language Server Protocol (LSP) server for ELFIN:

```python
from pygls.server import LanguageServer
from pygls.lsp.types import (
    CompletionOptions, TextDocumentPositionParams, CompletionList,
    CompletionItem, DiagnosticSeverity, Diagnostic
)

class ElfinLanguageServer(LanguageServer):
    def __init__(self):
        super().__init__()
        
        @self.feature(TEXT_DOCUMENT_DID_OPEN)
        def did_open(params):
            self.validate_elfin(params.textDocument)
            
        @self.feature(TEXT_DOCUMENT_DID_CHANGE)
        def did_change(params):
            self.validate_elfin(params.textDocument)
            
        @self.feature(TEXT_DOCUMENT_HOVER)
        def hover(params: TextDocumentPositionParams):
            return self.provide_hover(params)
            
        @self.feature(TEXT_DOCUMENT_COMPLETION)
        def completion(params: TextDocumentPositionParams):
            return self.provide_completion(params)
            
    def validate_elfin(self, text_document):
        """Validate ELFIN document and publish diagnostics."""
        # Parse and check the document
        source = text_document.text
        ast, diagnostics = parse_and_check(source, error_level="warning")
        
        # Convert to LSP diagnostics
        lsp_diagnostics = []
        for diag in diagnostics:
            lsp_diag = Diagnostic(
                range=diag.location,
                message=diag.message,
                severity=DiagnosticSeverity.Warning if diag.severity == "warning" else DiagnosticSeverity.Error
            )
            lsp_diagnostics.append(lsp_diag)
            
        # Publish diagnostics
        self.publish_diagnostics(text_document.uri, lsp_diagnostics)
        
    def provide_hover(self, params: TextDocumentPositionParams):
        """Provide hover information for the given position."""
        # Get document text
        doc = self.workspace.get_document(params.textDocument.uri)
        source = doc.source
        
        # Parse and check the document
        ast, _ = parse_and_check(source, error_level="off")
        
        # Find node at position
        node = find_node_at_position(ast, params.position)
        if not node:
            return None
            
        # Generate hover information
        if hasattr(node, 'dimension') and node.dimension:
            dim_str = str(node.dimension)
            return Hover(
                contents=f"Type: {dim_str}",
                range=node.range
            )
            
        return None
```

#### 2. VSCode Extension

We'll create a VSCode extension that connects to our LSP server:

```json
{
  "name": "elfin-language",
  "displayName": "ELFIN Language",
  "description": "Language support for ELFIN",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.60.0"
  },
  "categories": [
    "Programming Languages"
  ],
  "activationEvents": [
    "onLanguage:elfin"
  ],
  "main": "./extension.js",
  "contributes": {
    "languages": [
      {
        "id": "elfin",
        "aliases": ["ELFIN", "elfin"],
        "extensions": [".elfin"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "elfin",
        "scopeName": "source.elfin",
        "path": "./syntaxes/elfin.tmLanguage.json"
      }
    ],
    "commands": [
      {
        "command": "elfin.checkDimensions",
        "title": "ELFIN: Check Dimensional Consistency"
      },
      {
        "command": "elfin.generateCode",
        "title": "ELFIN: Generate Code"
      }
    ]
  }
}
```

### Pull Request Template: Language Server Protocol Implementation

```markdown
# Language Server Protocol (LSP) Implementation

## Description
This PR adds Language Server Protocol support for ELFIN, providing real-time linting, hover information with dimensional types, and code completion.

## Changes
- Implemented LSP server for ELFIN using pygls
- Added hover provider for displaying dimensional information
- Added diagnostic provider for dimensional checking
- Created VSCode extension for ELFIN
- Added syntax highlighting and language configuration

## Features
- Real-time dimensional checking as you type
- Hover tooltips showing inferred dimensions
- Quick-fix suggestions for common dimensional errors
- Code completion for ELFIN keywords and imported symbols

## Example
![ELFIN LSP Demo](docs/images/elfin-lsp-demo.gif)

## Testing
- Added unit tests for LSP server
- Added integration tests with VSCode extension API
- Manual testing with sample ELFIN files
```

## Immediate Next Steps

To begin implementation, we recommend the following concrete next steps:

1. **Create AST Extension for Unit Dimensions**
   - Add `dimension` field to expression nodes in the main parser
   - Create utility functions for dimension creation and manipulation
   - Add unit tests for the extended AST

2. **Implement Basic Module Resolution**
   - Start with the `ImportResolver` class as outlined
   - Add support for resolving imports from search paths
   - Create test cases with simple import examples

3. **Set Up Development Environment for C++ Generation**
   - Add `units` and Boost.Units as development dependencies
   - Create example C++ files for testing generated code
   - Set up compilation tests for validation

## Conclusion

This implementation plan provides a clear roadmap for enhancing ELFIN with unit annotations, module system, and code generation capabilities. By following the phased approach and focusing on incremental delivery, we can provide value to users at each stage while building towards a comprehensive solution.

The end result will be a powerful, safety-focused domain-specific language for robotics control systems that prevents common errors through dimensional checking, supports modular development through imports, generates efficient code for various platforms, and provides a smooth developer experience with IDE integration.
