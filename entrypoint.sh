#!/bin/sh

# Docker Entrypoint Script
# This script replaces placeholder values in the built Vue.js application
# with actual environment variables at runtime.

set -e

echo "🚀 Starting Vue.js application with environment variable replacement..."

# Define the directory where the built files are located
BUILD_DIR="/usr/share/nginx/html"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory $BUILD_DIR not found!"
    exit 1
fi

echo "📁 Found build directory: $BUILD_DIR"

# Function to replace placeholders in files
replace_placeholder() {
    placeholder=$1
    env_var=$2
    eval "value=\$$env_var"
    
    if [ -n "$value" ]; then
        echo "🔄 Replacing $placeholder with $env_var value..."
        find "$BUILD_DIR" -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) -exec sed -i "s|$placeholder|$value|g" {} \;
    else
        echo "⚠️  Warning: Environment variable $env_var is not set, keeping placeholder $placeholder"
    fi
}

# Replace all placeholders with actual environment variables
replace_placeholder "__VITE_USE_MOCK_AUTH__" "VITE_USE_MOCK_AUTH"
replace_placeholder "__VITE_APP_BASE_PATH__" "VITE_APP_BASE_PATH"
replace_placeholder "__VITE_API_BASE_URL__" "VITE_API_BASE_URL"
replace_placeholder "__VITE_KEYCLOAK_URL__" "VITE_KEYCLOAK_URL"
replace_placeholder "__VITE_KEYCLOAK_REALM__" "VITE_KEYCLOAK_REALM"
replace_placeholder "__VITE_KEYCLOAK_CLIENT_ID__" "VITE_KEYCLOAK_CLIENT_ID"

echo "✅ Environment variable replacement completed!"

# Start nginx in the foreground
echo "🌐 Starting nginx..."
exec nginx -g "daemon off;" 