# ELFIN Module System Guide

## Introduction

The ELFIN module system enables code reuse and composition through imports and templates. This guide provides a comprehensive overview of how to use these features to build modular and reusable ELFIN programs.

## Table of Contents

1. [Importing Modules](#importing-modules)
   - [Basic Imports](#basic-imports)
   - [Multiple Imports](#multiple-imports)
   - [Import Aliases](#import-aliases)
   - [Relative vs. Absolute Imports](#relative-vs-absolute-imports)

2. [Using Templates](#using-templates)
   - [Defining Templates](#defining-templates)
   - [Template Parameters](#template-parameters)
   - [Instantiating Templates](#instantiating-templates)
   - [Named vs. Positional Arguments](#named-vs-positional-arguments)

3. [Best Practices](#best-practices)
   - [Module Organization](#module-organization)
   - [Template Design](#template-design)
   - [Performance Considerations](#performance-considerations)

4. [Advanced Topics](#advanced-topics)
   - [Template Specialization](#template-specialization)
   - [Template Composition](#template-composition)
   - [Circular Dependencies](#circular-dependencies)

## Importing Modules

### Basic Imports

The simplest way to import a component from another module is using the `import` statement:

```elfin
import Controller from "controller.elfin";

concept Robot {
    property controller = Controller();
}
```

This imports the `Controller` component from the file `controller.elfin` and makes it available in the current module.

### Multiple Imports

You can import multiple components from the same module using curly braces:

```elfin
import { Vector3, Matrix3 } from "math/linear.elfin";

concept Robot {
    property position = Vector3(0, 0, 0);
    property orientation = Matrix3();
}
```

### Import Aliases

You can use aliases to rename imported components:

```elfin
import Sensor as DistanceSensor from "sensors/distance.elfin";

concept Robot {
    property sensor = DistanceSensor();
}
```

Or when importing multiple components:

```elfin
import { Vector3 as Vec3, Matrix3 as Mat3 } from "math/linear.elfin";

concept Robot {
    property position = Vec3(0, 0, 0);
    property orientation = Mat3();
}
```

### Relative vs. Absolute Imports

ELFIN supports both relative and absolute imports:

- **Absolute imports** are resolved from the search paths:
  ```elfin
  import Controller from "controllers/pid.elfin";
  ```

- **Relative imports** are resolved relative to the current file:
  ```elfin
  import Sensor from "./sensors/distance.elfin";
  ```

## Using Templates

### Defining Templates

Templates are reusable, parameterized components:

```elfin
template Vector3(x=0.0, y=0.0, z=0.0) {
    parameters {
        x: float = x;
        y: float = y;
        z: float = z;
    }
    
    property magnitude {
        return (x^2 + y^2 + z^2)^0.5;
    }
    
    property normalized {
        mag = magnitude;
        if (mag > 0) {
            return Vector3(x/mag, y/mag, z/mag);
        } else {
            return Vector3(0, 0, 0);
        }
    }
}
```

### Template Parameters

Template parameters can have types and default values:

```elfin
template PIDController(kp, ki=0.0, kd=0.0) {
    parameters {
        kp: float;  // Required parameter
        ki: float = ki;  // Optional with default value
        kd: float = kd;  // Optional with default value
    }
    
    // ...
}
```

Parameters can be:
- **Required**: No default value, must be provided when instantiating
- **Optional**: Has a default value, can be omitted when instantiating

### Instantiating Templates

You instantiate a template by calling it like a function:

```elfin
position = Vector3(1.0, 2.0, 3.0);
controller = PIDController(1.0, 0.1, 0.01);
```

You can also give names to template instances:

```elfin
myPosition: Vector3(1.0, 2.0, 3.0);
```

### Named vs. Positional Arguments

You can use positional arguments:

```elfin
velocity = Vector3(1.0, 2.0, 3.0);
```

Or named arguments:

```elfin
velocity = Vector3(x=1.0, z=3.0, y=2.0);  // Order doesn't matter
```

Or a combination:

```elfin
controller = PIDController(1.0, kd=0.01);  // ki uses default value
```

## Best Practices

### Module Organization

Organize your modules logically:

- **One concept per file**: Keep each major concept in its own file
- **Group related templates**: Put related templates in the same file
- **Use directories**: Group related files in directories
- **Index modules**: Create index files that re-export components

Example directory structure:

```
project/
├── controllers/
│   ├── pid.elfin
│   ├── lqr.elfin
│   └── index.elfin
├── sensors/
│   ├── distance.elfin
│   ├── camera.elfin
│   └── index.elfin
└── robot.elfin
```

### Template Design

When designing templates:

- **Make parameters descriptive**: Use clear, descriptive parameter names
- **Provide sensible defaults**: Use default values when appropriate
- **Use type annotations**: Add type annotations to parameters
- **Document templates**: Document what the template does and how to use it
- **Keep templates focused**: Each template should have a single responsibility

### Performance Considerations

To optimize performance:

- **Import only what you need**: Use selective imports
- **Use lazy evaluation**: Avoid unnecessary computations
- **Consider caching**: Cache expensive computations
- **Minimize dependencies**: Reduce the number of imports

## Advanced Topics

### Template Specialization

You can create specialized versions of templates for specific use cases:

```elfin
template Vector(dimensions=3) {
    // Generic vector template
}

template Vector2D() : Vector(2) {
    // Specialized 2D vector
}

template Vector3D() : Vector(3) {
    // Specialized 3D vector
}
```

### Template Composition

Templates can be composed to create more complex components:

```elfin
template Transform(rotation=Matrix3(), translation=Vector3()) {
    // Combine rotation and translation
}
```

### Circular Dependencies

ELFIN detects circular dependencies at compile time:

```elfin
// a.elfin
import B from "b.elfin";  // B depends on C

// b.elfin
import C from "c.elfin";  // C depends on A

// c.elfin
import A from "a.elfin";  // A depends on B, creating a cycle
```

To avoid circular dependencies:
- **Refactor common code**: Extract shared code into a separate module
- **Use forward declarations**: Declare components before using them
- **Rethink design**: Redesign your modules to avoid cycles

---

This guide provides an overview of the ELFIN module system. For more details, refer to the [API Reference](MODULE_SYSTEM_API.md) and explore the [example projects](../examples).
