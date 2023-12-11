ARG BUILDER_IMAGE="node:20-bullseye"
ARG RUNNER_IMAGE="node:20-alpine"

FROM ${BUILDER_IMAGE} as builder

RUN corepack enable

COPY package.json pnpm-lock.yaml /opt/
RUN cd /opt && pnpm install --frozen-lockfile

COPY ./ /opt

RUN cd /opt/ && pnpm artifact

FROM ${RUNNER_IMAGE}

WORKDIR "/app"
RUN chown nobody /app

# Only copy the final release from the build stage
COPY --from=builder --chown=nobody:root /opt/artifact/main.mjs* ./artifact/
COPY --chown=nobody:root static/ ./static
COPY --chown=nobody:root views/ ./views

USER nobody

WORKDIR /app
EXPOSE 4000
ENTRYPOINT ["node", "--enable-source-maps", "--stack-trace-limit=1000", "artifact/main.mjs"]
