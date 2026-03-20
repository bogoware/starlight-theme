---
title: "'A Rete — Il Layer di Networking"
description: "Protocolli di comunicazione del Pasta Protocol: veloci come un motorino, affidabili come il postino."
---

> *"'A posta arriva sempe — ma 'o corriere se perde a volontà."*
> — Proverbio napoletano

A Napoli non esiste un solo modo per far arrivare un messaggio a destinazione. C'è il corriere formale, il motorino che taglia il traffico, e il piccione viaggiatore per quando non importa se arriva — basta che arrivi. Nel Pasta Protocol, **'A Rete** riflette questa stessa saggezza pratica: protocolli diversi per esigenze diverse, ciascuno con la propria personalità e i propri compromessi.

Il layer di networking del Pasta Protocol è progettato per essere composabile. Puoi usare HTTP per le API pubbliche, gRPC per la comunicazione interna ad alta frequenza, e UDP per i gossip di stato dove qualche perdita è accettabile. La scelta è tua — il framework si adatta.

## I Tre Protocolli

### HTTP — Il Corriere

Il **Corriere** è il trasporto HTTP/1.1 e HTTP/2 del framework. Affidabile, universale, facilmente ispezionabile con qualsiasi strumento. Il Corriere sa dove abita ogni servizio, gestisce i retry con backoff esponenziale, e porta con sé i trace ID per l'osservabilità end-to-end.

```typescript
import { createRete, CorriereTransport } from '@pasta-protocol/rete';

const rete = createRete({
  transport: new CorriereTransport({
    baseUrl: 'https://api.cucina.local',
    timeoutCotture: 4,
    keepAlive: true,
    maxSockets: 50,
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      retryOn: [408, 429, 502, 503, 504],
    },
    headers: {
      'X-Pasta-Version': '2.4.0',
      'X-Cluster-Id': process.env.CLUSTER_ID,
    },
  }),
});

// Chiamata tipica
const risposta = await rete.send<OrdineResponse>({
  method: 'POST',
  path: '/ordini',
  body: nuovoOrdine,
  traceId: ctx.traceId,
});
```

### gRPC — Il Motorino

Il **Motorino** è il trasporto gRPC — scattante, efficiente, perfetto per la comunicazione inter-nodo ad alta frequenza. Usa Protocol Buffers per la serializzazione (niente JSON, niente overhead), supporta streaming bidirezionale e multiplexing HTTP/2 nativo. Come il motorino partenopeo: non elegante, ma inarrestabile.

```typescript
import { MotorineoTransport } from '@pasta-protocol/rete';

const rete = createRete({
  transport: new MotorineoTransport({
    address: 'capocuoco.cluster.local:9090',
    credentials: grpc.credentials.createSsl(caCert),
    channelOptions: {
      'grpc.keepalive_time_ms': 30_000,
      'grpc.max_receive_message_length': 4 * 1024 * 1024, // 4MB
    },
    protoPath: './protos/pasta-protocol.proto',
    serviceName: 'PastaCluster',
    timeoutCotture: 1,
  }),
});

// Chiamata unaria
const stato = await rete.call<NodeStatus>('GetNodeStatus', { nodeId: 'pizzaiolo-01' });

// Streaming server-side
const stream = rete.stream<SagaEvent>('WatchSaga', { sagaId: 'saga_007' });
for await (const evento of stream) {
  console.log(`Evento saga: ${evento.type}`);
}
```

### UDP — Il Piccione Viaggiatore

Il **Piccione Viaggiatore** è il trasporto UDP del Pasta Protocol — best-effort, senza connessione, senza garanzie. Usato principalmente per i messaggi di gossip tra nodi (propagazione dello stato del cluster) e per le metriche ad alta frequenza dove una perdita occasionale è accettabile. Come il piccione: a volte arriva, a volte no, ma quando arriva è velocissimo.

```typescript
import { PiccioneTransport } from '@pasta-protocol/rete';

const rete = createRete({
  transport: new PiccioneTransport({
    multicastGroup: '239.255.42.1',
    port: 4242,
    ttl: 4,
    loopback: false,
  }),
});

// Gossip broadcast (fire-and-forget)
await rete.broadcast({
  type: 'NODE_HEARTBEAT',
  nodeId: 'pizzaiolo-napoli-01',
  temperature: 'CALDO',
  queueDepth: 3,
  timestamp: Date.now(),
});
```

## Confronto tra i Protocolli

