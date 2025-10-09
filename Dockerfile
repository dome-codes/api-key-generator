# Production stage - uses existing dist folder from environment
FROM nginxinc/nginx-unprivileged:1.31-alpine

# Switch to root to update packages and copy files
USER root

# Update packages to fix security vulnerabilities
RUN apk update && apk upgrade && apk add --no-cache \
    libxml2-dev \
    && rm -rf /var/cache/apk/*

# Copy existing dist folder from environment
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown nginx:nginx /entrypoint.sh

# Set correct ownership for all files
RUN chown -R nginx:nginx /usr/share/nginx/html

# Switch back to nginx user
USER nginx

# Expose port 80
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"] 