# Cart-Pole Keep-Out Safety Recipe

This recipe demonstrates how to create and verify barrier certificates for a cart-pole system with keep-out zones. The barrier certificates prevent the system from entering unsafe regions of the state space, such as hitting track boundaries or allowing the pole to fall beyond a certain angle.

## System Description

The cart-pole system is a 4-dimensional state space:
- Cart position (x)
- Cart velocity (ẋ)
- Pole angle (θ)
- Pole angular velocity (θ̇)

We'll define two safety specifications:
1. Track boundaries: The cart must stay within a defined region on the track.
2. Pole angle limits: The pole must not fall beyond a certain angle from vertical.

![Cart-Pole System](../images/cartpole_keepout.png)

## Step 1: Define the System

```python
import numpy as np
from alan_backend.elfin.barrier.barrier_bridge_agent import BarrierBridgeAgent

# Create agent
agent = BarrierBridgeAgent(
    name="cartpole_barrier",
    auto_verify=True
)

# Define state space dimensions
state_dim = 4  # [x, x_dot, theta, theta_dot]

# Define domain bounds
domain = (
    np.array([-3.0, -5.0, -np.pi, -8.0]),  # Lower bounds
    np.array([3.0, 5.0, np.pi, 8.0])       # Upper bounds
)
```

## Step 2: Define Cart-Pole Dynamics

```python
def cart_pole_dynamics(state):
    """
    Cart-pole dynamics.
    
    The dynamics are:
    ẍ = (F + m*l*sin(θ)*(θ̇)² - m*g*cos(θ)*sin(θ)) / (M + m*sin²(θ))
    θ̈ = (g*sin(θ) - cos(θ)*ẍ) / l
    
    We use a simple state feedback controller for F.
    
    Args:
        state: [x, x_dot, theta, theta_dot]
            
    Returns:
        State derivatives: [x_dot, x_ddot, theta_dot, theta_ddot]
    """
    # Extract state
    x, x_dot, theta, theta_dot = state
    
    # Physical parameters
    g = 9.81       # Gravity
    m = 0.1        # Pole mass
    M = 1.0        # Cart mass
    l = 0.5        # Pole half-length
    
    # Simple state feedback controller
    # Stabilize pole at vertical position (theta = 0) and cart at origin (x = 0)
    k_x = -1.0     # Position gain
    k_x_dot = -0.5 # Velocity gain
    k_theta = -20.0 # Angle gain
    k_theta_dot = -2.0 # Angular velocity gain
    
    # Control input
    F = k_x * x + k_x_dot * x_dot + k_theta * theta + k_theta_dot * theta_dot
    
    # Intermediate terms
    sin_theta = np.sin(theta)
    cos_theta = np.cos(theta)
    
    # Cart acceleration
    x_ddot = (F + m*l*sin_theta*theta_dot**2 - m*g*cos_theta*sin_theta) / (M + m*sin_theta**2)
    
    # Pole angular acceleration
    theta_ddot = (g*sin_theta - cos_theta*x_ddot) / l
    
    return np.array([x_dot, x_ddot, theta_dot, theta_ddot])
```

## Step 3: Define Unsafe Regions

For this example, we have two unsafe regions:
1. Cart position beyond track limits: |x| > 2.0
2. Pole angle beyond safety threshold: |θ| > π/4 (45 degrees)

```python
def unsafe_region(state):
    """
    Determine if state is in unsafe region.
    
    Args:
        state: [x, x_dot, theta, theta_dot]
        
    Returns:
        True if state is unsafe, False otherwise
    """
    x, _, theta, _ = state
    
    # Track limits
    track_limit = 2.0
    if abs(x) > track_limit:
        return True
    
    # Pole angle limit
    angle_limit = np.pi / 4  # 45 degrees
    if abs(theta) > angle_limit:
        return True
    
    return False

# Safe region is complement of unsafe region
def safe_region(state):
    return not unsafe_region(state)
```

## Step 4: Generate Sample Points

```python
# Generate safe and unsafe samples
n_samples = 1000
safe_samples = []
unsafe_samples = []

# Sample points from domain
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
    system_name="cartpole_keepout",
    safe_samples=safe_samples,
    unsafe_samples=unsafe_samples,
    dictionary_type="rbf",  # Radial basis functions
    dictionary_size=150,    # Larger for better accuracy
    domain=domain,
    dynamics_fn=cart_pole_dynamics,
    safe_region=safe_region,
    unsafe_region=unsafe_region,
    options={
        'safe_margin': 0.1,
        'unsafe_margin': 0.1,
        'boundary_margin': 0.1
    }
)

# Verify barrier certificate with SOS
verification_result = agent.verify(
    system_name="cartpole_keepout",
    method="mosek"  # Use Mosek SOS verification if available
)

print(f"Verification result: {verification_result.status}")
if not verification_result.success:
    print(f"Violation reason: {verification_result.violation_reason}")
    print(f"Error code: {verification_result.get_error_code()}")
    
    # Refine if verification fails
    if verification_result.counterexample is not None:
        refined_result = agent.refine_auto(
            system_name="cartpole_keepout",
            max_iterations=5
        )
        print(f"Refined verification result: {refined_result.status}")
```