| Caratteristica           | Corriere (HTTP)             | Motorino (gRPC)              | Piccione Viaggiatore (UDP)  |
|--------------------------|-----------------------------|------------------------------|-----------------------------|
| **Affidabilità**         | Alta (con retry)            | Alta (con retry)             | Nessuna garanzia            |
| **Latenza**              | Media (10–50ms)             | Bassa (1–10ms)               | Molto bassa (<1ms)          |
| **Overhead**             | Medio (HTTP headers)        | Basso (Protobuf binario)     | Minimo                      |
| **Streaming**            | Limitato (SSE, chunked)     | Nativo (bidirezionale)       | No                          |
| **Ispezione**            | Facile (curl, browser)      | Richiede strumenti gRPC      | Difficile                   |
| **Firewall-friendly**    | Sì (porta 80/443)           | Sì (porta configurabile)     | Spesso bloccato             |
| **Caso d'uso primario**  | API pubbliche, REST         | Comunicazione inter-nodo     | Gossip, metriche, heartbeat |
| **Compressione**         | gzip/br opzionale           | Nativa (gzip/zstd)           | Non supportata              |
| **TLS**                  | Sì                          | Sì (obbligatorio in prod)    | No (plain UDP)              |

## Service Discovery

'A Rete integra service discovery nativo tramite il **Rubrica** — un registro distribuito che mappa i nomi dei servizi agli indirizzi fisici:

```typescript
import { Rubrica } from '@pasta-protocol/rete';

const rubrica = new Rubrica({
  backend: 'consul',  // oppure 'etcd', 'kubernetes', 'static'
  prefix: 'pasta/',
  ttlCotture: 10,
  refreshIntervalCotture: 2,
});

// Registrazione del servizio al bootstrap
await rubrica.register({
  name: 'cucina-service',
  address: '10.0.1.42',
  port: 8080,
  tags: ['v2', 'napoli-region'],
  healthCheck: '/sono-vivo',
});

// Risoluzione di un indirizzo
const endpoint = await rubrica.resolve('cucina-service', {
  prefer: ['napoli-region'],
  loadBalancing: 'ROUND_ROBIN',  // ROUND_ROBIN | LEAST_CONN | RANDOM | STICKY
});
```

## Circuit Breaker — Il Fusibile

Ogni trasporto del Pasta Protocol include un circuit breaker integrato — il **Fusibile**. Quando un servizio downstream risponde con troppi errori, il Fusibile apre il circuito e fallisce fast le richieste successive, proteggendo il cluster dall'effetto a cascata:

```typescript
const rete = createRete({
  transport: new CorriereTransport({ ... }),
  fusibile: {
    threshold: 5,                    // errori consecutivi per aprire
    timeoutCotture: 4,               // quanto restare in OPEN
    halfOpenRequests: 1,             // richieste di test in HALF_OPEN
    onOpen: (service) => {
      logger.grido(`Fusibile APERTO per ${service} — bypass attivo`);
    },
    onClose: (service) => {
      logger.voce(`Fusibile CHIUSO per ${service} — servizio recuperato`);
    },
  },
});
```

Stati del Fusibile: `CHIUSO` (operativo), `APERTO` (bypass), `SEMI_APERTO` (test di recovery).

## Configurazione di Rete nel File `.ricetta`

```toml
[rete]
default_transport = "corriere"
timeout_cotture = 4

[rete.corriere]
base_url = "https://api.cucina.local"
max_sockets = 50
keep_alive = true

[rete.motorino]
address = "capocuoco.cluster.local:9090"
tls = true

[rete.piccione]
multicast_group = "239.255.42.1"
port = 4242

[rete.rubrica]
backend = "consul"
prefix = "pasta/"
ttl_cotture = 10

[rete.fusibile]
threshold = 5
timeout_cotture = 4
```

## Osservabilità di Rete

Il layer di networking emette metriche e trace per ogni richiesta. Dal CLI del framework:

```
pasta> rete stats
  Corriere:    1,842 req/cottura  |  p50: 12ms  |  p99: 87ms  |  errori: 0.3%
  Motorino:    9,441 req/cottura  |  p50: 2ms   |  p99: 11ms  |  errori: 0.1%
  Piccione:    52,000 msg/cottura |  loss: 0.8% |  —
  Fusibili:    tutti CHIUSI ✓

pasta> rete fusibile status
  cucina-service      CHIUSO   (0 errori recenti)
  pagamenti-service   CHIUSO   (1 errore recente)
  notifiche-service   APERTO   (8 errori — bypass attivo!)
```

Come i mezzi di trasporto di Napoli, 'A Rete non è mai un sistema unico — è un ecosistema di opzioni. Scegli il motorino quando conta la velocità, il corriere quando conta la tracciabilità, e il piccione quando conta solo che il messaggio si diffonda. La città non si ferma mai, e neanche il tuo cluster.
