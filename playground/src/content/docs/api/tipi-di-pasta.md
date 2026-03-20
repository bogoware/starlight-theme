---
title: 'Tipi di Pasta'
description: "Riferimento completo ai tipi fondamentali di Pasta Protocol: Spaghetto, Rigatone, Fusillo, Raviolo e Lasagna."
---

> *"Pane e pasta fanno la vita onesta."* — E tipi ben definiti fanno il codice onesto.

I tipi di Pasta Protocol non sono semplici alias TypeScript: sono il vocabolario condiviso tra tutti i nodi del cluster. Ogni tipo porta con sé una semantica precisa, un comportamento di serializzazione e delle garanzie sul ciclo di vita. Conoscerli a fondo è il primo passo per cucinare un sistema distribuito degno di rispetto.

## Tabella dei Tipi

| Tipo Pasta Protocol | Equivalente concettuale | Descrizione breve |
|---------------------|------------------------|-------------------|
| `Spaghetto` | `string` | Dato scalare, lineare, immutabile |
| `Rigatone` | `array` | Collezione ordinata con struttura rigata (schema impresso) |
| `Fusillo` | `event` | Messaggio che ruota attorno a un asse temporale |
| `Raviolo` | `encapsulated object` | Dato con ripieno opaco, confine esplicito |
| `Lasagna` | `layered struct` | Struttura stratificata, ogni layer accessibile indipendentemente |

---

## Spaghetto

`Spaghetto` rappresenta un valore scalare trasmissibile attraverso il cluster. Come lo spaghetto, è lungo, lineare, e non va spezzato — pena il disappunto degli anziani e un errore `PEPERONCINO`.

```typescript
/**
 * Un valore scalare immutabile nel cluster.
 * Non spezzare mai uno Spaghetto prima di cuocerlo.
 * @stable
 */
export interface Spaghetto<T extends string | number | boolean | null = string> {
  /** Identificatore univoco del valore nel cluster */
  readonly id: string;
  /** Il valore effettivo */
  readonly value: T;
  /** Timestamp di creazione (Unix ms) */
  readonly createdAt: number;
  /** Nodo di origine */
  readonly origin: NodeId;
  /** Checksum per integrità di trasmissione */
  readonly checksum: string;
}

// Costruzione
const nomeNodo = Pasta.spaghetto('napoli-primary-01');
// → Spaghetto<string> { id: 'sp_...', value: 'napoli-primary-01', ... }

// Accesso al valore
console.log(nomeNodo.value); // 'napoli-primary-01'
```

**Regole di immutabilità**: `Spaghetto` è sempre `readonly`. Qualsiasi tentativo di assegnazione diretta produrrà un errore TypeScript a compile time e un log `BRUSCHETTA` a runtime.

---

## Rigatone

`Rigatone` è la collezione ordinata di Pasta Protocol. Le "rigature" non sono decorative: rappresentano lo schema che ogni elemento della collezione deve rispettare. Un `Rigatone` senza schema è uno `Spaghetto` travestito — e il cluster lo sa.

```typescript
/**
 * Collezione ordinata con schema impresso.
 * Gli elementi devono rispettare il tipo T.
 * @stable
 */
export interface Rigatone<T> {
  readonly id: string;
  readonly schema: Schema<T>;
  readonly items: ReadonlyArray<T>;
  readonly length: number;
  readonly createdAt: number;
  readonly lastModifiedAt: number;

  /** Aggiunge un elemento, restituisce un nuovo Rigatone */
  append(item: T): Rigatone<T>;

  /** Filtra elementi, restituisce un nuovo Rigatone */
  filter(predicate: (item: T) => boolean): Rigatone<T>;

  /** Trasforma elementi, restituisce un nuovo Rigatone<U> */
  map<U>(transform: (item: T) => U, newSchema: Schema<U>): Rigatone<U>;

  /** Accede a un elemento per indice */
  at(index: number): T | undefined;
}

// Esempio
const nodi = Pasta.rigatone<NodeDescriptor>(nodeSchema, [
  { id: 'napoli-01', region: 'eu-south-1', weight: 1.0 },
  { id: 'napoli-02', region: 'eu-south-1', weight: 0.8 },
]);

const nodi_attivi = nodi.filter(n => n.weight > 0.5);
// → Rigatone<NodeDescriptor> con 2 elementi
```

---

## Fusillo

`Fusillo` è l'evento del framework. La forma a spirale non è casuale: un evento ruota attorno a un punto nel tempo (`occurredAt`), portando con sé il contesto che lo ha generato. I `Fusilli` viaggiano attraverso il sistema di messaggistica GarlicBreadcast.

