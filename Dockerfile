ARG BUILDER_IMAGE="node:22-bullseye"
ARG RUNNER_IMAGE="node:22-alpine"

FROM ${BUILDER_IMAGE} as builder

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /opt/
COPY packages/app/package.json /opt/packages/app/
COPY packages/examples/package.json /opt/packages/examples/
RUN cd /opt && pnpm install --frozen-lockfile

COPY ./ /opt

RUN cd /opt/packages/app/ && pnpm artifact

FROM ${RUNNER_IMAGE}

WORKDIR "/app"
RUN chown nobody /app

# Only copy the final release from the build stage
COPY --from=builder --chown=nobody:root /opt/packages/app/artifact/main.mjs* ./artifact/
COPY --chown=nobody:root ./packages/app/static/ ./static
COPY --chown=nobody:root ./packages/app/views/ ./views

USER nobody

WORKDIR /app
EXPOSE 4000
ENTRYPOINT ["node", "--enable-source-maps", "--stack-trace-limit=1000", "artifact/main.mjs"]
