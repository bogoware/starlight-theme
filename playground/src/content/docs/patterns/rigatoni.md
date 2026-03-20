---
title: 'Rigatoni Pipeline'
description: "Data flowing through tubes — the Rigatoni Pipeline pattern for Pasta Protocol"
---

> *"'O rigatone è fatto apposta pe' tené 'o sugo — ogni canale ha 'o suo scopo."*
> (The rigatone is made to hold the sauce — every channel has its purpose.)

In Pasta Protocol, the **Rigatoni Pipeline** pattern is the idiomatic way to process data through a sequence of transformations. Like a rigatone — that sturdy, ridged tube cut at both ends — each stage in a pipeline accepts input from one end and emits transformed output from the other. The ridges grip the data; nothing slips through without being touched.

Where other frameworks talk about "streams" or "processors," Pasta Protocol talks about **rigatoni**: discrete, composable tubes that can be arranged in any order, replaced individually, and monitored independently. A pipeline is simply a sequence of rigatoni through which your `Ingrediente` objects flow.

## Anatomy of a Rigatone

Each stage in the pipeline is a `Rigatone<TIn, TOut>` — a typed transformer that receives one shape of data and produces another:

```typescript
import { type Rigatone } from '@pasta-protocol/core';

// A rigatone that normalises incoming order amounts
const normalizzaImporto: Rigatone<OrdineRaw, OrdineNormalizzato> = {
  name: 'normalizza-importo',
  async process(input: OrdineRaw): Promise<OrdineNormalizzato> {
    return {
      ...input,
      importo: Math.round(input.importo * 100) / 100,
      valuta: input.valuta.toUpperCase(),
    };
  },
};
```

A `Rigatone` is stateless by design. If you need shared state across invocations, inject it through a `Dispensa` (the Pasta Protocol repository abstraction) rather than closing over mutable variables. Stateless rigatoni can be replicated across nodes without coordination.

## Building a Pipeline

Pipelines are assembled with `PipelineBuilder`, a fluent API that composes rigatoni left to right and validates type compatibility at compile time:

```typescript
import { PipelineBuilder } from '@pasta-protocol/core';
import { DispennaAdapter } from '@pasta-protocol/dispensa';

const ordinePipeline = new PipelineBuilder<OrdineRaw>('ordine-pipeline')
  .pipe(validaOrdine)       // Rigatone<OrdineRaw, OrdineValidato>
  .pipe(normalizzaImporto)  // Rigatone<OrdineValidato, OrdineNormalizzato>
  .pipe(arricchisciCliente) // Rigatone<OrdineNormalizzato, OrdineCompleto>
  .pipe(persistiOrdine)     // Rigatone<OrdineCompleto, OrdineConfermato>
  .build();
```

TypeScript will reject your pipeline at compile time if adjacent rigatoni have incompatible types — just as a chef would refuse to pass a bowl of soup through a meat grinder. The `build()` call freezes the pipeline and returns an immutable `Pipeline<OrdineRaw, OrdineConfermato>` instance.

## Running a Pipeline

Once built, a pipeline is invoked through the `KitchenManager`:

```typescript
import { KitchenManager } from '@pasta-protocol/core';

const kitchen = await KitchenManager.avvia('kitchen.ricetta');

const risultato = await kitchen.cuoci(ordinePipeline, ordineRaw);

if (risultato.ok) {
  console.log('Ordine confermato:', risultato.value.id);
} else {
  // risultato.error carries the error level and code
  // BRUSCHETTA = informational, PEPERONCINO = warning,
  // VESUVIO = critical, TERREMOTO = fatal
  console.error(`[${risultato.error.livello}] ${risultato.error.messaggio}`);
}
```

The `cuoci` method executes each rigatone in sequence on the same thread. If a stage throws, the error is caught and wrapped in a `PastaError` with the appropriate severity level — no unhandled rejections escape the tube.

## Parallel Tubes: `FornoBatch`

When you need to process many items concurrently, wrap your pipeline in a `FornoBatch`. This distributes items across a configurable pool of workers, each running an independent copy of the pipeline:

```typescript
import { FornoBatch } from '@pasta-protocol/core';

const forno = new FornoBatch(ordinePipeline, { concurrency: 8 });

const ordini: OrdineRaw[] = await fetchOrdiniPendenti();

const risultati = await forno.inforna(ordini);

const falliti = risultati.filter(r => !r.ok);
if (falliti.length > 0) {
  kitchen.logger.warn(`PEPERONCINO: ${falliti.length} ordini non elaborati`);
}
```

`FornoBatch` respects back-pressure: if the downstream `persistiOrdine` stage is slower than incoming items, the batch automatically throttles ingestion rather than building an unbounded queue. Think of it as the oven regulating its own temperature.

## Error Propagation

Pasta Protocol's error levels map naturally to pipeline stages:

| Livello | Significato | Comportamento |
|---------|-------------|---------------|
| `BRUSCHETTA` | Soft anomaly, data recoverable | Pipeline continues, event emitted |
| `PEPERONCINO` | Warning, partial data loss possible | Pipeline continues with degraded result |
| `VESUVIO` | Critical failure in this item | Item aborted, pipeline continues for others |
| `TERREMOTO` | Fatal — entire pipeline must stop | `FornoBatch` halts, operator alerted |

A rigatone signals its severity by throwing a `PastaError` with the appropriate level, or by returning a `Result.err(...)` from a `SafeRigatone`. Only `TERREMOTO`-level errors propagate beyond the current `FornoBatch`.

## Testing Rigatoni in Isolation

Because each rigatone is a plain TypeScript object, unit testing is straightforward:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizzaImporto } from './stages';

describe('normalizzaImporto', () => {
  it('rounds to two decimal places', async () => {
    const input: OrdineRaw = { importo: 12.3456789, valuta: 'eur', id: '1' };
    const output = await normalizzaImporto.process(input);
    expect(output.importo).toBe(12.35);
    expect(output.valuta).toBe('EUR');
  });
});
```

No mocks, no kitchen bootstrapping, no network. A single rigatone can be verified in milliseconds. This is the Neapolitan way: test the ingredient before it goes into the pot.
