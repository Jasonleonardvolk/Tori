# Setting Up a Self-Hosted CUDA Runner for GitHub Actions

This guide walks through the process of setting up a self-hosted GitHub Actions runner with CUDA support for the ELFIN nightly tests.

## Requirements

- Ubuntu 20.04 or higher (recommended)
- NVIDIA GPU with CUDA support
- At least 16GB RAM
- 50GB+ free disk space
- Stable internet connection

## Installation Steps

### 1. Install NVIDIA Drivers and CUDA Toolkit

```bash
# Add NVIDIA package repositories
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-ubuntu2004.pin
sudo mv cuda-ubuntu2004.pin /etc/apt/preferences.d/cuda-repository-pin-600
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda-repo-ubuntu2004-11-8-local_11.8.0-520.61.05-1_amd64.deb
sudo dpkg -i cuda-repo-ubuntu2004-11-8-local_11.8.0-520.61.05-1_amd64.deb
sudo cp /var/cuda-repo-ubuntu2004-11-8-local/cuda-*-keyring.gpg /usr/share/keyrings/
sudo apt-get update
sudo apt-get -y install cuda-11-8

# Set up paths
echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Verify CUDA installation
nvcc --version
```

### 2. Install Python and Dependencies

```bash
# Install Python 3.9
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install -y python3.9 python3.9-dev python3.9-venv

# Create a virtual environment for the runner
mkdir -p ~/elfin-runner
cd ~/elfin-runner
python3.9 -m venv venv
source venv/bin/activate

# Install necessary Python packages
pip install --upgrade pip
pip install numpy torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
pip install pytest pytest-xdist pytest-timeout gurobipy

# Verify PyTorch CUDA support
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda)"
```

### 3. Install GitHub Actions Runner

```bash
# Create a directory for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download the latest runner
curl -o actions-runner-linux-x64-2.304.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.304.0/actions-runner-linux-x64-2.304.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.304.0.tar.gz

# Configure the runner (get token from GitHub repository)
# Replace <TOKEN> with your actual token from GitHub
./config.sh --url https://github.com/your-org/your-repo --token <TOKEN> --labels cuda,gpu,self-hosted --name cuda-runner-1

# Install and start the runner as a service
sudo ./svc.sh install
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

## 4. Configure Environment Variables

Create a `.env` file in the runner's working directory that will be sourced before each job:

```bash
echo '# CUDA and GitHub Actions environment' > ~/actions-runner/.env
echo 'export PATH=/usr/local/cuda-11.8/bin:$PATH' >> ~/actions-runner/.env
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH' >> ~/actions-runner/.env
echo 'export PYTHONPATH=$GITHUB_WORKSPACE' >> ~/actions-runner/.env
```

## 5. Install Gurobi License

For MILP tests that use Gurobi:

1. Register for an academic license at [Gurobi's website](https://www.gurobi.com/academia/academic-program-and-licenses/)
2. Download and save your license file:

```bash
mkdir -p ~/gurobi
# Save your gurobi.lic file to this directory
# Then add to environment
echo 'export GRB_LICENSE_FILE=~/gurobi/gurobi.lic' >> ~/actions-runner/.env
```

## Troubleshooting

### Common Issues

1. **Runner not connecting to GitHub**:
   - Check network connectivity
   - Verify firewall settings
   - Restart the runner service: `sudo ./svc.sh restart`

2. **CUDA not available in Python**:
   - Verify NVIDIA drivers are working: `nvidia-smi`
   - Check that PyTorch is using CUDA: `python -c "import torch; print(torch.cuda.is_available())"`
   - Make sure the CUDA paths are set correctly

3. **GitHub Actions workflow not using the self-hosted runner**:
   - Verify the runner labels match those in the workflow YAML
   - Check if the runner is online in your repository's Settings → Actions → Runners

### Maintenance

- Update CUDA drivers periodically
- Restart the runner weekly to clear cached data
- Monitor disk space to ensure enough free space for workflows

## Security Considerations

Self-hosted runners should be set up with security in mind:

1. Run the runner on a dedicated machine
2. Limit access to the machine to authorized personnel
3. Set up proper firewalls and networking
4. Use repository access tokens with minimal permissions

## Example Runner Script

Create a monitoring script that restarts the runner periodically:

```bash
#!/bin/bash
# runner-monitor.sh

log_file="$HOME/actions-runner/monitor.log"

echo "$(date): Runner monitor starting" >> $log_file

# Check if runner is running
if ! sudo ./svc.sh status | grep "active (running)"; then
  echo "$(date): Runner not running, starting it..." >> $log_file
  sudo ./svc.sh start
fi

# Clear temp files older than 7 days
find $HOME/actions-runner/_work -type f -name "tmp*" -mtime +7 -delete

# Log disk space
df -h >> $log_file

echo "$(date): Monitor check complete" >> $log_file
```

Add this to a weekly crontab:

```bash
crontab -e
# Add this line to run every Sunday at 1:00 AM
0 1 * * 0 bash $HOME/actions-runner/runner-monitor.sh
```

## Additional Resources

- [GitHub Actions Self-Hosted Runners Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [NVIDIA CUDA Installation Guide](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html)
- [PyTorch CUDA Setup](https://pytorch.org/get-started/locally/)
