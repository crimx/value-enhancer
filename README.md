# [value-enhancer](https://github.com/crimx/value-enhancer)

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/crimx/value-enhancer/main/assets/value-enhancer.svg">
</p>

[![Build Status](https://img.shields.io/github/actions/workflow/status/crimx/value-enhancer/build.yml)](https://github.com/crimx/value-enhancer/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/value-enhancer.svg)](https://www.npmjs.com/package/value-enhancer)
[![Coverage Status](https://img.shields.io/coveralls/github/crimx/value-enhancer/main)](https://coveralls.io/github/crimx/value-enhancer?branch=main)

[![full-size](https://img.shields.io/bundlephobia/minzip/value-enhancer)](https://bundlejs.com/?q=value-enhancer)
[![core-size](https://img.shields.io/bundlejs/size/value-enhancer?exports=val&label=core%20size)](https://bundlejs.com/?q=value-enhancer&treeshake=%5B%7Bval%7D%5D)
[![tree-shakable](https://img.shields.io/badge/%20tree-shakable-success)](https://bundlejs.com/?q=value-enhancer)
[![no-dependencies](https://img.shields.io/badge/dependencies-none-success)](https://bundlejs.com/?q=value-enhancer)
[![side-effect-free](https://img.shields.io/badge/%20side--effect-free-success)](https://bundlejs.com/?q=value-enhancer)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?maxAge=2592000)](http://commitizen.github.io/cz-cli/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg?maxAge=2592000)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A tiny library to enhance value with reactive wrapper.

Docs: <https://value-enhancer.js.org>

## Install

```bash
npm add value-enhancer
```

## Docs

<https://value-enhancer.js.org/>

## Features

- Plain reactivity.  
  Without the implicit-cast Proxy magic like Vue Reactivity and MobX.
- Single-layer shallow reactivity.  
  It does not convert the value with `Object.defineProperty` nor `Proxy`. Keeping everything as plain JavaScript value makes it easier to work with other libraries and easier for the JavaScript engine to optimize.
- Safe and fast lazy computation.  
  It solves multi-level derivation issue (like in Svelte Stores) with smart lazy value evaluation.
- Explicit.  
  Reactive objects are easy to tell since their types are different from normal objects. Subscription also requires explicit dependency declaration which reduce the work of repetitive dynamic dependency collection in Proxy/Signal implementations.
- Simple DX.  
  Designed with ergonomics in mind. No hidden rules for getting or setting values. What you see is what you get.
- Bundle size and Performance.  
  By carefully defining scope and choosing right features that balance usability and performance, less work needed to be done in `value-enhancer` which makes it smaller and faster.

## Quick Q&A

<details>
<summary>Why not MobX?</summary>

MobX is cleverly designed to make properties magically reactive. But after using it in many of our large projects people started to complain about this implicit behavior. It is hard to tell if a property is reactive unless enforcing some kind of code style rules. Rules of MobX are easy to be broken especially for new team members.

MobX does not work well with other libraries. It could break other libraries if you forget to exclude third-party instances from making observable. `toJS` is also needed if data is passed to other libraries.

MobX also prints error when it sees another version of MobX in the global. It is not a good choice for making SDK or library that will be delivered into customer's environment.

In my opinion, the vision of MobX has to be implemented as language-level features, otherwise it will create all kinds of compatibility issues. Svelte, SolidJS and even Vue are heading towards the compiler direction now, looking forward to the next generation of MobX.

In `value-enhancer` reactive Vals and plain JavaScript values are easy to distinguish since they have different types. The values of reactive Vals are still plain JavaScript values so it works fine with other libraries. It is small and does not have global variable issues.

</details>

<details>
<summary>Why not Vue Reactivity?</summary>

Vue3 brings Reactivity as standalone APIs. It is beautifully designed and I had learned a lot from its source code.

But even though it is made standalone, it is still very Vue centered. Many extra works related to Vue Components are added under the hood.

Vue supports lazy deep reactive conversion. It converts plain JavaScript values into reactive values which means it also suffers from the same issues of MobX.

It is a good choice if you are choosing the Vue ecosystem. The implementation of `value-enhancer` absorbs many optimization strategies from Vue Reactivity while staying framework agnostic.

</details>

<details>
<summary>Why not RxJS?</summary>

I love RxJS and the reactive paradigm behind it. But the goal of RxJS is to compose asynchronous or callback-based code. It is not optimized for state management.

It also requires you to write code in a pipe-able way which may not be acceptable for everyone.

</details>

<details>
<summary>What about React Hooks?</summary>

The signature of `combine` and `derive` in `value-enhancer` may look familiar to those who have used React hooks.

```ts
import { useMemo } from "react";

const derived = useMemo(() => source + 1, [source]);
```

I really like the explicit dependency declaration, but in React it is error-prone since people keep forgetting adding or removing dependencies. The React team even made a `exhaustive-deps` linter rule for this.

`value-enhancer` solves this by absorbing the RxJS-style callbacks.

```ts
import { val, derive, combine } from "value-enhancer";

const source$ = val(1);
console.log(source$.value); // 1

const derived$ = derive(source$, source => source + 1);
console.log(derived$.value); // 2

const combined$ = combine(
  [source$, derived$],
  ([source, derived]) => source + derived
);
console.log(combined$.value); // 3
```

Since the type of reactive objects are different from its values, it is hard to have mismatched dependencies inside the `transform` function.

`value-enhancer` can be used in React with a super-simple hook [`use-value-enhancer`](https://www.npmjs.com/package/use-value-enhancer).

</details>

<details>
<summary>Svelte Stores?</summary>

Svelte offers excellent support for Observables. Svelte store is one of the simplest implementations. The code is really neat and clean.

Svelte store works well for simple cases but it also leaves some edge cases unresolved. For example, when `derived` a list of stores, the transform function could be [invoked with intermediate states](https://svelte.dev/repl/6218ae0ecf5c455195b4a76d7f0cff9f?version=3.49.0).

Svelte also adds a `$xxx` syntax for subscribing Observables as values. The compiled code is really simple and straightforward.

`value-enhancer` is compatible with Svelte Store contract. It can be used in Svelte just like Svelte stores.

`value-enhancer` also fixes the edge cases of Svelte stores by leveraging Vue's layered subscriber design.

</details>

<details>
<summary>SolidJS?</summary>

SolidJS "create"s are like React hooks but with saner signatures. It is also thoughtfully optimized for edge cases.

A thing that one may feel odd in SolidJS is accessing reactive value by calling it as function. `value-enhancer` keeps the `xxx.value` way to access reactive value which I think should be more intuitive.

It also suffers from implicit magic issues like MobX and Vue where you ended up using something like [`mergeProps`](https://www.solidjs.com/docs/latest/api#mergeprops) and [`splitProps`](https://www.solidjs.com/docs/latest/api#splitprops).

`value-enhancer` is compatible with SolidJS using [`from`](https://www.solidjs.com/docs/latest/api#from).

</details>

<details>
<summary>Preact Signals?</summary>

Preact recently released [Signals](https://preactjs.com/blog/introducing-signals/) which shares similar ideas with `value-enhancer`. It is like signals of SolidJS but without the odd function-like value accessing. It flushes reactions top-down then bottom-up like Vue and `value-enhancer`.

The Preact team also took a step further to support writing Signals directly within TSX. This offers Svelte-like neat coding experience.

```tsx
const count = signal(0);

// Instead of this:
<p>Value: {count.value}</p>

// … we can pass the signal directly into JSX:
<p>Value: {count}</p>

// … or even passing them as DOM properties:
<input value={count} />
```

But it also uses Vue-like magic to collect effects.

```tsx
const counter = signal(0);

effect(() => {
  console.log(counter.value);
});
```

It might seem clean at first but it's not a self-consistent solution either. You'll probably meet weird issues and find workarounds like [`signal.peek()`](https://github.com/preactjs/signals#signalpeek) which is error-prone.

```tsx
const counter = signal(0);
const effectCount = signal(0);

effect(() => {
  console.log(counter.value);

  // Whenever this effect is triggered, increase `effectCount`.
  // But we don't want this signal to react to `effectCount`
  effectCount.value = effectCount.peek() + 1;
});
```

This issue does not exist in `value-enhancer` because we do not collect dependencies implicitly.

</details>

## Usage

## Create Writable Val

```js
import { val } from "value-enhancer";

const count$ = val(2);

console.log(count$.value); // 2

count$.set(3);
console.log(count$.value); // 3

count$.value = 4;
console.log(count$.value); // 4
```

## Create Readonly Val

```js
import { readonlyVal } from "value-enhancer";

const [count$, setCount] = readonlyVal(2);

console.log(count$.value); // 2

setCount(3);
console.log(count$.value); // 3

count$.value = 4;
console.log(count$.value); // 4
```

## Subscribe to value changes

```js
import { val, combine, derive } from "value-enhancer";

const count$ = val(3);

// Emit the current value synchronously, then emit the new value when it changes.
const disposeSubscribe = count$.subscribe(count => {
  console.log(`subscribe: ${count}`);
}); // printed "subscribe: 3"

// Only emit the new value when it changes.
const disposeReaction = count$.reaction(count => {
  console.log(`reaction: ${count}`);
}); // (nothing printed)

// `Object.is` equality check by default
count$.set(3); // nothing happened

// subscription triggered asynchronously by default
count$.set(4); // nothing happened

await Promise.resolve(); // subscription triggered asynchronously by default

// printed "subscribe: 4"
// printed "reaction: 4"

disposeSubscribe();
disposeReaction();
```

## Derive Val

`derive` a new Val from another Val.

```js
import { val, derive } from "value-enhancer";

const count$ = val(2);

const derived$ = derive(count$, count => count * 3);

console.log(derived$.value); // 6
```

## Combine Val

`combine` multiple Vals into a new Val.

```js
import { val, derive, combine } from "value-enhancer";

const count$ = val(2);

const derived$ = derive(count$, count => count * 3);

const combined$ = combine(
  [count$, derived$],
  ([count, derived]) => count + derived
);

console.log(combined$.value); // 8
```

## Flatten Val

`flatten` the inner Val from a Val of Val. This is useful for subscribing to a dynamic Val that is inside another Val.

```js
import { val, flatten } from "value-enhancer";

const itemList$ = val([val(1), val(2), val(3)]);

const firstItem$ = flatten(itemList$, itemList => itemList[0]);

console.log(firstItem$.value); // 1

itemList$.set([val(4), val(5), val(6)]);

console.log(firstItem$.value); // 4
```

## From

`from` creates a Val from any value source. Both `derive` and `combine` are implemented using `from`.

```ts
import { from } from "value-enhancer";

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

const isDarkMode$ = from(
  () => prefersDark.matches,
  notify => {
    prefersDark.addEventListener("change", notify);
    return () => prefersDark.removeEventListener("change", notify);
  }
);
```

## FlattenFrom

`flattenFrom` creates a Val from any value source like `from` but also flatten the value if the value is a Val. `flatten` is implemented using `flattenFrom`.

## Custom Equal

By default, `Object.is` equality check is used to determine whether a value has changed. You can customize the equality check by passing a `equal` function.

```js
import { val } from "value-enhancer";

const isSameXYPosition = (p1, p2) => p1.x === p2.x && p1.y === p2.y;
const isSameXYZPosition = (p1, p2) =>
  p1.x === p2.x && p1.y === p2.y && p1.z === p2.z;

const xyzPosition$ = val({ x: 0, y: 0, z: 0 }, { equal: isSameXYZPosition });
const xyPosition$ = derive(xyPosition, { equal: isSameXYPosition });

xyPosition$.set({ x: 0, y: 0, z: 0 }); // nothing happened
```

## Synchronous subscription

Subscription is triggered asynchronously on next tick by default. To trigger synchronously, set `eager` parameter to `true`.

```js
count$.subscribe(count => console.log(`subscribe: ${count}`), true);
count$.reaction(count => console.log(`reaction: ${count}`), true);
```

Or set `eager` to `true` when creating the Val.

```js
// subscription of count$ is trigger synchronously by default
const count$ = val(3, { eager: true });

const derived$ = derive(count$, count => count * 3, { eager: true });
```

## Use in Class

With `groupVals` you can easily create a group of ReadonlyVals and hide the setters.

```ts
import {
  type ReadonlyVal,
  type ValSetValue,
  type FlattenVal,
  readonlyVal,
  groupVals,
} from "value-enhancer";

export interface Foo$ {
  a: ReadonlyVal<number>;
  b: ReadonlyVal<number>;
  c: ReadonlyVal<string>;
}

export class Foo {
  public readonly $: Foo$;
  private setVals: { [K in keyof Foo$]: ValSetValue<FlattenVal<Foo$[K]>> };

  public constructor() {
    const [vals, setVals] = groupVals({
      a: readonlyVal(1),
      b: readonlyVal(2),
      c: readonlyVal("3"),
    });
    this.$ = vals;
    this.setVals = setVals;
  }

  public myMethod() {
    this.setVals.a(2);
    this.setVals.c("4");
  }
}

const foo = new Foo();
console.log(foo.$.a.value); // 1

foo.myMethod();
console.log(foo.$.a.value); // 2
```

## Reactive Collections

The Reactive Collections are a group of classes that expand on the built-in JavaScript collections, allowing changes to the collections to be observed. See [docs](https://value-enhancer.js.org/modules/collections.html) for API details.

```ts
import { derive } from "value-enhancer";
import { ReactiveList } from "value-enhancer/collections";

const list = new ReactiveList(["a", "b", "c"]);

const item$ = derive(list.$, list => list.get(2)); // watch the item at index 2

console.log(item$.value); // "c"

list.set(2, "d");

console.log(item$.value); // "d"
```

```ts
import { val, flatten } from "value-enhancer";
import { ReactiveMap } from "value-enhancer/collections";

const map = new ReactiveMap();
const v = val("someValue");

const item$ = flatten(map.$, map => map.get("someKey")); // watch the item at "someKey"

console.log(item$.value); // undefined

map.set("someKey", v);

console.log(item$.value); // "someValue"

v.set("someValue2");

console.log(item$.value); // "someValue2"
```
