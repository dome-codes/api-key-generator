# Production stage - uses existing dist folder from environment
FROM nginxinc/nginx-unprivileged:1.29-alpine

# Switch to root to copy files and set permissions
USER root

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