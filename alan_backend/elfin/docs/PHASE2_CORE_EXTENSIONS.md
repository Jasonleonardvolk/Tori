# ELFIN Phase 2: Core Language Extensions

This document details the implementation plan for Phase 2 of the ELFIN development roadmap. This phase focuses on fundamental language capabilities that will transform ELFIN from a standalone tool into a comprehensive language for safe robotics control.

## Overview

Phase 2 spans approximately 3-4 months and includes these key components:

1. Module System with Imports and Templates
2. Parser Integration with Dimensional Checking  
3. C++ Code Generation with Units Libraries
4. Reusable Components Library

These extensions build upon the foundation of the unit annotation system to create a cohesive, powerful language for robotics control.

## 1. Module System with Imports and Templates (4-6 weeks)

The module system enables code reuse and composition, allowing developers to build complex systems from well-tested components.

### Key Features

#### Import System
- Support for importing modules: `import Module from "path/to/module.elfin";`
- Named imports: `import { Component1, Component2 } from "module.elfin";`
- Aliasing: `import Module as Alias from "module.elfin";`
- Relative and absolute paths with search path configuration
- Circular dependency detection and resolution

#### Template System
- Parameterized templates: `template Motor(kp, ki, kd) { ... }`
- Support for type parameters: `template Vector3D<T> { ... }`
- Template instantiation: `myMotor: Motor(10.0, 0.1, 0.5);`
- Default parameters: `template PID(kp=1.0, ki=0.0, kd=0.0) { ... }`
- Template composition: `template Robot { arm: RobotArm(); base: MobileBase(); }`

### Implementation Approach

1. **Grammar Extensions**
   - Extend the ELFIN grammar to support import and template syntax
   - Define template instantiation syntax
   - Update the parser to handle the new grammar elements

2. **Module Resolution**
   - Create a module resolution system with configurable search paths
   - Implement caching to avoid redundant parsing
   - Add cycle detection to prevent circular dependencies

3. **Symbol Management**
   - Enhance the symbol table to handle scoped symbols
   - Implement name resolution across module boundaries
   - Support qualified names for imported symbols

4. **Template Processing**
   - Implement parameter substitution for templates
   - Build a template instantiation mechanism
   - Verify type safety during template instantiation

## 2. Parser Integration with Dimensional Checking (3-4 weeks)

This component integrates the dimensional checking system with the main ELFIN parser, ensuring consistent safety across the language.

### Key Features

#### AST Enhancement
- Extend expression nodes with dimensional information
- Add dimensional attributes to variables and parameters
- Support dimensional inference for complex expressions

#### Dimensional Checking
- Integrate the dimensional checker with the main parsing pipeline
- Implement checking for assignment compatibility
- Add verification for function arguments and returns

#### Error Reporting
- Create a configurable error/warning reporting system
- Generate clear, actionable dimensional error messages
- Include suggestions for fixing dimensional mismatches

### Implementation Approach

1. **AST Extensions**
   - Add dimensional fields to all relevant AST nodes
   - Create utility functions for dimension manipulation
   - Build a type annotation pass for the AST

2. **Integration Points**
   - Identify the optimal integration points in the parsing pipeline
   - Design a modular approach to allow optional dimensional checking
   - Ensure performance is maintained with dimensional checking enabled

3. **Backward Compatibility**
   - Implement a progressive adoption strategy (warnings before errors)
   - Create migration tools for adding dimensions to existing code
   - Support legacy mode for compatibility with older ELFIN code

4. **Testing Framework**
   - Develop a comprehensive testing suite for dimensional checking
   - Create test cases for common dimensional errors
   - Benchmark parser performance with dimensional checking

## 3. C++ Code Generation with Units Libraries (4-5 weeks)

This component extends ELFIN's code generation capabilities to C++, while maintaining dimensional safety.

### Key Features

#### C++ Units Integration
- Support for multiple C++ units libraries (units, Boost.Units)
- Mapping of ELFIN dimensions to C++ unit types
- Preservation of dimensional safety in generated code

#### Target Customization
- Configuration options for target platforms
- Optimization flags for embedded targets
- Custom memory management for resource-constrained systems

#### Runtime Library
- C++ runtime support for ELFIN functions
- Numerical integration methods (RK4, etc.)
- Utility functions for unit conversions

### Implementation Approach

1. **C++ Code Templates**
   - Design template-based code generation for C++
   - Create mappings between ELFIN types and C++ types
   - Implement visitor pattern for AST traversal

2. **Units Library Support**
   - Evaluate and integrate C++ units libraries
   - Create appropriate type mappings for each library
   - Benchmark performance characteristics

3. **Optimization Strategy**
   - Implement conditional compilation for performance-critical sections
   - Create optimized versions for embedded targets
   - Develop memory management strategies for constrained environments

4. **Testing and Validation**
   - Create unit tests for generated C++ code
   - Implement integration tests with C++ compilation
   - Develop benchmark suite for performance comparison

## 4. Reusable Components Library (3-4 weeks)

This component creates a standard library of reusable components for common robotics control tasks.

### Key Features

#### Robotics Primitives
- Vector and matrix types with dimensional safety
- Spatial transformations (rotations, translations)
- Kinematic chains and rigid body dynamics

#### Control Components
- Standard controllers (PID, LQR, MPC)
- State estimators (Kalman filter, EKF, UKF)
- Trajectory generators and optimizers

#### Sensor and Actuator Models
- Common sensor models (IMU, camera, lidar)
- Actuator models (DC motor, servo, hydraulic)
- Sensor fusion algorithms

### Implementation Approach

1. **Library Architecture**
   - Design a modular architecture for the component library
   - Create a consistent API for component interaction
   - Develop extension points for user-defined components

2. **Component Implementation**
   - Implement core mathematical primitives
   - Develop standard controllers with dimensional safety
   - Create sensor and actuator models with realistic physics

3. **Documentation and Examples**
   - Write comprehensive documentation for each component
   - Create example systems using the component library
   - Develop tutorials for common use cases

4. **Testing and Validation**
   - Implement unit tests for each component
   - Create integration tests for component combinations
   - Validate against reference implementations

## Timeline and Milestones

### Week 1-2: Module System Basics
- Grammar extensions for import statements
- Basic module resolution
- Simple symbol table enhancements

### Week 3-4: Template System
- Template grammar definition
- Parameter substitution mechanism
- Basic template instantiation

### Week 5-6: Module System Completion
- Complete template system
- Module caching and resolution
- Circular dependency handling

### Week 7-8: AST Enhancement
- Dimensional fields in AST nodes
- Expression dimension tracking
- Symbol table integration

### Week 9-10: Parser Integration
- Integration with main parser
- Error reporting system
- Backward compatibility layer

### Week 11-12: C++ Units Libraries
- C++ code generation framework
- Units library integration
- Type mapping system

### Week 13-14: C++ Code Generation
- Complete C++ code generation
- Optimization for embedded targets
- Runtime library development

### Week 15-16: Reusable Components
- Core mathematical primitives
- Standard controllers and estimators
- Sensor and actuator models

## Success Criteria

Phase 2 will be considered successful when:

1. Developers can import modules and create reusable templates
2. The parser detects dimensional errors with clear, actionable messages
3. ELFIN generates dimensionally-safe C++ code
4. A library of reusable components is available for common robotics tasks
5. All new features are thoroughly documented and tested
6. Backward compatibility is maintained for existing ELFIN code

These extensions will transform ELFIN from a standalone tool into a comprehensive language for safe robotics control, enabling code reuse and supporting multiple target platforms.
