# ELFIN Language

ELFIN (Embedded Language For INstructions) is a domain-specific language designed for control system specification, focusing on dimensional consistency and mathematical rigor.

## Key Features

- **Dimensional Analysis**: Verify units and dimensions at compile time to catch physical inconsistencies
- **Standard Library**: Reusable components for common control system tasks
- **Format & Style**: Consistent, readable code with automatic formatting
- **Language Server**: Rich tooling with IDE integration for code intelligence

## Quick Links

- [Getting Started](getting-started/installation.md)
- [Language Reference](reference/syntax.md)
- [Standard Library](stdlib/overview.md)
- [Full Specification](spec.md)

## Example

```elfin
import Helpers from "std/helpers.elfin";

system PendulumController {
  continuous_state: [theta, omega];
  inputs: [tau];
  
  params {
    m: mass[kg] = 1.0;
    l: length[m] = 1.0;
    g: acceleration[m/s^2] = 9.81;
    b: damping[kg*m^2/s] = 0.1;
  }
  
  flow_dynamics {
    # Angular position derivative
    theta_dot = omega;
    
    # Angular velocity derivative
    omega_dot = (tau - b * omega - m * g * l * Helpers.wrapAngle(theta)) / (m * l^2);
  }
}
```

## Development Status

ELFIN is approaching version 1.0 with a stable language definition and comprehensive tooling. Key components include:

- Dimensional consistency checking
- Code formatter with standard style rules
- LSP implementation for IDE integration
- Standard library with common helper functions

## License

ELFIN is released under the MIT License. See the [LICENSE](https://github.com/elfin-lang/elfin/blob/main/LICENSE) file for details.
