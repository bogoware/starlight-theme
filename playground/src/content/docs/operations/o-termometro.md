---
title: "O Termometro"
description: "Monitoraggio del cluster Pasta Protocol: metriche Prometheus, dashboard, e l'endpoint /sono-vivo"
---

> *"'O bravo cuoco tene sempre 'a mano sul termometro — nun aspetta che 'a cucina vada a fuoco."*
> (A good cook always keeps his hand on the thermometer — he does not wait for the kitchen to catch fire.)

The `Termometro` subsystem is Pasta Protocol's built-in observability layer. It aggregates health signals from every node in the cluster, exposes them as Prometheus-compatible metrics, and serves a human-readable health endpoint that your load balancer, uptime monitor, or anxious engineer can query at any moment. Think of it as the kitchen thermometer that the head chef checks before every service — not because something is wrong, but precisely to know before something goes wrong.

## Architettura del Termometro

Each Pasta Protocol node runs a local `Termometro` agent on a dedicated HTTP port (default: `9419`). This agent:

1. Collects internal metrics from the node's subsystems (KitchenManager, GarlicBreadcast, Dispensa, Pesto Consensus).
2. Aggregates cluster-wide health by polling peer agents via the internal GarlicBreadcast bus.
3. Exposes two endpoints: `/sono-vivo` for health checks and `/metrics` for Prometheus scraping.
4. Emits `PEPERONCINO` events when any metric crosses a warning threshold, and `VESUVIO` events when a critical threshold is breached.

## L'Endpoint /sono-vivo

`/sono-vivo` is the primary health-check endpoint. The name translates as "I am alive" — the answer every load balancer wants to hear.

### Richiesta

```http
GET http://<node-host>:9419/sono-vivo
```

No authentication required. No body. A simple GET is sufficient.

### Risposta — Nodo Sano

```json
{
  "status": "vivo",
  "node": "napoli-03",
  "kitchen": "primary-kitchen-eu-central",
  "uptime_seconds": 604823,
  "cluster": {
    "quorum": true,
    "nodes_healthy": 3,
    "nodes_total": 3,
    "leader": "napoli-01"
  },
  "subsystems": {
    "kitchen_manager": "ok",
    "garlicbreadcast": "ok",
    "dispensa": "ok",
    "pesto_consensus": "ok"
  },
  "version": "2.4.1",
  "timestamp": "2025-03-20T14:45:00.000Z"
}
```

HTTP status: `200 OK`

### Risposta — Nodo Degradato

```json
{
  "status": "malato",
  "node": "napoli-03",
  "kitchen": "primary-kitchen-eu-central",
  "uptime_seconds": 3621,
  "cluster": {
    "quorum": true,
    "nodes_healthy": 2,
    "nodes_total": 3,
    "leader": "napoli-01"
  },
  "subsystems": {
    "kitchen_manager": "ok",
    "garlicbreadcast": "degraded",
    "dispensa": "ok",
    "pesto_consensus": "ok"
  },
  "degraded_reason": "GARLICBREADCAST_QUEUE_DEPTH_HIGH: queue depth 4821 exceeds warning threshold 1000",
  "severity": "PEPERONCINO",
  "version": "2.4.1",
  "timestamp": "2025-03-20T14:45:00.000Z"
}
```

HTTP status: `200 OK` (the node is alive but degraded — use `status` field for detail)

### Risposta — Nodo Non Risponde

When a node is completely unreachable, the TCP connection will be refused or time out. If the KitchenManager process is running but has entered a fatal state, the endpoint returns:

```json
{
  "status": "morto",
  "node": "napoli-03",
  "severity": "TERREMOTO",
  "reason": "KITCHEN_PANIC: unhandled exception in saga coordinator",
  "timestamp": "2025-03-20T14:45:00.000Z"
}
```

HTTP status: `503 Service Unavailable`

### Configurazione dell'Endpoint

```yaml
# .ricetta — Termometro configuration
termometro:
  port: 9419
  health_path: /sono-vivo
  metrics_path: /metrics
  check_interval: 10s
  thresholds:
    latency_warn_ms: 1000
    latency_critical_ms: 5000
    queue_depth_warn: 1000
    queue_depth_critical: 10000
    memory_warn_percent: 75
    memory_critical_percent: 90
    replication_lag_warn_s: 10
    replication_lag_critical_s: 30
```

