FROM golang:1.24-alpine AS builder-backend

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY main.go ./
RUN go build -o deaddrop main.go

FROM node:20-alpine AS builder-frontend

WORKDIR /web

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY web/ ./
RUN pnpm i && pnpm build

FROM gcr.io/distroless/static-debian11

WORKDIR /app

COPY --from=builder-backend /app/deaddrop /app/deaddrop
COPY --from=builder-frontend /web/dist /app/web/dist

ENTRYPOINT ["/app/deaddrop"]

