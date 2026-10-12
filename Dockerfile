FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run typecheck && npx tsc -p tsconfig.server.json && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
