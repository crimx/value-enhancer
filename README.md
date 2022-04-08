# value-enhancer

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/crimx/value-enhancer/master/assets/value-enhancer.svg">
</p>

[![Build Status](https://github.com/crimx/value-enhancer/actions/workflows/build.yml/badge.svg)](https://github.com/crimx/value-enhancer/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/value-enhancer.svg)](https://www.npmjs.com/package/value-enhancer)
[![Coverage Status](https://img.shields.io/coveralls/github/crimx/value-enhancer/master)](https://coveralls.io/github/crimx/value-enhancer?branch=master)
[![minified-size](https://badgen.net/bundlephobia/minzip/value-enhancer)](hhttps://bundlephobia.com/package/value-enhancer)
[![tree-shaking](https://badgen.net/bundlephobia/tree-shaking/value-enhancer)](hhttps://bundlephobia.com/package/value-enhancer)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?maxAge=2592000)](http://commitizen.github.io/cz-cli/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg?maxAge=2592000)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A tiny library to enhance value with reactive wrapper.

## Install

```bash
npm add value-enhancer
```

## Why

The goal of this lib is to bring reactivity to values like MobX but without the implicit-cast magic. It is like RxJS but trimmed and simplified with the focus on value changes instead of async operations which resulted in much smaller codebase.

## Usage

```js
import { Val, combine, derive } from "value-enhancer";

const val = new Val(2);

console.log(val.value); // 2

val.setValue(3);
console.log(val.value); // 3

val.subscribe(value => console.log(`subscribe: ${value}`)); // subscribe: 3

val.reaction(value => console.log(`reaction: ${value}`)); // (nothing printed)

val.setValue(3); // nothing happened

val.setValue(4); // subscribe: 4, reaction: 4

const derived = derive(val, value => value * 3);
console.log(derived.value); // 12
derived.subscribe(value => console.log(`derived: ${value}`)); // derived: 12

const combined = combine([val, derived], ([val, derived]) => val + derived);
console.log(combined.value); // 16
combined.subscribe(value => console.log(`combined: ${value}`)); // combined: 16

val.setValue(5); // subscribe: 5, reaction: 5, derived: 15, combined: 20
```

`setValue` may carry any type of extra info via `meta` param.

```ts
val.subscribe((value, meta) => console.log(value, meta));

val.setValue(5, { source: "remote" });
```

### Bind Instance

Val can be bound to a object via `withValueEnhancer`.

```ts
import type { ValEnhancedResult } from "value-enhancer";
import { Val, withValueEnhancer } from "value-enhancer";

interface Obj extends ValEnhancedResult<{ count: Val<number> }> {}

class Obj {
  constructor() {
    withValueEnhancer(this, {
      count: new Val(2),
    });
    // Three properties are created for each bound Val
    console.log(this.count, this.setCount, this._count$);
  }
  addOne(): void {
    this.setCount(this.count + 1);
  }
}
```
