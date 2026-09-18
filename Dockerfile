FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG BETTER_AUTH_SECRET
ARG POSTGRES_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV POSTGRES_URL=$POSTGRES_URL
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "build"]
