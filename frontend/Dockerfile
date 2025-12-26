# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---------- Runtime stage (OPENSHIFT SAFE) ----------
FROM registry.access.redhat.com/ubi9/nginx-120

COPY --from=builder /app/dist/frontend/browser /opt/app-root/src

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]


