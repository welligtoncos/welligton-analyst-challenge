# Build da SPA Angular (produção) + Nginx com proxy /api → API FastAPI
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine

COPY nginx-docker.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/app_frontend_analytst-challenge/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
