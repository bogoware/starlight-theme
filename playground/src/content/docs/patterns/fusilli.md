---
title: 'Fusilli Event Sourcing'
description: "The spiral truth — event sourcing with Pasta Protocol's Fusilli pattern"
---

> *"'O fusillo nun va dritto — e fa bene accussì: ogni giro registra 'a strada."*
> (The fusillo doesn't go straight — and that's good: every turn records the path.)

Look at a fusillo. It does not travel in a straight line. It spirals. Every twist is a record of the journey — the dough remembers every rotation of the extruder that shaped it. This is the philosophical foundation of Pasta Protocol's **Fusilli Event Sourcing** pattern: instead of storing only the current state of your domain objects, you store every event that ever led to that state. The current state is not a fact stored in a column — it is a *projection*, derived on demand by replaying the spiral from the beginning.

Event sourcing solves a class of problems that conventional CRUD architectures cannot address elegantly: full audit trails, temporal queries, event replay for debugging, and the ability to derive new read models from historical data without touching the original events.

## Core Concepts

**EventStore** — the append-only log. Events are written in strict causal order and never mutated. Think of the event store as a pasta machine: you can add more dough, but you cannot un-extrude what has already come out.

**DomainEvent** — an immutable record of something that happened in the domain. Named in past tense. Contains all data needed to understand what occurred, but no references to mutable state.

**Aggregate** — the entity whose state is reconstructed by replaying events. The aggregate's `apply` method is a pure function: given a sequence of events, it produces the current state.

**Projection** — a read model derived by processing a stream of events. Multiple projections can be built from the same event stream, each optimised for a different query pattern.

## Defining Domain Events

```typescript
import { type FusilloEvent } from '@pasta-protocol/fusilli';

// Every event must be immutable and carry its own timestamp
export interface OrdineCreato extends FusilloEvent {
  readonly type: 'OrdineCreato';
  readonly ordineId: string;
  readonly clienteId: string;
  readonly importo: number;
  readonly righe: ReadonlyArray<RigaOrdine>;
  readonly timestamp: Date;
}

export interface OrdineConfermato extends FusilloEvent {
  readonly type: 'OrdineConfermato';
  readonly ordineId: string;
  readonly confermatoIl: Date;
  readonly operatoreId: string;
}

export interface OrdineAnnullato extends FusilloEvent {
  readonly type: 'OrdineAnnullato';
  readonly ordineId: string;
  readonly motivazione: string;
  readonly annullatoIl: Date;
}

export type OrdineEvent = OrdineCreato | OrdineConfermato | OrdineAnnullato;
```

## The Aggregate — Rebuilding State from the Spiral

```typescript
import { FusilloAggregate } from '@pasta-protocol/fusilli';

export class Ordine extends FusilloAggregate<OrdineEvent> {
  private constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly importo: number,
    public readonly stato: 'BOZZA' | 'CONFERMATO' | 'ANNULLATO',
  ) {
    super();
  }

  // Factory: create a brand-new aggregate and emit its first event
  static crea(command: CreaOrdineCommand): Ordine {
    const ordine = new Ordine(
      generateId(),
      command.clienteId,
      command.importo,
      'BOZZA',
    );
    ordine.raise({
      type: 'OrdineCreato',
      ordineId: ordine.id,
      clienteId: command.clienteId,
      importo: command.importo,
      righe: command.righe,
      timestamp: new Date(),
    });
    return ordine;
  }

  // Reducer: apply one event and return new (immutable) state
  protected apply(state: Ordine, event: OrdineEvent): Ordine {
    switch (event.type) {
      case 'OrdineCreato':
        return new Ordine(event.ordineId, event.clienteId, event.importo, 'BOZZA');
      case 'OrdineConfermato':
        return new Ordine(state.id, state.clienteId, state.importo, 'CONFERMATO');
      case 'OrdineAnnullato':
        return new Ordine(state.id, state.clienteId, state.importo, 'ANNULLATO');
    }
  }

  // Command handler
  conferma(operatoreId: string): void {
    if (this.stato !== 'BOZZA') {
      throw new PastaError('PEPERONCINO', 'ORDINE_NON_IN_BOZZA', this.stato);
    }
    this.raise({
      type: 'OrdineConfermato',
      ordineId: this.id,
      confermatoIl: new Date(),
      operatoreId,
    });
  }
}
```

## Persisting and Replaying Events

```typescript
import { FusilloEventStore } from '@pasta-protocol/fusilli';

const store = new FusilloEventStore(db);

// Save new events from an aggregate after a command
async function salvaOrdine(ordine: Ordine): Promise<void> {
  const nuoviEventi = ordine.uncommittedEvents;
  await store.append('ordini', ordine.id, nuoviEventi, ordine.version);
  ordine.clearUncommittedEvents();
}

// Replay: reconstruct current state from the full event spiral
async function caricaOrdine(ordineId: string): Promise<Ordine> {
  const eventi = await store.load('ordini', ordineId);
  if (eventi.length === 0) {
    throw new PastaError('VESUVIO', 'ORDINE_NON_TROVATO', ordineId);
  }
  return Ordine.replay(eventi);
}
```

## Building Projections

A projection listens to the event stream and builds a denormalised read model optimised for queries. Because events are immutable, you can drop and rebuild any projection at any time:

```typescript
import { FusilloProjection } from '@pasta-protocol/fusilli';

export const ordiniPerClienteProjection = new FusilloProjection<OrdineEvent>({
  name: 'ordini-per-cliente',
  handle: {
    OrdineCreato: async (event, db) => {
      await db.execute(
        'INSERT INTO ordini_per_cliente (cliente_id, ordine_id, importo, stato) VALUES ($1, $2, $3, $4)',
        [event.clienteId, event.ordineId, event.importo, 'BOZZA'],
      );
    },
    OrdineConfermato: async (event, db) => {
      await db.execute(
        'UPDATE ordini_per_cliente SET stato = $1 WHERE ordine_id = $2',
        ['CONFERMATO', event.ordineId],
      );
    },
    OrdineAnnullato: async (event, db) => {
      await db.execute(
        'UPDATE ordini_per_cliente SET stato = $1 WHERE ordine_id = $2',
        ['ANNULLATO', event.ordineId],
      );
    },
  },
});
```

## Temporal Queries and Replay

One of the great gifts of the fusilli spiral: you can ask "what did this order look like at 14:32 yesterday?" by simply replaying events up to that timestamp.

```typescript
const ordineStorico = await store.replayUntil('ordini', ordineId, soglia);
// ordineStorico is the aggregate state as of `soglia` — no extra columns, no deleted rows
```

This capability comes for free. No audit table, no `updated_at` gymnastics, no triggers. The spiral remembers.