## Step 6: Visualize Barrier Function

```python
import matplotlib.pyplot as plt
from matplotlib import cm

def visualize_cartpole_barrier():
    # We'll visualize 2D slices of the 4D barrier function
    # Fixing velocity and angular velocity to 0 to focus on position and angle
    
    # Create a grid of position and angle values
    x_range = np.linspace(-3.0, 3.0, 100)
    theta_range = np.linspace(-np.pi/2, np.pi/2, 100)
    X, Theta = np.meshgrid(x_range, theta_range)
    
    # Evaluate barrier function at each point
    B = np.zeros_like(X)
    for i in range(len(x_range)):
        for j in range(len(theta_range)):
            # Fixed velocity and angular velocity at 0
            state = np.array([X[j, i], 0.0, Theta[j, i], 0.0])
            B[j, i] = barrier_fn(state)
    
    # Plot barrier function
    plt.figure(figsize=(10, 8))
    
    # Contour plot of barrier function
    contour = plt.contourf(X, Theta, B, levels=50, cmap=cm.coolwarm)
    plt.colorbar(contour, label='Barrier Function Value')
    
    # Mark unsafe regions
    track_limit = 2.0
    angle_limit = np.pi / 4
    
    # Track limits
    plt.axvline(x=track_limit, color='r', linestyle='--', label='Track Limits')
    plt.axvline(x=-track_limit, color='r', linestyle='--')
    
    # Angle limits
    plt.axhline(y=angle_limit, color='r', linestyle=':', label='Angle Limits')
    plt.axhline(y=-angle_limit, color='r', linestyle=':')
    
    # Add zero level set of barrier function
    barrier_zero = plt.contour(X, Theta, B, levels=[0], colors='k', linewidths=2)
    plt.clabel(barrier_zero, inline=True, fontsize=10, fmt={0: "Barrier=0"})
    
    # Add labels and title
    plt.xlabel('Cart Position (x)')
    plt.ylabel('Pole Angle (θ)')
    plt.title('Cart-Pole Barrier Function (ẋ = 0, θ̇ = 0)')
    plt.legend()
    plt.grid(True)
    
    plt.savefig('cartpole_barrier.png')
    plt.tight_layout()
    plt.show()
    
    # Also visualize in the velocity and angular velocity space
    # Fixing position and angle to specific values
    x_dot_range = np.linspace(-5.0, 5.0, 100)
    theta_dot_range = np.linspace(-8.0, 8.0, 100)
    X_dot, Theta_dot = np.meshgrid(x_dot_range, theta_dot_range)
    
    # Evaluate barrier function at each point
    B_vel = np.zeros_like(X_dot)
    for i in range(len(x_dot_range)):
        for j in range(len(theta_dot_range)):
            # Fixed position at track edge and angle at 0
            state = np.array([1.9, X_dot[j, i], 0.0, Theta_dot[j, i]])
            B_vel[j, i] = barrier_fn(state)
    
    # Plot barrier function in velocity space
    plt.figure(figsize=(10, 8))
    
    # Contour plot of barrier function
    contour = plt.contourf(X_dot, Theta_dot, B_vel, levels=50, cmap=cm.coolwarm)
    plt.colorbar(contour, label='Barrier Function Value')
    
    # Add zero level set of barrier function
    barrier_zero = plt.contour(X_dot, Theta_dot, B_vel, levels=[0], colors='k', linewidths=2)
    plt.clabel(barrier_zero, inline=True, fontsize=10, fmt={0: "Barrier=0"})
    
    # Add labels and title
    plt.xlabel('Cart Velocity (ẋ)')
    plt.ylabel('Pole Angular Velocity (θ̇)')
    plt.title('Cart-Pole Barrier Function (x = 1.9, θ = 0)')
    plt.grid(True)
    
    plt.savefig('cartpole_barrier_velocity.png')
    plt.tight_layout()
    plt.show()

# Call the visualization function
visualize_cartpole_barrier()
```

## Step 7: Safe Controller Implementation

Once we have our verified barrier certificate, we can use it to create a safe controller that enforces the barrier constraints:

