
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html


# Fix permissions for OpenShift
RUN chmod -R g+rwX /var/cache/nginx /var/run /usr/share/nginx/html && \
    chgrp -R 0 /var/cache/nginx /var/run /usr/share/nginx/html


EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

