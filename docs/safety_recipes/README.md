# ELFIN Safety Recipes

This directory contains detailed recipes for implementing safety verification using barrier certificates in various domains. Each recipe provides step-by-step instructions, code examples, and visualizations.

## Available Recipes

1. [**Quadrotor No-Fly Cone**](quadrotor_no_fly_cone.md) - Create conical keep-out zones for aerial vehicles
2. [**Cart-Pole Keep-Out**](cartpole_keepout.md) - Implement safety constraints for classic cart-pole systems
3. [**Swarm Collision Avoidance**](swarm_collision_avoid.md) - Ensure safe distances between agents in multi-agent systems

## Key Components

Each recipe demonstrates:

1. **Barrier Function Definition** - Mathematical formulation of safety constraints
2. **Formal Verification** - SOS-based verification with counterexample refinement
3. **Safe Controller Design** - Implementation of control laws that respect safety constraints
4. **Planning Integration** - Use with ALAN planning framework for safe navigation
5. **Visualization** - Techniques to inspect and understand barrier properties

## Getting Started

For first-time users, we recommend following the recipes in this order:

1. Start with the Cart-Pole example to understand the basic concepts
2. Explore the Quadrotor recipe to see how barriers work in 3D
3. Study the Swarm example to learn about composable safety constraints

## Usage with ELFIN CLI

All recipes can be executed using the ELFIN command-line interface:

```bash
# General pattern
elf barrier learn --system <system_name> --data <data_file>
elf barrier verify --system <system_name> --sos --verbose
elf barrier visualize --system <system_name> --slice

# Example for quadrotor
elf barrier learn --system quadrotor_no_fly --data quadrotor_samples.json
elf barrier verify --system quadrotor_no_fly --sos --verbose
```

## Integration with Other Components

These safety recipes can be combined with:

- **Lyapunov Stability** - Ensuring both safety and stability
- **Koopman Operators** - Data-driven modeling of system dynamics
- **ALAN Planning** - Safe trajectory planning through complex environments

## Extending the Recipes

To create your own safety recipes:

1. Define your system dynamics
2. Specify the unsafe region
3. Generate training data
4. Learn and verify a barrier certificate
5. Integrate with your control system

See each recipe for detailed code examples that can be adapted to your specific domain.
