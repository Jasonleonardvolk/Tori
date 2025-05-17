# 2D Swarm Collision Avoidance Safety Recipe

This recipe demonstrates how to create and verify barrier certificates for a multi-agent swarm system to ensure collision avoidance between agents. The barrier certificates create a safety envelope around each agent that prevents collisions while allowing coordinated movement.

## System Description

Consider a swarm of agents moving in a 2D space. Each agent has:
- Position coordinates (x, y)
- Velocity components (vx, vy)

The safety requirement is straightforward: no two agents should collide (come within a minimum distance of each other).

![Swarm System](../images/swarm_collision_avoid.png)

## Step 1: Define the System for a Single Agent Pair

We'll start by focusing on the pairwise interaction between two agents. The state vector will combine both agents' states:

```python
import numpy as np
import matplotlib.pyplot as plt
from alan_backend.elfin.barrier.barrier_bridge_agent import BarrierBridgeAgent

# Create agent
agent = BarrierBridgeAgent(
    name="swarm_barrier",
    auto_verify=True
)

# State dimension for a pair of agents
# [x1, y1, vx1, vy1, x2, y2, vx2, vy2]
state_dim = 8

# Define domain bounds
v_max = 2.0  # Maximum velocity
pos_limit = 10.0  # Position limits
domain = (
    np.array([-pos_limit, -pos_limit, -v_max, -v_max, -pos_limit, -pos_limit, -v_max, -v_max]),  # Lower bounds
    np.array([pos_limit, pos_limit, v_max, v_max, pos_limit, pos_limit, v_max, v_max])           # Upper bounds
)
```

## Step 2: Define the Safety Specification

The unsafe region is when two agents are too close to each other:

```python
# Define safety parameters
safety_distance = 1.0  # Minimum safe distance between agents

def unsafe_region(state):
    """
    Determine if the state represents an unsafe configuration
    where two agents are too close to each other.
    
    Args:
        state: [x1, y1, vx1, vy1, x2, y2, vx2, vy2]
        
    Returns:
        True if unsafe (agents too close), False otherwise
    """
    # Extract positions
    x1, y1 = state[0], state[1]
    x2, y2 = state[4], state[5]
    
    # Calculate distance between agents
    distance = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    
    # Unsafe if distance is less than safety threshold
    return distance < safety_distance

# Safe region is the complement of unsafe region
def safe_region(state):
    return not unsafe_region(state)
```

## Step 3: Define Swarm Dynamics

We'll use a simple double integrator model for each agent with a distributed controller for coordination:

```python
def swarm_dynamics(state):
    """
    Double integrator dynamics with repulsive forces for collision avoidance.
    
    The dynamics are:
    ẋᵢ = vᵢ
    v̇ᵢ = uᵢ
    
    where uᵢ includes a repulsive term based on relative positions.
    
    Args:
        state: [x1, y1, vx1, vy1, x2, y2, vx2, vy2]
        
    Returns:
        State derivatives: [vx1, vy1, ax1, ay1, vx2, vy2, ax2, ay2]
    """
    # Extract positions and velocities
    x1, y1, vx1, vy1 = state[0:4]
    x2, y2, vx2, vy2 = state[4:8]
    
    # Calculate distance between agents
    dx = x2 - x1
    dy = y2 - y1
    distance = np.sqrt(dx**2 + dy**2)
    
    # Normalized direction vector
    if distance < 1e-6:  # Avoid division by zero
        nx, ny = 1.0, 0.0  # Arbitrary direction if agents are at the same position
    else:
        nx, ny = dx / distance, dy / distance
    
    # Parameters for the repulsive force
    k_rep = 5.0  # Repulsion gain
    d_rep = 3.0  # Repulsion activation distance
    
    # Calculate repulsive force magnitude (increases as distance decreases)
    if distance < d_rep:
        f_rep = k_rep * (1.0 / distance - 1.0 / d_rep) * (1.0 / distance**2)
    else:
        f_rep = 0.0
    
    # Control inputs with repulsive forces
    # Agent 1 experiences repulsive force in the negative direction
    u1x = -f_rep * nx
    u1y = -f_rep * ny
    
    # Agent 2 experiences repulsive force in the positive direction
    u2x = f_rep * nx
    u2y = f_rep * ny
    
    # Add damping terms to stabilize velocities
    k_damp = 0.5
    u1x -= k_damp * vx1
    u1y -= k_damp * vy1
    u2x -= k_damp * vx2
    u2y -= k_damp * vy2
    
    # Return state derivatives
    return np.array([vx1, vy1, u1x, u1y, vx2, vy2, u2x, u2y])
```

