# Unit Kiwi Feature for ELFIN Parameters

## Overview

The Unit Kiwi feature extends the ELFIN language to support attaching physical units to parameter definitions. This enhances the language with stronger type checking and clearer documentation of parameter semantics.

## Syntax

Parameters can now be defined with optional unit specifications:

```
param_name: value [unit];
```

For example:

```
max_velocity: 2.0 [m/s];       // Maximum linear velocity
wheel_radius: 0.1 [m];         // Wheel radius
mass: 10.0 [kg];               // Robot mass
moment: 2.0 [kg*m^2];          // Moment of inertia
```

## Implementation Details

The Unit Kiwi feature is implemented with the following components:

1. **Grammar Extension**: The Lark grammar has been updated to support unit specifications.
   ```lark
   param_def: NAME ":" expression ["[" UNIT "]"] ";"?
   UNIT: /[a-zA-Z0-9\/\*\^\-\s\.]+/
   ```

2. **AST Node Types**: A dedicated `ParamDef` node type with a `unit` field has been added to store unit information.
   ```python
   @dataclass
   class ParamDef(Node):
       """Parameter definition with optional unit."""
       name: str
       value: 'Expression'
       unit: Optional[str] = None
   ```

3. **Parser Transformation**: The Megatron AST converter extracts and stores unit specifications from parameters.
   ```python
   def param_def(self, name, expr, unit=None):
       """Transform a parameter definition with optional unit."""
       unit_value = unit.value.strip('[]') if unit else None
       return ParamDef(name=name.value, value=expr, unit=unit_value)
   ```

## Backward Compatibility

The Unit Kiwi feature maintains full backward compatibility with existing ELFIN code. The unit specification is optional, so legacy files without units continue to parse correctly.

## Unit Format

Units follow standard scientific notation:

- Basic units: `m`, `kg`, `s`, `A`, `K`, etc.
- Derived units: `m/s`, `kg*m^2`, `N*s/m`, etc.
- Compound units: `m/s^2`, `kg*m/s^2`, etc.

## Future Work

Future enhancements to the Unit Kiwi feature may include:

1. **Unit Validation**: Automatic checking of unit consistency in expressions.
2. **Unit Conversion**: Automatic conversion between compatible units.
3. **Dimensional Analysis**: Static checking of dimensional compatibility in equations.
4. **Code Generation**: Generated code with explicit unit handling.

## Example

```
system RobotWithUnits {
    continuous_state: [x, y, theta, v, omega];
    input: [v_cmd, omega_cmd];
    
    params {
        // Parameters with units
        max_velocity: 2.0 [m/s];       // Maximum linear velocity
        max_acceleration: 1.0 [m/s^2];  // Maximum linear acceleration
        wheel_radius: 0.1 [m];         // Wheel radius
        wheel_base: 0.5 [m];           // Distance between wheels
        mass: 10.0 [kg];               // Robot mass
        moment: 2.0 [kg*m^2];          // Moment of inertia
        friction: 0.2 [N*s/m];         // Friction coefficient
    }
    
    flow_dynamics {
        // Kinematics
        x_dot = v * cos(theta);
        y_dot = v * sin(theta);
        theta_dot = omega;
        
        // Dynamics with physical units maintained
        v_dot = (v_cmd - friction * v / mass);
        omega_dot = (omega_cmd - friction * omega * wheel_radius / moment);
    }
}