```python
def safe_controller(state, nominal_control):
    """
    Barrier-based safe controller for cart-pole.
    
    Args:
        state: Current state [x, x_dot, theta, theta_dot]
        nominal_control: Nominal control input
        
    Returns:
        Safe control input
    """
    # Extract state
    x, x_dot, theta, theta_dot = state
    
    # Check barrier value
    barrier_value = barrier_fn(state)
    
    # If already safe, return nominal control
    if barrier_value > 0.1:
        return nominal_control
    
    # Evaluate gradient of barrier function
    dB_dx = barrier_fn.gradient(state)
    
    # Get dynamics
    dynamics = cart_pole_dynamics(state)
    
    # Physical parameters
    g = 9.81
    m = 0.1
    M = 1.0
    l = 0.5
    
    # Extract current derivatives
    _, x_ddot, _, theta_ddot = dynamics
    
    # Calculate control influence on acceleration
    sin_theta = np.sin(theta)
    cos_theta = np.cos(theta)
    denom = M + m * sin_theta**2
    
    # Influence of control on x_ddot
    dx_ddot_dF = 1.0 / denom
    
    # Influence of control on theta_ddot
    dtheta_ddot_dF = -cos_theta / (l * denom)
    
    # Gradient of dynamics with respect to control
    dfdF = np.array([0, dx_ddot_dF, 0, dtheta_ddot_dF])
    
    # Compute inner product dB/dx * df/dF
    dB_dF = np.dot(dB_dx, dfdF)
    
    # If barrier decreasing condition is satisfied with nominal control, return it
    dB_dt_nominal = np.dot(dB_dx, dynamics)
    if dB_dt_nominal >= 0.1:  # Provide some margin
        return nominal_control
    
    # Otherwise, compute minimum control to make barrier non-decreasing
    # We want: dB/dt >= 0, which means dB/dx * f(x, u) >= 0
    # Solve for u
    if abs(dB_dF) < 1e-6:  # Avoid division by zero
        return nominal_control  # Can't influence barrier with control
    
    # Required inner product value
    required_inner_product = 0.1  # Small positive value for margin
    
    # Compute minimum control value
    min_control = (required_inner_product - dB_dt_nominal) / dB_dF
    
    # Apply minimum deviation from nominal control
    if dB_dF > 0:
        safe_control = max(nominal_control, min_control)
    else:
        safe_control = min(nominal_control, min_control)
    
    return safe_control
```

## Using with ALAN Planner

To use this barrier certificate with the ALAN planner:

```python
from alan_backend.planner.barrier_planner import create_goal_graph_with_safety

# Define distance function
def euclidean_distance(a, b):
    return np.linalg.norm(a - b)

# Create transition model
def get_transition_model(step_size=0.1):
    def transition_model(state):
        transitions = []
        
        # Define possible control inputs
        control_inputs = [-10.0, -5.0, -1.0, 0.0, 1.0, 5.0, 10.0]
        
        for u in control_inputs:
            # Apply safe controller
            safe_u = safe_controller(state, u)
            
            # Apply control to get next state
            state_dot = cart_pole_dynamics(state)
            next_state = state + state_dot * step_size
            
            # Add transition
            # Note: in practice you might want to apply multiple steps of dynamics
            transitions.append((next_state, f"control_{safe_u:.2f}", step_size))
        
        return transitions
    
    return transition_model

# Create safety-aware planner
planner = create_goal_graph_with_safety(
    distance_fn=euclidean_distance,
    transition_model=get_transition_model(),
    barrier_agent=agent,
    system_name="cartpole_keepout"
)

# Define start and goal states
start_state = np.array([0.0, 0.0, 0.1, 0.0])  # Near upright, slightly tilted
goal_state = np.array([1.5, 0.0, 0.0, 0.0])   # Moved to the right, upright

# Plan safe trajectory
# (See barrier_planner.py documentation for full usage)
```

## Command Line Interface

You can also use the ELFIN CLI to work with this barrier:

```bash
# Learn a barrier certificate
elf barrier learn --system cartpole_keepout --data cartpole_samples.json

# Verify with SOS
elf barrier verify --system cartpole_keepout --sos --verbose

# Refinement if needed
elf barrier refine --system cartpole_keepout --max-iterations 5

# Visualize
elf barrier visualize --system cartpole_keepout --slice --save-image
```

## Key Points

1. **Multiple Safety Constraints**: The barrier certificate handles multiple safety constraints simultaneously (track limits and angle limits).

2. **Nonlinear Dynamics**: The cart-pole system has nonlinear dynamics, showcasing the barrier certificate's ability to work with complex systems.

3. **Safe Controller**: The barrier certificate guides the design of a safe controller that intervenes only when necessary to maintain safety.

4. **Formal Verification**: The SOS verification provides mathematical guarantees that the system will remain safe under the verified dynamics and control strategy.

5. **State-Space Visualization**: The barrier function can be visualized to understand the safe operating region in both position-angle and velocity spaces.
