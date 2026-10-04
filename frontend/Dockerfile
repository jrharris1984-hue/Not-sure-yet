FROM node:20-alpine

WORKDIR /app

# No yarn.lock is tracked in this repository. Install the dependencies
# and resolutions specified in package.json during the dependency layer.
COPY package.json ./
RUN yarn install --network-timeout 600000

COPY . .

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true

CMD ["yarn", "start"]
