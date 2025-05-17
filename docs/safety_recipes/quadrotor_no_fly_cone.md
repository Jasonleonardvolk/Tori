# Quadrotor No-Fly Cone Safety Recipe

This recipe demonstrates how to set up a no-fly cone safety barrier for quadrotor systems using ELFIN. The barrier certificate ensures the quadrotor never enters a conical region, which could represent restricted airspace, physical obstacles, or other safety hazards.

## System Description

The quadrotor dynamics are simplified to a 6-dimensional state space:
- Position coordinates (x, y, z)
- Velocity components (vx, vy, vz)

The no-fly zone is a cone with the apex at the origin, pointing upward along the z-axis.

![Quadrotor No-Fly Cone](../images/quadrotor_no_fly_cone.png)

## Step 1: Define the System

```python
import numpy as np
from alan_backend.elfin.barrier.barrier_bridge_agent import BarrierBridgeAgent

# Create agent
agent = BarrierBridgeAgent(
    name="quadrotor_barrier",
    auto_verify=True
)

# Define state space dimensions
state_dim = 6  # [x, y, z, vx, vy, vz]

# Define domain bounds
domain = (
    np.array([-10.0, -10.0, 0.0, -5.0, -5.0, -5.0]),  # Lower bounds (z ≥ 0)
    np.array([10.0, 10.0, 10.0, 5.0, 5.0, 5.0])       # Upper bounds
)
```

## Step 2: Define the No-Fly Cone

```python
# Define cone parameters
cone_apex = np.array([0.0, 0.0, 0.0])  # Apex at origin
cone_axis = np.array([0.0, 0.0, 1.0])  # Pointing up along z-axis
cone_angle = np.pi / 6  # 30 degrees half-angle

# Define unsafe region (inside cone)
def unsafe_region(state):
    # Extract position
    pos = state[:3]
    
    # Vector from apex to position
    v = pos - cone_apex
    
    # Distance from apex
    distance = np.linalg.norm(v)
    if distance < 0.1:  # Very close to apex
        return True
    
    # Angle between vector and cone axis
    cos_angle = np.dot(v, cone_axis) / distance
    
    # Check if inside cone
    return cos_angle > np.cos(cone_angle) and np.dot(v, cone_axis) > 0
```

## Step 3: Define Quadrotor Dynamics

```python
# Define simplified quadrotor dynamics
def quadrotor_dynamics(state):
    """
    Simplified quadrotor dynamics.
    
    dx/dt = vx
    dy/dt = vy
    dz/dt = vz
    dvx/dt = Fx/m (approximately constant for simplicity)
    dvy/dt = Fy/m (approximately constant for simplicity)
    dvz/dt = Fz/m - g (approximately constant for simplicity)
    
    Args:
        state: [x, y, z, vx, vy, vz]
    """
    x, y, z, vx, vy, vz = state
    
    # Constants
    m = 1.0  # Mass
    g = 9.81  # Gravity
    
    # Control inputs (could be replaced with a controller)
    Fx = 0.0
    Fy = 0.0
    Fz = m * g  # Hovering
    
    # State derivatives
    dx = vx
    dy = vy
    dz = vz
    dvx = Fx / m
    dvy = Fy / m
    dvz = Fz / m - g
    
    return np.array([dx, dy, dz, dvx, dvy, dvz])
```

## Step 4: Generate Safe and Unsafe Samples

```python
# Generate safe and unsafe samples
n_samples = 1000
safe_samples = []
unsafe_samples = []

# Safe region is outside the cone
safe_region = lambda state: not unsafe_region(state)

# Generate samples
for _ in range(n_samples * 2):  # Oversample to ensure enough points
    # Generate random point in domain
    state = np.random.uniform(domain[0], domain[1])
    
    if unsafe_region(state):
        unsafe_samples.append(state)
        if len(unsafe_samples) >= n_samples:
            break
    else:
        safe_samples.append(state)
        if len(safe_samples) >= n_samples:
            break

# Convert to numpy arrays
safe_samples = np.array(safe_samples[:n_samples])
unsafe_samples = np.array(unsafe_samples[:n_samples])
```

## Step 5: Learn and Verify Barrier Certificate

```python
# Learn barrier certificate
barrier_fn = agent.learn_barrier(
    system_name="quadrotor_no_fly_cone",
    safe_samples=safe_samples,
    unsafe_samples=unsafe_samples,
    dictionary_type="rbf",   # Radial basis functions
    dictionary_size=200,     # Larger for better accuracy
    domain=domain,
    dynamics_fn=quadrotor_dynamics,
    safe_region=safe_region,
    unsafe_region=unsafe_region,
    options={
        'safe_margin': 0.1,
        'unsafe_margin': 0.1,
        'boundary_margin': 0.1
    }
)

# Verify barrier certificate (SOS verification)
verification_result = agent.verify(
    system_name="quadrotor_no_fly_cone",
    method="mosek"  # Use Mosek SOS verification if available
)

print(f"Verification result: {verification_result.status}")
if not verification_result.success:
    print(f"Violation reason: {verification_result.violation_reason}")
    print(f"Error code: {verification_result.get_error_code()}")
    
    # Refine if verification fails
    if verification_result.counterexample is not None:
        refined_result = agent.refine_auto(
            system_name="quadrotor_no_fly_cone",
            max_iterations=5
        )
        print(f"Refined verification result: {refined_result.status}")
```

