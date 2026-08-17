FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install ALL deps (incl. devDependencies) so tsc / prisma CLI are available
# for the build step below. --only=production would omit them and break `tsc`.
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Now that dist/ is compiled, drop devDependencies to slim the runtime image.
RUN npm prune --omit=dev

EXPOSE 3001
CMD ["node", "dist/server.js"]