## Metriche Prometheus

The `/metrics` endpoint exposes all cluster metrics in Prometheus text format. Scrape it at 15-second intervals for real-time observability.

### Metriche Principali

```promql
# ─── TEMPERATURA (Latency) ─────────────────────────────────────────────────

# Current kitchen temperature — P50/P95/P99 request latency in milliseconds
pasta_kitchen_temperature_celsius{node="napoli-01", quantile="0.5"}
pasta_kitchen_temperature_celsius{node="napoli-01", quantile="0.95"}
pasta_kitchen_temperature_celsius{node="napoli-01", quantile="0.99"}

# Rate of requests per second across the cluster
rate(pasta_requests_total{kitchen="primary-kitchen-eu-central"}[5m])

# Error rate — fraction of requests resulting in VESUVIO or TERREMOTO errors
sum(rate(pasta_errors_total{severity=~"VESUVIO|TERREMOTO"}[5m]))
  / sum(rate(pasta_requests_total[5m]))

# ─── CODA (Queue Depth) ────────────────────────────────────────────────────

# Current GarlicBreadcast queue depth per node
pasta_garlicbreadcast_queue_depth{node="napoli-01"}

# Dead-letter queue depth — messages that could not be delivered
pasta_garlicbreadcast_dead_letter_depth{kitchen="primary-kitchen-eu-central"}

# Consumer lag — how far behind each subscriber is
pasta_garlicbreadcast_consumer_lag_seconds{topic="ordini", subscriber="cucina-a"}

# ─── CONSENSO (Consensus Health) ──────────────────────────────────────────

# Number of healthy nodes participating in quorum
pasta_cluster_nodes_healthy{kitchen="primary-kitchen-eu-central"}

# Consensus round duration in milliseconds
histogram_quantile(0.99,
  rate(pasta_pesto_consensus_round_duration_ms_bucket[5m])
)

# Replication lag on follower nodes relative to leader WAL offset
pasta_dispensa_replication_lag_seconds{node="napoli-03", role="follower"}

# ─── MEMORIA E CPU ────────────────────────────────────────────────────────

# Node memory usage as a fraction of total allocated
pasta_node_memory_used_bytes{node="napoli-02"}
  / pasta_node_memory_total_bytes{node="napoli-02"}

# Node CPU usage percentage over the last 5 minutes
avg_over_time(pasta_node_cpu_usage_percent{node="napoli-02"}[5m])

# ─── SALUTE GENERALE ──────────────────────────────────────────────────────

# Overall cluster health: 1 = healthy, 0.5 = degraded, 0 = halted
pasta_cluster_health_score{kitchen="primary-kitchen-eu-central"}

# Uptime of each node in seconds
pasta_node_uptime_seconds{node="napoli-01"}
```

### Query Composite per Alert

```promql
# Alert: kitchen is running hot (P99 latency > 2 seconds for 5 minutes)
ALERT KitchenRunningHot
  IF histogram_quantile(0.99,
       rate(pasta_kitchen_temperature_celsius_bucket[5m])
     ) > 2000
  FOR 5m
  LABELS { severity = "PEPERONCINO" }
  ANNOTATIONS {
    summary = "Kitchen {{ $labels.kitchen }} P99 latency > 2s",
    description = "Current P99: {{ $value }}ms. Check for hot shards or GC pressure."
  }

# Alert: quorum at risk (only N+1 nodes healthy)
ALERT QuorumAtRisk
  IF pasta_cluster_nodes_healthy{} <= 2
     AND pasta_cluster_nodes_total{} == 3
  FOR 1m
  LABELS { severity = "VESUVIO" }
  ANNOTATIONS {
    summary = "Cluster {{ $labels.kitchen }} one node away from quorum loss",
    description = "Healthy nodes: {{ $value }}/3. Restore failed node immediately."
  }

# Alert: cluster halted
ALERT TerremotoDetected
  IF pasta_cluster_health_score{} == 0
  FOR 30s
  LABELS { severity = "TERREMOTO" }
  ANNOTATIONS {
    summary = "TERREMOTO: cluster {{ $labels.kitchen }} has halted",
    description = "Execute disaster recovery runbook immediately."
  }
```

