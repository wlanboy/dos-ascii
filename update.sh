#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

IMAGE="registry.gmk.lan/dos-ascii:latest"

echo "==> Baue Image (Dockerfile) ..."
docker build -t dos-ascii .

echo "==> Tagge Image als $IMAGE ..."
docker tag dos-ascii "$IMAGE"

echo "==> Push Image nach $IMAGE ..."
docker push "$IMAGE"

echo "==> Helm-Upgrade dos-ascii ..."
helm upgrade dos-ascii ./dos-ascii-chart -n dos-ascii -f dos-ascii-chart/values-istio.yaml

echo "==> Rollout-Restart dos-ascii ..."
kubectl rollout restart deployment/dos-ascii -n dos-ascii

echo
echo "Fertig."
