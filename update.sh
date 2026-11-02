#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Registry per Parameter wählbar:
#   ./update.sh            -> registry.gmk.lan
#   ./update.sh localhost  -> localhost:5001
#   ./update.sh <host:port>
case "${1:-}" in
  "")        REGISTRY="registry.gmk.lan" ;;
  localhost) REGISTRY="localhost:5001" ;;
  *)         REGISTRY="$1" ;;
esac

IMAGE="$REGISTRY/dos-ascii:latest"

echo "==> Baue Image (Dockerfile) ..."
docker build -t dos-ascii .

echo "==> Tagge Image als $IMAGE ..."
docker tag dos-ascii "$IMAGE"

echo "==> Push Image nach $IMAGE ..."
docker push "$IMAGE"

echo "==> Namespace dos-ascii mit Istio-Sidecar-Injection ..."
kubectl create namespace dos-ascii --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace dos-ascii istio-injection=enabled --overwrite

echo "==> Helm-Upgrade/Install dos-ascii ..."
helm upgrade --install dos-ascii ./dos-ascii-chart -n dos-ascii \
  -f dos-ascii-chart/values-istio.yaml \
  --set image.repository="$REGISTRY/dos-ascii"

echo "==> Rollout-Restart dos-ascii ..."
kubectl rollout restart deployment/dos-ascii -n dos-ascii

echo
echo "Fertig."
