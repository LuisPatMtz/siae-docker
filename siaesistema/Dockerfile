# Archivo: /SIAE_DEV/siaesistema/Dockerfile

# --- ETAPA 1: Construcción (Build) ---
# ¡CAMBIO HECHO AQUÍ! Usamos Node 20, como pide Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos package.json
COPY package*.json ./

# Instalamos las dependencias de Node
RUN npm install

# Copiamos el resto del código
COPY . .

# Construimos la aplicación de React para producción
RUN npm run build

# --- ETAPA 2: Servidor (Serve) ---
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]