## Step 4: Generate Sample Points

Generate a set of safe and unsafe configurations for learning the barrier certificate:

```python
# Generate safe and unsafe samples
n_samples = 1000
safe_samples = []
unsafe_samples = []

# Generate samples
for _ in range(n_samples * 3):  # Oversample to ensure enough points
    # Generate random state
    state = np.random.uniform(domain[0], domain[1])
    
    # Check if safe or unsafe
    if unsafe_region(state):
        unsafe_samples.append(state)
    else:
        safe_samples.append(state)
    
    # Break if we have enough samples
    if len(safe_samples) >= n_samples and len(unsafe_samples) >= n_samples:
        break

# Ensure we have exactly n_samples of each
safe_samples = np.array(safe_samples[:n_samples])
unsafe_samples = np.array(unsafe_samples[:n_samples])
```

## Step 5: Learn and Verify Barrier Certificate

Learn the barrier certificate that guarantees collision avoidance:

```python
# Learn barrier certificate
barrier_fn = agent.learn_barrier(
    system_name="swarm_collision_avoid",
    safe_samples=safe_samples,
    unsafe_samples=unsafe_samples,
    dictionary_type="rbf",  # Radial basis functions
    dictionary_size=200,    # Larger for better accuracy
    domain=domain,
    dynamics_fn=swarm_dynamics,
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
    system_name="swarm_collision_avoid",
    method="mosek"  # Use Mosek SOS verification if available
)

print(f"Verification result: {verification_result.status}")
if not verification_result.success:
    print(f"Violation reason: {verification_result.violation_reason}")
    print(f"Error code: {verification_result.get_error_code()}")
    
    # Refine if verification fails
    if verification_result.counterexample is not None:
        refined_result = agent.refine_auto(
            system_name="swarm_collision_avoid",
            max_iterations=5
        )
        print(f"Refined verification result: {refined_result.status}")
```

## Step 6: Visualize Barrier Function

