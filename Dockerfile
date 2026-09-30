FROM node:20-alpine AS base

WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY . .

CMD ["pnpm", "dev"]
