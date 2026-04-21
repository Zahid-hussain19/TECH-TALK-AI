# STAGE 1: Build robust production artifact
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Enforce native optimization build
RUN npm run build

# STAGE 2: Deliver via NGINX Server securely
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Establish Single Page Application (SPA) routing protocol fallback via proxy
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
