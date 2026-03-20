---
title: "'O Forno — Architettura dei Nodi"
description: "Come i nodi del Pasta Protocol si organizzano, respirano e lavorano insieme"
---

> *"'O ffuoco è 'o masto — nun ce vo' fretta, ce vo' rispetto."*
> — Proverbio napoletano dei pizzaioli

In qualsiasi cucina che si rispetti, il forno è il fulcro di tutto. Nel Pasta Protocol, **'O Forno** rappresenta il layer di elaborazione distribuita: l'insieme dei nodi che compongono il cluster, ciascuno con il proprio ruolo, la propria responsabilità e il proprio calore operativo.

Un nodo del Pasta Protocol non è semplicemente un processo — è un artigiano. Ha una specializzazione, conosce i propri limiti, e quando il forno non funziona, lo dice chiaramente prima di mandare tutto a 'VESUVIO'.

## Le Strutture Fondamentali

Ogni nodo è modellato attraverso tre tipi principali che compongono la gerarchia di elaborazione:

```typescript
/** Rappresenta una singola unità di lavoro all'interno del cluster */
interface Node {
  readonly id: string;
  readonly role: NodeRole;
  readonly address: NodeAddress;
  readonly status: NodeStatus;
  readonly joinedAt: Date;
  readonly lastHeartbeat: Date;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Il Forno è il runtime che ospita uno o più Node */
interface Forno {
  readonly nodeId: string;
  readonly capacity: number;         // numero massimo di "infornate" parallele
  readonly temperature: FornoTemp;   // FREDDO | TIEPIDO | CALDO | ROVENTE
  readonly queue: ReadonlyArray<Impasto>;
  start(): Promise<void>;
  shutdown(graceful?: boolean): Promise<void>;
  enqueue(impasto: Impasto): Promise<EnqueueResult>;
  drain(): Promise<void>;
}

/** La Kitchen coordina tutti i Forno del cluster */
interface Kitchen {
  readonly id: string;
  readonly forni: ReadonlyArray<Forno>;
  readonly dispensa: Dispensa;
  readonly rete: Rete;
  addForno(forno: Forno): Kitchen;
  removeForno(nodeId: string): Kitchen;
  rebalance(): Promise<RebalanceResult>;
  healthCheck(): Promise<KitchenHealth>;
}
```

Il tipo `Impasto` rappresenta l'unità di lavoro — analogo a un task o un job nel gergo comune:

```typescript
interface Impasto {
  readonly id: string;
  readonly recipeId: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly priority: ImpastoPriority;   // SFOGLIA | NORMALE | URGENTE | FUOCO
  readonly createdAt: Date;
  readonly timeout: number;             // in "cotture" (multipli di 30 secondi)
  readonly retryPolicy: RetryPolicy;
  readonly traceId: string;
}

type ImpastoPriority = 'SFOGLIA' | 'NORMALE' | 'URGENTE' | 'FUOCO';

interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMultiplier: number;
  readonly maxBackoffCotture: number;
}
```

## I Tre Ruoli dei Nodi

Il Pasta Protocol assegna a ogni nodo un ruolo preciso. Come in una cucina ben organizzata, la specializzazione è la chiave dell'efficienza.

### Pizzaiolo — Il Worker

Il Pizzaiolo è il cuore operativo del cluster. Riceve gli `Impasto`, li lavora, li cuoce e restituisce i risultati. Non pensa alla coordinazione globale — pensa a fare bene il suo lavoro, uno alla volta o in parallelo secondo la sua capacità.

```typescript
interface PizzaioloConfig {
  readonly concurrency: number;          // quante pizze contemporaneamente
  readonly recipeWhitelist?: ReadonlyArray<string>;  // solo queste ricette
  readonly forno: {
    readonly temperature: FornoTemp;
    readonly warmupCotture: number;
  };
}
```

### Capocuoco — Il Coordinator

Il Capocuoco non lavora direttamente con gli impasti — li smista, li prioritizza, decide quale Pizzaiolo è il più adatto. È responsabile della distribuzione del carico, del consenso distribuito (algoritmo **Pesto**) e della gestione dei failover.