```python
def visualize_barrier():
    """Visualize the barrier function in position space."""
    # Create a grid of positions for agent 2, fixing agent 1 at origin
    resolution = 100
    x_range = np.linspace(-5, 5, resolution)
    y_range = np.linspace(-5, 5, resolution)
    X, Y = np.meshgrid(x_range, y_range)
    B = np.zeros_like(X)
    
    # Fix agent 1 at origin with zero velocity
    x1, y1, vx1, vy1 = 0.0, 0.0, 0.0, 0.0
    
    # Fix agent 2's velocity to zero
    vx2, vy2 = 0.0, 0.0
    
    # Evaluate barrier function at each position
    for i in range(resolution):
        for j in range(resolution):
            x2, y2 = X[i, j], Y[i, j]
            state = np.array([x1, y1, vx1, vy1, x2, y2, vx2, vy2])
            B[i, j] = barrier_fn(state)
    
    # Plot barrier function
    plt.figure(figsize=(10, 8))
    
    # Contour plot
    contour = plt.contourf(X, Y, B, levels=50, cmap='coolwarm')
    plt.colorbar(contour, label='Barrier Function Value')
    
    # Add zero level set (boundary between safe and unsafe)
    zero_contour = plt.contour(X, Y, B, levels=[0], colors='k', linewidths=2)
    plt.clabel(zero_contour, inline=True, fontsize=10, fmt={0: 'B(x)=0'})
    
    # Draw safety distance circle
    theta = np.linspace(0, 2*np.pi, 100)
    plt.plot(safety_distance * np.cos(theta), safety_distance * np.sin(theta), 
             'r--', linewidth=2, label=f'Safety Distance ({safety_distance} units)')
    
    # Add agent 1 marker
    plt.plot(0, 0, 'ko', markersize=10, label='Agent 1')
    
    # Add labels and title
    plt.xlabel('Agent 2 x-position relative to Agent 1')
    plt.ylabel('Agent 2 y-position relative to Agent 1')
    plt.title('Swarm Collision Avoidance Barrier Function')
    plt.grid(True)
    plt.legend()
    plt.axis('equal')
    
    plt.savefig('swarm_barrier.png')
    plt.tight_layout()
    plt.show()

    # Also visualize in velocity space for approaching agents
    # Fix positions close to collision boundary
    x1, y1 = 0.0, 0.0
    x2, y2 = safety_distance * 1.05, 0.0  # Just outside safety distance
    
    # Create a grid of velocities for agent 2
    vx_range = np.linspace(-v_max, v_max, resolution)
    vy_range = np.linspace(-v_max, v_max, resolution)
    VX, VY = np.meshgrid(vx_range, vy_range)
    B_vel = np.zeros_like(VX)
    
    # Fix agent 1's velocity to zero
    vx1, vy1 = 0.0, 0.0
    
    # Evaluate barrier function at each velocity
    for i in range(resolution):
        for j in range(resolution):
            vx2, vy2 = VX[i, j], VY[i, j]
            state = np.array([x1, y1, vx1, vy1, x2, y2, vx2, vy2])
            B_vel[i, j] = barrier_fn(state)
    
    # Plot velocity barrier
    plt.figure(figsize=(10, 8))
    
    # Contour plot
    contour = plt.contourf(VX, VY, B_vel, levels=50, cmap='coolwarm')
    plt.colorbar(contour, label='Barrier Function Value')
    
    # Add zero level set
    zero_contour = plt.contour(VX, VY, B_vel, levels=[0], colors='k', linewidths=2)
    plt.clabel(zero_contour, inline=True, fontsize=10, fmt={0: 'B(x)=0'})
    
    # Add velocity arrow indicating approaching motion
    plt.arrow(0, 0, -1, 0, head_width=0.1, head_length=0.2, fc='r', ec='r',
              label='Approaching Direction')
    
    # Add labels and title
    plt.xlabel('Agent 2 x-velocity')
    plt.ylabel('Agent 2 y-velocity')
    plt.title('Barrier Function in Velocity Space\n(Agents at Distance = {:.2f})'.format(safety_distance * 1.05))
    plt.grid(True)
    
    plt.savefig('swarm_barrier_velocity.png')
    plt.tight_layout()
    plt.show()

# Call visualization function
visualize_barrier()
```

## Step 7: Implement a Barrier-Based Safe Controller

