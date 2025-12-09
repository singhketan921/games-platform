FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies separately to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY . .

EXPOSE 3000
CMD ["node", "app.js"]