```typescript
interface CapocuocoConfig {
  readonly quorum: number;               // nodi minimi per il consenso Pesto
  readonly electionTimeoutCotture: number;
  readonly heartbeatIntervalCotture: number;
  readonly maxReassignmentsPerCottura: number;
}
```

### Lavapiatti — Il Cleaner

Il Lavapiatti è il nodo che nessuno nota ma che nessuno vuole perdere. Si occupa di garbage collection distribuita, pulizia dei log scaduti, rimozione degli impasti orfani e compattazione dello storage. Opera sempre in background, silenzioso come la notte.

```typescript
interface LavapiattConfig {
  readonly scheduleCron: string;          // es. "0 */4 * * *"
  readonly retentionPolicy: {
    readonly completedImpastiCotture: number;
    readonly failedImpastiCotture: number;
    readonly orphanedImpastiCotture: number;
  };
  readonly compactionThresholdMb: number;
}
```

## Confronto tra i Tipi di Nodo

| Caratteristica           | Pizzaiolo (Worker)       | Capocuoco (Coordinator) | Lavapiatti (Cleaner) |
|--------------------------|--------------------------|-------------------------|----------------------|
| **Ruolo primario**       | Esecuzione task          | Coordinazione e routing | Manutenzione cluster |
| **Stato**                | Stateless per design     | Stateful (Raft/Pesto)   | Stateless            |
| **Scalabilità**          | Orizzontale illimitata   | 3 o 5 nodi tipici       | 1 per cluster        |
| **Impatto failover**     | Basso (riassegnazione)   | Alto (elezione leader)  | Minimo               |
| **Utilizzo CPU**         | Alto durante elaborazione| Medio (coordinazione)   | Basso (batch notte)  |
| **Memoria richiesta**    | Media                    | Alta (state machine)    | Bassa                |
| **Partecipa al quorum**  | No                       | Sì                      | No                   |
| **`/sono-vivo` endpoint**| Sì                       | Sì                      | Sì                   |

## Ciclo di Vita di un Nodo

Un nodo del Pasta Protocol attraversa stati ben definiti durante la sua vita:

```
FREDDO → RISCALDAMENTO → PRONTO → OCCUPATO → RAFFREDDAMENTO → SPENTO
              ↑                        ↓
              └──────── ERRORE ←───────┘
                         (VESUVIO)
```

La transizione più critica è quella verso `ERRORE` — lo stato `VESUVIO`. Quando un nodo entra in questo stato, il Capocuoco avvia automaticamente il protocollo di failover: riassegnazione degli impasti in corso, notifica agli altri nodi del cluster, e tentativo di recupero entro il timeout configurato.

## Configurazione del Nodo

I nodi vengono configurati tramite file `.ricetta` in formato TOML-like:

```toml
# mio-nodo.ricetta

[node]
id = "pizzaiolo-napoli-01"
role = "PIZZAIOLO"
address = "10.0.1.42:8080"

[forno]
capacity = 8
temperature = "CALDO"
warmup_cotture = 2

[healthcheck]
endpoint = "/sono-vivo"
interval_cotture = 1
failure_threshold = 3

[logging]
level = "VOCE"
format = "json"
```

## Healthcheck e Monitoraggio

Ogni nodo espone l'endpoint `/sono-vivo` per il controllo dello stato. La risposta include temperatura del forno, impasti in coda, e lo stato corrente:

```typescript
interface SonoVivoResponse {
  readonly status: 'CALDO' | 'TIEPIDO' | 'FREDDO' | 'VESUVIO';
  readonly nodeId: string;
  readonly role: NodeRole;
  readonly uptime: number;              // in cotture
  readonly queueDepth: number;
  readonly activeImpasti: number;
  readonly lastHeartbeat: string;       // ISO 8601
}
```

Dal CLI del framework puoi interrogare lo stato del nodo direttamente:

```
pasta> node status pizzaiolo-napoli-01
  Status:     CALDO ✓
  Queue:      3 impasti in attesa
  Active:     5/8 slot occupati
  Uptime:     142 cotture
  Heartbeat:  2 cotture fa
```

'O forno che lavora bene non fa rumore — lo senti solo quando si ferma.