```python
def safe_controller(state, nominal_control):
    """
    Safe controller that enforces the barrier constraint for collision avoidance.
    
    Args:
        state: [x1, y1, vx1, vy1, x2, y2, vx2, vy2]
        nominal_control: [u1x, u1y, u2x, u2y] - nominal control inputs for both agents
        
    Returns:
        Safe control inputs that respect the barrier constraint
    """
    # Evaluate barrier function
    barrier_value = barrier_fn(state)
    
    # If safely inside the safe set, return nominal control
    if barrier_value > 0.1:
        return nominal_control
    
    # Extract positions and velocities
    x1, y1, vx1, vy1 = state[0:4]
    x2, y2, vx2, vy2 = state[4:8]
    
    # Calculate relative position and velocity
    dx = x2 - x1
    dy = y2 - y1
    dvx = vx2 - vx1
    dvy = vy2 - vy1
    
    # Calculate distance
    distance = np.sqrt(dx**2 + dy**2)
    
    # Normalized direction
    if distance < 1e-6:
        nx, ny = 1.0, 0.0  # Arbitrary direction if agents are at the same position
    else:
        nx, ny = dx / distance, dy / distance
    
    # Check if agents are moving toward each other along the connecting line
    relative_velocity_projection = dvx * nx + dvy * ny
    
    # If not approaching, return nominal control
    if relative_velocity_projection >= 0:
        return nominal_control
    
    # Calculate gradient of barrier function
    dB_dx = barrier_fn.gradient(state)
    
    # Compute Lie derivative (time derivative of barrier along system trajectory)
    # dB/dt = ∇B · f(x, u)
    dynamics = swarm_dynamics(state)
    dB_dt = np.dot(dB_dx, dynamics)
    
    # If barrier is already non-decreasing, return nominal control
    if dB_dt >= 0.0:
        return nominal_control
    
    # Calculate control influence on barrier function
    # We need to find how control affects dB/dt
    # ∇B · (∂f/∂u)
    
    # For a double integrator, the control directly affects acceleration
    # Control 1 affects [a1x, a1y], indexed at 2, 3
    # Control 2 affects [a2x, a2y], indexed at 6, 7
    dB_du1x = dB_dx[2]
    dB_du1y = dB_dx[3]
    dB_du2x = dB_dx[6]
    dB_du2y = dB_dx[7]
    
    # Extract nominal control
    u1x_nom, u1y_nom, u2x_nom, u2y_nom = nominal_control
    
    # Compute control QP to minimize deviation from nominal control
    # while enforcing barrier constraint
    import cvxpy as cp
    
    # Control variables
    u1x = cp.Variable()
    u1y = cp.Variable()
    u2x = cp.Variable()
    u2y = cp.Variable()
    
    # Objective: minimize squared deviation from nominal control
    objective = cp.Minimize((u1x - u1x_nom)**2 + (u1y - u1y_nom)**2 + 
                           (u2x - u2x_nom)**2 + (u2y - u2y_nom)**2)
    
    # Constraint: barrier derivative must be non-negative
    # dB/dt + ∇B · (∂f/∂u) · (u - u_nominal) >= 0
    constraints = [
        dB_dt + dB_du1x * (u1x - u1x_nom) + dB_du1y * (u1y - u1y_nom) + 
        dB_du2x * (u2x - u2x_nom) + dB_du2y * (u2y - u2y_nom) >= 0.1  # Small positive for robustness
    ]
    
    # Control limits
    u_max = 10.0  # Maximum control value
    constraints += [
        u1x >= -u_max, u1x <= u_max,
        u1y >= -u_max, u1y <= u_max,
        u2x >= -u_max, u2x <= u_max,
        u2y >= -u_max, u2y <= u_max
    ]
    
    # Solve QP
    prob = cp.Problem(objective, constraints)
    try:
        prob.solve()
        
        if prob.status in ["optimal", "optimal_inaccurate"]:
            return np.array([u1x.value, u1y.value, u2x.value, u2y.value])
        else:
            # If QP fails, use a simple fallback: maximum repulsive control
            u1x_safe = -u_max * nx
            u1y_safe = -u_max * ny
            u2x_safe = u_max * nx
            u2y_safe = u_max * ny
            return np.array([u1x_safe, u1y_safe, u2x_safe, u2y_safe])
    except:
        # QP solver failed, use simple fallback
        u1x_safe = -u_max * nx
        u1y_safe = -u_max * ny
        u2x_safe = u_max * nx
        u2y_safe = u_max * ny
        return np.array([u1x_safe, u1y_safe, u2x_safe, u2y_safe])
```

## Step 8: Simulating a Swarm with Barrier Certificates

For a larger swarm, we can apply the pairwise barrier certificates to each pair of agents:

