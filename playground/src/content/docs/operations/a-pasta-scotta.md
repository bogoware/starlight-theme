---
title: "A Pasta Scotta"
description: "Guida alla risoluzione dei problemi: quando la pasta è troppo cotta e il cluster non risponde"
---

> *"'A pasta scotta nun se recupera — ma 'o sistema, chillo sì."*
> (Overcooked pasta cannot be saved — but the system, that can be.)

Every distributed system misbehaves eventually. A node runs hot, a message gets lost in the GarlicBreadcast queue, a configuration typo cascades into cascading timeouts. In Napoli we say *'a pasta scotta* — the pasta is overcooked — when something has gone wrong through inattention or bad luck. This guide helps you diagnose exactly what kind of overcooking you are dealing with, and how to fix it before your users notice.

## Guida Diagnostica Rapida

When the cluster starts behaving strangely, run the built-in diagnostic suite first. It will classify your problem and point you toward the right section of this guide:

```bash
npx pasta diagnose --verbose
# => Running 24 diagnostic checks...
# => [OK]   Network reachability: all nodes responding
# => [WARN] Node napoli-03: response latency 2400ms (threshold: 1000ms)
# => [FAIL] GarlicBreadcast queue depth: 18,442 messages (threshold: 1000)
# => [OK]   Consensus log: no gaps detected
# => Diagnosis: PEPERONCINO — queue congestion on napoli-03
```

For a deeper inspection of a specific node, use the `node:inspect` command:

```bash
npx pasta node:inspect napoli-03 --metrics --tail-logs 50
```

## Tabella Diagnostica

The following table maps observable symptoms to their most common causes and recommended fixes.

| Sintomo | Causa Probabile | Fix Consigliato |
|---------|----------------|-----------------|
| All writes return `TIMEOUT_ERRORE` | Quorum lost — majority of nodes unreachable | See [Disaster Recovery](/starlight-theme/operations/disaster-recovery/) |
| Reads stale by > 30 seconds | Follower node fell behind on WAL replay | Restart the lagging node: `npx pasta node:restart <name>` |
| `GarlicBreadcast` messages not delivered | Queue congestion or subscriber disconnected | Inspect queue depth; scale consumer threads |
| `KitchenManager` fails to start | Invalid `.ricetta` configuration | Run `npx pasta config:validate` and fix reported errors |
| CPU usage > 90% on leader node | Large consensus batch or runaway saga | Profile with `npx pasta node:profile --duration 60s` |
| Memory climbing steadily (no plateau) | Subscription leak — handler never unsubscribed | Audit `bus.subscribe()` calls; ensure `unsubscribe()` on teardown |
| Nodes cannot discover each other | DNS resolution failure or firewall rule change | Check `kitchen.discovery.seedNodes` in `.ricetta` |
| `RicettaParser` rejects valid YAML | Tab characters instead of spaces | YAML requires spaces — your editor may be inserting tabs |
| Log output silent (no `SUSSURRO` lines) | Logger sink misconfigured or log level set too high | Check `logger.level` — must be `SUSSURRO` for debug output |
| `/sono-vivo` returns 503 | Node is alive but internally degraded | Check `Termometro` subsystem — a critical dependency failed health-check |
| Consensus rounds taking > 5 seconds | Clock skew between nodes exceeding tolerance | Verify NTP sync on all nodes; max skew tolerance is 500ms |
| Saga stuck in `IN_PROGRESS` indefinitely | Compensating transaction failed silently | Query saga state; trigger manual compensation step |

## Codici d'a Disgrazia

The `ErrorRegistry` maps all system errors to a four-level severity hierarchy. Each error code follows the pattern `<SUBSYSTEM>_<CONDITION>_<DETAIL>`. The table below documents the complete error code catalogue organised by severity.

### BRUSCHETTA — Informational Anomalies

`BRUSCHETTA` errors are worth logging but require no immediate action. They are the system clearing its throat.

| Codice Errore | Descrizione | Causa Tipica | Azione |
|---------------|-------------|--------------|--------|
| `RICETTA_FIELD_DEPRECATED` | A configuration field is deprecated but still functional | Old `.ricetta` from a previous version | Update config at your next maintenance window |
| `GARLICBREADCAST_DUPLICATE_MESSAGE` | A message was delivered more than once (at-least-once semantics) | Network retry on acknowledgement timeout | Ensure consumers are idempotent |
| `DISPENSA_CACHE_MISS` | Item not found in local cache, falling back to primary store | Cold start or eviction under memory pressure | Normal during warmup; monitor miss rate trend |
| `TERMOMETRO_CHECK_SLOW` | A health-check probe took > 500ms to respond | Temporary I/O spike on the node | Log and watch; escalates to PEPERONCINO if sustained |
| `LOGGER_SINK_FLUSH_DELAYED` | Log sink buffer did not flush within expected window | High write throughput or slow sink | Reduce log verbosity or increase sink buffer size |

### PEPERONCINO — Warnings

`PEPERONCINO` errors indicate degraded operation. The kitchen is still serving, but something is not right. An on-call engineer should investigate within 30 minutes.