```typescript
/**
 * Evento immutabile con contesto temporale e causale.
 * @stable
 */
export interface Fusillo<P = unknown> {
  readonly id: string;
  readonly type: string;
  readonly payload: P;
  readonly occurredAt: number;
  readonly causedBy?: string; // id del Fusillo precedente nella catena causale
  readonly correlationId: string;
  readonly source: NodeId;
  readonly version: number;

  /** Crea un Fusillo figlio causalmente collegato */
  spawn<Q>(type: string, payload: Q): Fusillo<Q>;
}

// Definizione di eventi tipizzati
interface NodoConnessoPayload {
  nodeId: string;
  region: string;
  capabilities: string[];
}

// Creazione
const evento = Pasta.fusillo<NodoConnessoPayload>('nodo.connesso', {
  nodeId: 'palermo-03',
  region: 'eu-south-1',
  capabilities: ['consensus', 'storage'],
});

// Propagazione causale
const eventoFiglio = evento.spawn('nodo.pronto', { readyAt: Date.now() });
// eventoFiglio.causedBy === evento.id ✓
```

---

## Raviolo

`Raviolo` è la struttura di incapsulamento di Pasta Protocol. Come un raviolo vero, ha un **sfoglia** (il confine esterno, visibile a tutti) e un **ripieno** (i dati interni, accessibili solo con la chiave corretta). È il pattern fondamentale per i bounded context distribuiti.

```typescript
/**
 * Dato incapsulato con confine esplicito.
 * Il ripieno è opaco finché non viene aperto con la chiave corretta.
 * @stable
 */
export interface Raviolo<Sfoglia, Ripieno> {
  readonly id: string;
  readonly boundary: string; // nome del bounded context
  readonly sfoglia: Sfoglia; // metadati pubblici
  readonly createdAt: number;

  /** Accede al ripieno se si possiede la chiave del contesto */
  open(contextKey: ContextKey): Promise<Ripieno>;

  /** Verifica se il ripieno è accessibile senza aprire */
  canOpen(contextKey: ContextKey): boolean;

  /** Crea un nuovo Raviolo con ripieno modificato (lascia l'originale intatto) */
  withFilling<NuovoRipieno>(
    contextKey: ContextKey,
    transform: (current: Ripieno) => NuovoRipieno
  ): Promise<Raviolo<Sfoglia, NuovoRipieno>>;
}

// Esempio: utente con dati sensibili incapsulati
interface UtenteEsterno { id: string; username: string; region: string; }
interface DatiPrivati  { email: string; hashedPassword: string; auditLog: string[]; }

const utente = await Pasta.raviolo<UtenteEsterno, DatiPrivati>(
  'auth-context',
  { id: 'u_001', username: 'gennaro', region: 'eu-south-1' },
  { email: 'gennaro@napoli.it', hashedPassword: '...', auditLog: [] }
);

const privato = await utente.open(authContextKey);
// privato.email → 'gennaro@napoli.it'
```

---

## Lasagna

`Lasagna` è la struttura dati stratificata. Ogni strato (`Strato`) è indipendente, tipizzato e accessibile per indice o per nome. Gli strati si compongono in ordine: lo strato 0 è la base, lo strato N è la superficie. Come nella lasagna vera, cambiare uno strato non richiede di ricostruire l'intera struttura.

```typescript
/**
 * Struttura dati stratificata e composabile.
 * Ogni strato è immutabile e tipizzato indipendentemente.
 * @stable
 */
export interface Strato<T> {
  readonly name: string;
  readonly index: number;
  readonly data: T;
  readonly addedAt: number;
}

export interface Lasagna<Strati extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly layers: ReadonlyArray<Strato<unknown>>;
  readonly depth: number;

  /** Accede a uno strato per nome */
  layer<K extends keyof Strati>(name: K): Strato<Strati[K]> | undefined;

  /** Aggiunge uno strato in cima, restituisce una nuova Lasagna */
  addLayer<K extends string, V>(name: K, data: V): Lasagna<Strati & Record<K, V>>;

  /** Sostituisce uno strato, restituisce una nuova Lasagna */
  replaceLayer<K extends keyof Strati>(name: K, data: Strati[K]): Lasagna<Strati>;

  /** Rimuove lo strato superiore, restituisce { lasagna, strato } */
  pop(): { lasagna: Lasagna; strato: Strato<unknown> | undefined };
}

// Esempio: request context stratificato
const contesto = Pasta.lasagna()
  .addLayer('network', { ip: '192.168.1.1', port: 8080 })
  .addLayer('auth',    { userId: 'u_001', roles: ['admin'] })
  .addLayer('request', { method: 'POST', path: '/api/nodi' });

const authLayer = contesto.layer('auth');
// authLayer.data.userId → 'u_001'
// authLayer.index → 1
```

---

## Conversioni tra Tipi

Pasta Protocol fornisce utilità di conversione sicure. Le conversioni che potrebbero fallire restituiscono sempre un `Result<T, PastaError>` invece di lanciare eccezioni.

```typescript
import { Pasta } from 'pasta-protocol';

// Spaghetto → Rigatone (unwrap e rewrap)
const singolo = Pasta.spaghetto('valore');
const lista   = Pasta.rigatone(stringSchema, [singolo.value]);

// Fusillo da Raviolo aperto
const fusillo = await raviolo
  .open(ctxKey)
  .then(ripieno => Pasta.fusillo('dati.estratti', ripieno));

// Lasagna → Record plain
const plain = Pasta.toRecord(lasagna);
```
