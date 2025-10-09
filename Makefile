# Makefile for API Key Generator

.PHONY: build scan scan-local scan-ci clean

# Build Docker image
build:
	docker build -t api-key-generator:latest .

# Run Trivy scan locally
scan-local: build
	trivy image --format table --ignorefile .trivyignore api-key-generator:latest

# Run Trivy scan for CI (exit code 1 on vulnerabilities)
scan-ci: build
	trivy image --format table --ignorefile .trivyignore --exit-code 1 --severity HIGH,CRITICAL api-key-generator:latest

# Run Trivy scan with SARIF output
scan-sarif: build
	trivy image --format sarif --ignorefile .trivyignore --output trivy-results.sarif api-key-generator:latest

# Clean up Docker images
clean:
	docker rmi api-key-generator:latest || true

# Install Trivy locally (macOS)
install-trivy:
	brew install trivy

# Install Trivy locally (Linux)
install-trivy-linux:
	sudo apt-get update
	sudo apt-get install wget apt-transport-https gnupg lsb-release
	wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
	echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
	sudo apt-get update
	sudo apt-get install trivy
