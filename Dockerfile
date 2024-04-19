FROM node:19-bullseye
WORKDIR /my-chat

COPY ["package.json", "./package.json"]
COPY ["turbo.json", "./turbo.json"]
COPY ["yarn.lock", "./yarn.lock"]
COPY ["tsconfig.json", "./tsconfig.json"]
COPY ["packages/prisma-db", "./packages/prisma-db"]
COPY ["packages/typescript-config", "./packages/typescript-config"]
COPY ["packages/eslint-config", "./packages/eslint-config"]
COPY ["packages/backend-api", "./packages/backend-api"]

RUN yarn install
RUN cd /my-chat/packages/prisma-db
RUN yarn prisma generate

EXPOSE 3001

WORKDIR /my-chat/packages/backend-api

CMD yarn start