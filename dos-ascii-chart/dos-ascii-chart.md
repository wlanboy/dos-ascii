# Helm Chart: dos-ascii

Helm Chart für das Deployment des `dos-ascii`-Containers in Kubernetes.
Der Chart unterstützt wahlweise Istio (Standard) oder Traefik als Ingress-Weg,
gesteuert über den Schalter `ingress.controller`.

## Komponenten

- **Deployment** (`templates/deployment.yaml`) – `replicaCount` Replicas von `registry.gmk.lan/dos-ascii`, Startup-, Liveness- und Readiness-Probe auf `probes.path` (Default `/fonts`, die App hat keinen eigenen Health-Endpoint), gehärteter `securityContext` (non-root, read-only Root-FS, keine Capabilities) und ein kleines `emptyDir` für `/tmp`.
- **PodDisruptionBudget** (`templates/pdb.yaml`, nur bei `podDisruptionBudget.enabled: true` und `replicaCount > 1`).
- **Service** (`templates/service.yaml`) – ClusterIP-Service auf Port 2000.
- **Gateway** / **VirtualService** (nur bei `ingress.controller: istio`) – Istio-Routing, HTTPS zusätzlich bei `certManager.enabled: true`.
- **EnvoyFilter** (`templates/envoyfilter.yaml`, nur bei `ingress.controller: istio`) – Buffer-Filter im Sidecar des Pods, lehnt Bodies über `ingress.maxRequestBodyBytes` mit 413 ab.
- **IngressRoute** (nur bei `ingress.controller: traefik`) – Traefik-Routing der konfigurierten Hosts.
- **Middleware** (`templates/traefik-middleware.yaml`, nur bei `ingress.controller: traefik`) – Buffering-Middleware mit `ingress.maxRequestBodyBytes`, an der IngressRoute eingehängt.
- **Certificate** (nur bei `certManager.enabled: true`) – TLS-Secret für das Istio-Gateway.

Die Ingress-Templates prüfen zusätzlich per `.Capabilities.APIVersions.Has`, ob die CRDs im Cluster vorhanden sind.

## Konfiguration (`values.yaml`)

| Key | Beschreibung | Default |
|---|---|---|
| `image.repository` / `image.tag` / `image.pullPolicy` | Container-Image | `registry.gmk.lan/dos-ascii`, `latest`, `Always` |
| `replicaCount` | Anzahl Replicas | `1` |
| `deploymentName` | Name für Deployment und Ingress-Ressourcen | `dos-ascii` |
| `service.name` / `service.type` | Service-Objekt | `dos-ascii-svc`, `ClusterIP` |
| `service.port` / `service.targetPort` | Service- und Container-Port | `8080` |
| `resources` | Requests/Limits | `64Mi`/`50m` → `128Mi`/`200m` |
| `probes.path` | HTTP-Pfad aller Probes | `/fonts` |
| `probes.startup` / `.liveness` / `.readiness` | Timing der Probes | siehe `values.yaml` |
| `podSecurityContext` / `securityContext` | Pod- bzw. Container-SecurityContext | UID 1000, read-only Root-FS, `drop: [ALL]` |
| `podDisruptionBudget.enabled` / `.maxUnavailable` | PDB (nur bei `replicaCount > 1`) | `false`, `1` |
| `topologySpread.enabled` / `.whenUnsatisfiable` | Pods über Nodes verteilen (nur bei `replicaCount > 1`) | `true`, `ScheduleAnyway` |
| `ingress.controller` | `istio`, `traefik` oder `none` | `istio` |
| `ingress.hosts` | Externe Hostnamen | `dos-ascii.tp.lan`, `dos-ascii.gmk.lan`, `dos-ascii.localhost` |
| `ingress.maxRequestBodyBytes` | Maximale Body-Größe am Ingress, größere Requests bekommen 413 | `1024` |
| `istio.gatewayName` / `istio.gatewayNamespace` | Istio-Gateway und Namespace des TLS-Secrets | `dos-ascii-gw`, `istio-ingress` |
| `istio.tls.secretName` | TLS-Secret des Gateways | `dos-ascii-tls` |
| `traefik.entryPoints` | Traefik Entrypoints | `[web, websecure]` |
| `certManager.enabled` / `.issuerRef` / `.dnsNames` | cert-manager `Certificate` | `true`, `ClusterIssuer/local-ca-issuer` |

## Installation

Mit Istio (Standard):

```bash
kubectl create namespace dos-ascii
kubectl label namespace dos-ascii istio-injection=enabled --overwrite
helm install dos-ascii ./dos-ascii-chart -n dos-ascii --create-namespace -f dos-ascii-chart/values-istio.yaml
```

Mit Traefik:

```bash
helm install dos-ascii ./dos-ascii-chart -n dos-ascii --create-namespace -f dos-ascii-chart/values-traefik.yaml
```

Mit local kind:

```bash
docker build -t dos-ascii:dev .
kind load docker-image dos-ascii:dev
helm upgrade --install dos-ascii ./dos-ascii-chart -n dos-ascii-test --create-namespace \
  --set image.repository=dos-ascii --set image.tag=dev --set image.pullPolicy=Never \
  --set certManager.enabled=false
```

## Upgrade / Deinstallation

```bash
helm upgrade dos-ascii ./dos-ascii-chart -n dos-ascii --set image.tag=1.2.3
helm uninstall dos-ascii -n dos-ascii
```

## Testen

```bash
helm template dos-ascii ./dos-ascii-chart -f dos-ascii-chart/values-istio.yaml --show-only templates/virtualservice.yaml
helm template dos-ascii ./dos-ascii-chart -f dos-ascii-chart/values-traefik.yaml --show-only templates/traefik-ingressroute.yaml
helm lint ./dos-ascii-chart -f dos-ascii-chart/values-istio.yaml
helm lint ./dos-ascii-chart -f dos-ascii-chart/values-traefik.yaml
```
