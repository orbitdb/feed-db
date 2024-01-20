# @orbitdb/feed-db
Feed database type for orbit-db.

[![feed-db tests](https://github.com/orbitdb/feed-db/actions/workflows/run-test.yml/badge.svg?branch=main)](https://github.com/orbitdb/feed-db/actions/workflows/run-test.yml)
[![codecov](https://codecov.io/gh/orbitdb/feed-db/graph/badge.svg?token=7OZK4BJDej)](https://codecov.io/gh/orbitdb/feed-db)

## Installation
```
$ pnpm add @constl/orbit-db-feed
```
## Introduction
`Feed` database for those feeling nostalgic for orbit-db v.0.x. But honestly, you're probably better off with a [`KeyValue`](https://github.com/orbitdb/core) or a [`Set`](https://github.com/orbitdb/set).

## Examples
```ts
import { createOrbit } from "@orbitdb/core";
import { registerFeed } from "@orbitdb/feed-db";

// Register database type. IMPORTANT - must call before creating orbit instance !
registerFeed();
const db = await orbit.open({ type: "feed" });

await db.add({ a: 1, b: "c" });

const all = await db.all();  // [{ value: { a: 1, b: "c" }, hash: "..." }]

await db.add({ a: 1, b: "c" });
await db.all();  
// [{ value: { a: 1, b: "c" }, hash: "..." }, { value: { a: 1, b: "c" }, hash: "..." }]
```
