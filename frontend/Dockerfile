# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Fix permissions for OpenShift
RUN chmod -R g+rwX /var/cache/nginx /var/run /usr/share/nginx/html && \
    chgrp -R 0 /var/cache/nginx /var/run /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
