# -------- Build stage --------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# -------- Runtime stage (OpenShift safe) --------
FROM registry.access.redhat.com/ubi9/nginx-120

# Copy Angular build output
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# OpenShift expects non-root & non-privileged port
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