## Step 6: Visualize Barrier and Trajectories

```python
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

def visualize_quadrotor_barrier():
    # Create 3D plot
    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # Visualize cone
    r = np.linspace(0, 10, 100)
    theta = np.linspace(0, 2*np.pi, 100)
    r_mesh, theta_mesh = np.meshgrid(r, theta)
    
    # Convert to Cartesian coordinates
    z_mesh = r_mesh
    x_mesh = r_mesh * np.sin(cone_angle) * np.cos(theta_mesh)
    y_mesh = r_mesh * np.sin(cone_angle) * np.sin(theta_mesh)
    
    # Plot cone
    ax.plot_surface(x_mesh, y_mesh, z_mesh, alpha=0.2, color='r')
    
    # Visualize barrier function
    # We'll sample points in a plane and color by barrier value
    x_range = np.linspace(-8, 8, 50)
    y_range = np.linspace(-8, 8, 50)
    z_height = 5.0  # Height of the sampling plane
    
    X, Y = np.meshgrid(x_range, y_range)
    Z = np.zeros_like(X) + z_height
    B = np.zeros_like(X)
    
    # Evaluate barrier function at each point
    for i in range(len(x_range)):
        for j in range(len(y_range)):
            state = np.array([X[j, i], Y[j, i], Z[j, i], 0.0, 0.0, 0.0])
            B[j, i] = barrier_fn(state)
    
    # Plot barrier contours
    barrier_contour = ax.contourf(
        X, Y, B, zdir='z', offset=z_height, 
        levels=20, cmap='coolwarm', alpha=0.7
    )
    fig.colorbar(barrier_contour, label='Barrier Value')
    
    # Add labels
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    ax.set_title('Quadrotor No-Fly Cone with Barrier Function')
    
    # Set view angle
    ax.view_init(30, 45)
    plt.tight_layout()
    plt.savefig('quadrotor_no_fly_cone.png')
    plt.show()

# Call the visualization function
visualize_quadrotor_barrier()
```

## Using the Barrier in Planning

To use this barrier certificate with the ALAN planner:

```python
from alan_backend.planner.barrier_planner import create_goal_graph_with_safety

# Define distance function
def euclidean_distance(a, b):
    return np.linalg.norm(a - b)

# Create transition model
def get_transition_model(step_size=0.2):
    def transition_model(state):
        # Define all possible moves
        transitions = []
        # Simplified example with 6 cardinal directions
        directions = [
            np.array([step_size, 0, 0, 0, 0, 0]),  # +x
            np.array([-step_size, 0, 0, 0, 0, 0]), # -x
            np.array([0, step_size, 0, 0, 0, 0]),  # +y
            np.array([0, -step_size, 0, 0, 0, 0]), # -y
            np.array([0, 0, step_size, 0, 0, 0]),  # +z
            np.array([0, 0, -step_size, 0, 0, 0])  # -z
        ]
        
        for d in directions:
            next_state = state + d
            # Ensure next_state is within domain
            if np.all(next_state >= domain[0]) and np.all(next_state <= domain[1]):
                transitions.append((next_state, f"move_{d}", step_size))
        
        return transitions
    
    return transition_model

# Create safety-aware planner
planner = create_goal_graph_with_safety(
    distance_fn=euclidean_distance,
    transition_model=get_transition_model(),
    barrier_agent=agent,
    system_name="quadrotor_no_fly_cone"
)

# Define start and goal
start_state = np.array([-5.0, -5.0, 5.0, 0.0, 0.0, 0.0])
goal_state = np.array([5.0, 5.0, 5.0, 0.0, 0.0, 0.0])

# Plan safe trajectory
# (See barrier_planner.py documentation for full usage)
```

## Command Line Interface

You can also use the ELFIN CLI to work with this barrier:

```bash
# Learn a barrier certificate
elf barrier learn --system quadrotor_no_fly_cone --data quadrotor_samples.json

# Verify with SOS
elf barrier verify --system quadrotor_no_fly_cone --sos --verbose

# Refinement if needed
elf barrier refine --system quadrotor_no_fly_cone --max-iterations 5

# Visualize
elf barrier visualize --system quadrotor_no_fly_cone --3d --save-image
```

## Key Points

1. **Conical Formulation**: The unsafe region is defined as the interior of a cone, which can represent air traffic restrictions, sensor/signal cones, or obstacle avoidance.

2. **3D Barrier**: The barrier certificate works in the full 3D position space and is aware of velocity components.

3. **Formal Verification**: The SOS verification provides formal guarantees that the quadrotor cannot enter the no-fly region under the modeled dynamics.

4. **Planning Integration**: The barrier certificate seamlessly integrates with the planning system to generate safe trajectories.