```python
def simulate_swarm(n_agents=5, time_steps=1000, dt=0.05):
    """
    Simulate a swarm of agents with barrier-based collision avoidance.
    
    Args:
        n_agents: Number of agents in the swarm
        time_steps: Number of simulation steps
        dt: Time step size
        
    Returns:
        Trajectories of all agents
    """
    # Initialize agent states: [x, y, vx, vy]
    states = np.zeros((n_agents, 4))
    
    # Place agents in a circle initially
    radius = 5.0
    for i in range(n_agents):
        angle = 2 * np.pi * i / n_agents
        states[i, 0] = radius * np.cos(angle)  # x
        states[i, 1] = radius * np.sin(angle)  # y
    
    # Initialize trajectories: [time_steps, n_agents, 4]
    trajectories = np.zeros((time_steps, n_agents, 4))
    trajectories[0] = states
    
    # Simulation loop
    for t in range(1, time_steps):
        # Store current state
        trajectories[t] = states
        
        # Calculate control inputs for each agent
        controls = np.zeros((n_agents, 2))
        
        # Base goal-seeking behavior: move toward origin with some damping
        for i in range(n_agents):
            x, y, vx, vy = states[i]
            
            # Simple goal-seeking: proportional control to origin with damping
            k_p = 0.5  # Position gain
            k_d = 1.0  # Damping gain
            
            controls[i, 0] = -k_p * x - k_d * vx  # u_x
            controls[i, 1] = -k_p * y - k_d * vy  # u_y
        
        # Apply pairwise barrier certificates
        for i in range(n_agents):
            for j in range(i + 1, n_agents):
                # Extract pairwise state
                x1, y1, vx1, vy1 = states[i]
                x2, y2, vx2, vy2 = states[j]
                pairwise_state = np.array([x1, y1, vx1, vy1, x2, y2, vx2, vy2])
                
                # Get nominal controls for the pair
                u1x, u1y = controls[i]
                u2x, u2y = controls[j]
                nominal_control = np.array([u1x, u1y, u2x, u2y])
                
                # Apply barrier-based safe control
                safe_control = safe_controller(pairwise_state, nominal_control)
                
                # Update controls
                controls[i, 0] = safe_control[0]  # u1x
                controls[i, 1] = safe_control[1]  # u1y
                controls[j, 0] = safe_control[2]  # u2x
                controls[j, 1] = safe_control[3]  # u2y
        
        # Update states with dynamics
        for i in range(n_agents):
            x, y, vx, vy = states[i]
            ux, uy = controls[i]
            
            # Simple double integrator dynamics
            x_new = x + vx * dt
            y_new = y + vy * dt
            vx_new = vx + ux * dt
            vy_new = vy + uy * dt
            
            states[i] = np.array([x_new, y_new, vx_new, vy_new])
    
    return trajectories

# Run simulation
trajectories = simulate_swarm(n_agents=5, time_steps=1000, dt=0.05)

# Visualize simulation results
def visualize_simulation(trajectories):
    """Visualize the swarm simulation results."""
    time_steps, n_agents, _ = trajectories.shape
    
    # Create figure
    plt.figure(figsize=(10, 10))
    
    # Plot final positions
    for i in range(n_agents):
        x = trajectories[:, i, 0]
        y = trajectories[:, i, 1]
        
        # Plot trajectory with alpha fade
        plt.plot(x, y, '-', linewidth=1, alpha=0.5)
        
        # Plot start position
        plt.plot(x[0], y[0], 'go', markersize=8)
        
        # Plot final position
        plt.plot(x[-1], y[-1], 'ro', markersize=8)
    
    # Plot safety distance circles around final positions
    for i in range(n_agents):
        x = trajectories[-1, i, 0]
        y = trajectories[-1, i, 1]
        
        theta = np.linspace(0, 2*np.pi, 100)
        safety_circle_x = x + safety_distance * np.cos(theta)
        safety_circle_y = y + safety_distance * np.sin(theta)
        plt.plot(safety_circle_x, safety_circle_y, 'r--', linewidth=1, alpha=0.3)
    
    # Add labels
    plt.xlabel('X Position')
    plt.ylabel('Y Position')
    plt.title('Swarm Trajectory with Barrier-Based Collision Avoidance')
    plt.grid(True)
    plt.axis('equal')
    
    plt.savefig('swarm_simulation.png')
    plt.tight_layout()
    plt.show()
    
    # Also create an animation (frames at different time steps)
    from matplotlib.animation import FuncAnimation
    
    fig, ax = plt.subplots(figsize=(10, 10))
    
    def animate(frame):
        ax.clear()
        
        # Plot trajectories up to current frame
        for i in range(n_agents):
            x = trajectories[:frame+1, i, 0]
            y = trajectories[:frame+1, i, 1]
            
            # Plot trajectory
            ax.plot(x, y, '-', linewidth=1, alpha=0.5)
            
            # Plot current position
            ax.plot(x[-1], y[-1], 'bo', markersize=8)
            
            # Plot safety circle
            theta = np.linspace(0, 2*np.pi, 100)
            safety_circle_x = x[-1] + safety_distance * np.cos(theta) / 2
            safety_circle_y = y[-1] + safety_distance * np.sin(theta) / 2
            ax.plot(safety_circle_x, safety_circle_y, 'r--', linewidth=1, alpha=0.3)
        
        ax.grid(True)
        ax.set_xlim(-8, 8)
        ax.set_ylim(-8, 8)
        ax.set_xlabel('X Position')
        ax.set_ylabel('Y Position')
        ax.set_title(f'Swarm Simulation (t = {frame * dt:.2f}s)')
        
        return []
    
    # Create animation (save frames every 10 steps)
    frame_interval = 10
    frames = range(0, time_steps, frame_interval)
    animation = FuncAnimation(fig, animate, frames=frames, interval=20, blit=True)
    
    # Save animation
    animation.save('swarm_animation.gif', writer='pillow', fps=30)
    
    print("Animation saved as 'swarm_animation.gif'")

# Visualize the simulation
visualize_simulation(trajectories)
```