## Configurazione Dashboard

The following JSON defines a Grafana dashboard for Pasta Protocol cluster monitoring. Import it via Grafana's "Import Dashboard" UI.

```json
{
  "title": "Pasta Protocol — Cucina di Controllo",
  "uid": "pasta-protocol-main",
  "tags": ["pasta-protocol", "distributed-systems"],
  "refresh": "15s",
  "time": { "from": "now-1h", "to": "now" },
  "panels": [
    {
      "id": 1,
      "title": "Temperatura della Cucina (P99 Latency)",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.99, rate(pasta_kitchen_temperature_celsius_bucket[5m]))",
          "legendFormat": "{{ node }} — P99"
        },
        {
          "expr": "histogram_quantile(0.95, rate(pasta_kitchen_temperature_celsius_bucket[5m]))",
          "legendFormat": "{{ node }} — P95"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "ms",
          "thresholds": {
            "steps": [
              { "color": "green", "value": 0 },
              { "color": "yellow", "value": 1000 },
              { "color": "red", "value": 5000 }
            ]
          }
        }
      }
    },
    {
      "id": 2,
      "title": "Salute del Cluster",
      "type": "stat",
      "gridPos": { "x": 12, "y": 0, "w": 6, "h": 4 },
      "targets": [
        {
          "expr": "pasta_cluster_nodes_healthy{kitchen=\"primary-kitchen-eu-central\"}",
          "legendFormat": "Nodi Sani"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "color": "red", "value": 0 },
              { "color": "yellow", "value": 2 },
              { "color": "green", "value": 3 }
            ]
          }
        }
      }
    },
    {
      "id": 3,
      "title": "Profondità Coda GarlicBreadcast",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 8, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "pasta_garlicbreadcast_queue_depth",
          "legendFormat": "{{ node }}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "short",
          "thresholds": {
            "steps": [
              { "color": "green", "value": 0 },
              { "color": "yellow", "value": 1000 },
              { "color": "red", "value": 10000 }
            ]
          }
        }
      }
    },
    {
      "id": 4,
      "title": "Tasso di Errori per Severità",
      "type": "timeseries",
      "gridPos": { "x": 12, "y": 8, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "rate(pasta_errors_total{severity=\"BRUSCHETTA\"}[5m])",
          "legendFormat": "BRUSCHETTA"
        },
        {
          "expr": "rate(pasta_errors_total{severity=\"PEPERONCINO\"}[5m])",
          "legendFormat": "PEPERONCINO"
        },
        {
          "expr": "rate(pasta_errors_total{severity=\"VESUVIO\"}[5m])",
          "legendFormat": "VESUVIO"
        },
        {
          "expr": "rate(pasta_errors_total{severity=\"TERREMOTO\"}[5m])",
          "legendFormat": "TERREMOTO"
        }
      ]
    }
  ]
}
```

## Integrazione TypeScript

You can access Termometro data programmatically from application code:

```ts
import { Termometro, type HealthSnapshot } from '@pasta-protocol/core';

const termometro = Termometro.getInstance();

// Get current health snapshot for the local node
const snapshot: HealthSnapshot = await termometro.getLocalHealth();
console.log(`Status: ${snapshot.status}`); // 'vivo' | 'malato' | 'morto'

// Subscribe to health change events
termometro.on('statusChange', (event) => {
  if (event.severity === 'VESUVIO' || event.severity === 'TERREMOTO') {
    pagerDuty.trigger({
      title: `Pasta Protocol: ${event.severity} on ${event.node}`,
      body: event.reason,
    });
  }
});

// Query cluster-wide health
const clusterHealth = await termometro.getClusterHealth();
const unhealthyNodes = clusterHealth.nodes.filter(n => n.status !== 'vivo');

if (unhealthyNodes.length > 0) {
  logger.grido('Unhealthy nodes detected', { nodes: unhealthyNodes });
}
```

*'O termometro non aggiusta 'a cucina — ti dice solo quando è ora di aggiustare.*
(The thermometer does not fix the kitchen — it only tells you when it is time to fix it.)
