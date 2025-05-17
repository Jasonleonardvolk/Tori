# ALAN 2.x + TORI/Kha Master Makefile
# Provides build, test, and simulation commands for the ALAN system

.PHONY: all sim flash test qa docs bench clean

# Default target
all: sim

# Python environment setup
.python_env:
	@echo "Setting up Python environment..."
	pip install -r alan_backend/requirements.txt
	touch .python_env

# Simulation targets
sim: .python_env
	@echo "Running ALAN simulation..."
	cd alan_backend && python -m core.demo_banksy_alan

# Run individual component demos
sim_oscillator: .python_env
	@echo "Running Banksy oscillator simulation..."
	cd alan_backend && python -c "from core.demo_banksy_alan import run_oscillator_demo; run_oscillator_demo()"

sim_trs: .python_env
	@echo "Running TRS controller simulation..."
	cd alan_backend && python -c "from core.demo_banksy_alan import run_trs_controller_demo; run_trs_controller_demo()"

sim_memory: .python_env
	@echo "Running Hopfield memory simulation..."
	cd alan_backend && python -c "from core.demo_banksy_alan import run_hopfield_memory_demo; run_hopfield_memory_demo()"

sim_full: .python_env
	@echo "Running full ALAN system simulation..."
	cd alan_backend && python -c "from core.demo_banksy_alan import run_full_system_demo; run_full_system_demo()"

# Hardware flash simulation (placeholder for future hardware support)
flash:
	@echo "Simulating hardware flash..."
	@echo "This is a placeholder for future ST-NO-8 board support."
	@echo "When hardware is available, this will flash the spin-torque oscillator board."

# Testing targets
test: .python_env
	@echo "Running ALAN tests..."
	cd alan_backend && python -m pytest core/tests -v

# Quality assurance
qa: .python_env
	@echo "Running code quality checks..."
	cd alan_backend && python -m flake8 core
	cd alan_backend && python -m mypy core
	cd alan_backend && python -m black --check core

# Format code
format: .python_env
	@echo "Formatting code..."
	cd alan_backend && python -m black core

# Documentation
docs: .python_env
	@echo "Building documentation..."
	cd alan_backend && python -m sphinx.cmd.build -b html docs/source docs/build/html

# Benchmarking
bench: .python_env
	@echo "Running benchmarks..."
	cd alan_backend && python -m pytest core/tests/benchmark_*.py -v

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	find . -name "__pycache__" -type d -exec rm -rf {} +
	find . -name "*.pyc" -delete
	find . -name "*.pyo" -delete
	find . -name "*.pyd" -delete
	find . -name ".pytest_cache" -type d -exec rm -rf {} +
	find . -name ".mypy_cache" -type d -exec rm -rf {} +
	rm -f .python_env
	rm -rf alan_backend/docs/build

# Show help
help:
	@echo "ALAN Core Master Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  all        - Default target, runs simulation"
	@echo "  sim        - Run full simulation demo"
	@echo "  sim_oscillator - Run oscillator component demo"
	@echo "  sim_trs    - Run TRS controller component demo"
	@echo "  sim_memory - Run Hopfield memory component demo"
	@echo "  sim_full   - Run full system demo"
	@echo "  flash      - Simulate hardware flash (placeholder)"
	@echo "  test       - Run tests"
	@echo "  qa         - Run code quality checks"
	@echo "  format     - Format code with black"
	@echo "  docs       - Build documentation"
	@echo "  bench      - Run benchmarks"
	@echo "  clean      - Clean build artifacts"
	@echo "  help       - Show this help message"