## Using with ALAN Planner

To use this barrier certificate with the ALAN planner for multi-agent planning:

```python
from alan_backend.planner.barrier_planner import create_goal_graph_with_safety

# For each agent pair, create a separate barrier guard
def create_pairwise_barrier_guards(agents, barrier_agent):
    """Create barrier guards for all agent pairs."""
    guards = []
    
    for i in range(len(agents)):
        for j in range(i+1, len(agents)):
            # Create a barrier guard for this agent pair
            def guard_fn(src_node, dst_node, i=i, j=j):
                # Extract states for both agents
                agent_i_src = src_node.state[i*4:(i+1)*4]
                agent_j_src = src_node.state[j*4:(j+1)*4]
                agent_i_dst = dst_node.state[i*4:(i+1)*4]
                agent_j_dst = dst_node.state[j*4:(j+1)*4]
                
                # Create combined state vector
                combined_state = np.zeros(8)
                combined_state[0:4] = agent_i_dst
                combined_state[4:8] = agent_j_dst
                
                # Check barrier function
                barrier_value = barrier_agent.results["swarm_collision_avoid"]["barrier"](combined_state)
                
                # Return True if safe (barrier positive)
                return barrier_value >= 0
            
            guards.append(guard_fn)
    
    return guards

# Example of using pairwise barriers in a planner
def create_swarm_planner(agents, barrier_agent):
    # Create distance function for the multi-agent state
    def distance_fn(a, b):
        return np.linalg.norm(a - b)
    
    # Create transition model for all agents
    def transition_model(state):
        # ... (implementation depends on swarm control strategy)
        pass
    
    # Create a planner
    planner = create_goal_graph_with_safety(
        distance_fn=distance_fn,
        transition_model=transition_model,
        barrier_agent=barrier_agent,
        system_name="swarm_collision_avoid"
    )
    
    # Add all pairwise guards
    for guard in create_pairwise_barrier_guards(agents, barrier_agent):
        planner.add_custom_guard(guard)
    
    return planner
```

## Command Line Interface

You can also use the ELFIN CLI to work with this barrier:

```bash
# Learn a barrier certificate
elf barrier learn --system swarm_collision_avoid --data swarm_samples.json

# Verify with SOS
elf barrier verify --system swarm_collision_avoid --sos --verbose

# Refine if needed
elf barrier refine --system swarm_collision_avoid --max-iterations 5

# Visualize
elf barrier visualize --system swarm_collision_avoid --slice --save-image
```

## Key Points

1. **Pairwise Certificates**: The barrier approach works by creating pairwise barrier functions between each pair of agents, which scales well to large swarms.

2. **QP-Based Safe Control**: The safe controller uses quadratic programming to find minimum-correction control actions that ensure safety.

3. **Composition**: Multiple barrier certificates can be composed to handle different safety requirements (e.g., collision avoidance plus environment boundaries).

4. **Formal Guarantees**: The verification approach provides formal guarantees that the swarm will maintain the minimum safety distance.

5. **Efficiency**: The approach is computationally efficient, making it suitable for real-time applications on resource-constrained platforms.