| Codice Errore | Descrizione | Causa Tipica | Azione |
|---------------|-------------|--------------|--------|
| `NODE_RESPONSE_LATENCY_HIGH` | A node's P99 latency exceeded the warning threshold (1000ms) | GC pause, I/O saturation, or hot shard | Profile the node; consider redistributing load |
| `GARLICBREADCAST_QUEUE_DEPTH_HIGH` | Message queue depth > 1,000 messages | Consumer slower than producer | Scale consumer replicas or increase thread pool |
| `PESTO_CONSENSUS_ELECTION_SLOW` | Leader election took > 3 seconds | Network jitter between nodes | Check cross-node RTT; verify firewall permits election traffic |
| `DISPENSA_REPLICATION_LAG` | A follower is > 10 seconds behind the leader WAL | Follower overloaded or network throughput limited | Inspect follower resources; consider removing from rotation temporarily |
| `RICETTA_SCHEMA_UNKNOWN_FIELD` | Unknown field in `.ricetta` — possible typo | Mistyped configuration key | Run `npx pasta config:validate` to identify the offending field |
| `SAGA_COMPENSATION_PARTIAL` | A saga compensation rolled back only some steps | Transient failure during rollback | Inspect saga state; retry compensation manually |

### VESUVIO — Critical Failures

`VESUVIO` errors mean the kitchen is materially impaired. Quorum may be at risk. Page on-call immediately; target resolution within 15 minutes.

| Codice Errore | Descrizione | Causa Tipica | Azione |
|---------------|-------------|--------------|--------|
| `CLUSTER_QUORUM_WARNING` | Only N+1 nodes healthy (one failure away from quorum loss) | Node crash, OOM kill, or network partition | Restore the failed node immediately; do not perform rolling restarts |
| `GARLICBREADCAST_DEAD_LETTER_OVERFLOW` | Dead-letter queue exceeded capacity — messages being dropped | Persistent consumer failure | Fix consumer; drain dead-letter queue manually after fix |
| `DISPENSA_SNAPSHOT_FAILED` | Scheduled backup did not complete | Storage quota exceeded or I/O error on backup target | Clear storage; verify backup target connectivity; force manual snapshot |
| `TERMOMETRO_DEPENDENCY_CRITICAL` | A critical external dependency (DB, cache) is unreachable | Dependency outage or misconfigured connection string | Treat as dependency incident; Pasta Protocol will degrade gracefully until resolved |
| `PESTO_CONSENSUS_LOG_GAP` | Gap detected in the consensus log — some operations may be missing | Node rejoining after prolonged absence | Run `npx pasta consensus:repair --node <name>` to replay missing entries |
| `NODE_MEMORY_CRITICAL` | Node memory usage > 90% | Memory leak or unexpectedly large dataset | Force GC with `npx pasta node:gc <name>`; plan node restart in off-peak window |

### TERREMOTO — Fatal Events

`TERREMOTO` errors mean the cluster has stopped. No reads. No writes. Niente. Execute the [Disaster Recovery runbook](/starlight-theme/operations/disaster-recovery/) immediately. Post-mortem is mandatory for every TERREMOTO.

| Codice Errore | Descrizione | Causa Tipica | Azione |
|---------------|-------------|--------------|--------|
| `CLUSTER_QUORUM_LOST` | Fewer than a majority of nodes are responding — cluster halted | Multiple simultaneous node failures or network split-brain | Execute Disaster Recovery runbook from Step 1 |
| `CONSENSUS_LOG_CORRUPTED` | The WAL is corrupted and cannot be replayed | Disk failure or incomplete shutdown | Restore from last clean backup; do not attempt manual log repair |
| `DISPENSA_DATA_LOSS_DETECTED` | Read-back of written data returns inconsistent results | Storage-level corruption or botched migration | Halt all writes immediately; engage data team; restore from backup |
| `KITCHEN_PANIC` | An unhandled exception crashed the KitchenManager process | Bug in application code or Pasta Protocol internals | Check crash dump at `~/.pasta/crash-<timestamp>.log`; report to maintainers if PP-internal |
| `TERREMOTO_SPLIT_BRAIN` | Two nodes both believe they are the leader | Clock skew > 500ms combined with network partition | Manually fence the stale leader; consult consensus log to determine true leader |

## Strumenti di Debug Avanzato

For issues not covered by the diagnostic table, the following tools provide deeper inspection:

```bash
# Dump the full consensus log to inspect operation history
npx pasta consensus:dump --last 1000 --format json > consensus-dump.json

# Trace a specific message through the GarlicBreadcast pipeline
npx pasta bus:trace --message-id "msg_abc123" --verbose

# Replay WAL from a specific offset (dry-run — no writes)
npx pasta wal:replay --from-offset 88421 --dry-run

# Export Termometro health snapshot
npx pasta health:export --format prometheus > health-$(date +%s).prom
```

*Ricordatevi: 'a diagnosi sbagliata è peggio d'a malattia.*
(Remember: a wrong diagnosis is worse than the disease.)
