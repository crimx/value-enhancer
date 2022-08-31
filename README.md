# value-enhancer

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/crimx/value-enhancer/master/assets/value-enhancer.svg">
</p>

[![Build Status](https://github.com/crimx/value-enhancer/actions/workflows/build.yml/badge.svg)](https://github.com/crimx/value-enhancer/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/value-enhancer.svg)](https://www.npmjs.com/package/value-enhancer)
[![Coverage Status](https://img.shields.io/coveralls/github/crimx/value-enhancer/master)](https://coveralls.io/github/crimx/value-enhancer?branch=master)
[![minified-size](https://img.shields.io/bundlephobia/minzip/value-enhancer)](https://bundlephobia.com/package/value-enhancer)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?maxAge=2592000)](http://commitizen.github.io/cz-cli/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg?maxAge=2592000)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

A tiny library to enhance value with reactive wrapper.

[(v1 docs)](https://github.com/crimx/value-enhancer/tree/v1)

## Install

```bash
npm add value-enhancer
```

## Features

- RxJS-style reactivity.  
  Without the implicit-cast Proxy magic like Vue Reactivity and MobX.
- Single-layer shallow reactivity.  
  It does not convert the value with `Object.defineProperty` nor `Proxy`. Keeping everything as plain JavaScript value makes it easier to work with other libraries and easier for the JavaScript engine to optimize.
- Explicit.  
  Reactive objects are easy to tell since their types are different from normal objects. Subscription also requires explicit dependency declaration which reduce the work of repetitive dynamic dependency collection in Proxy implementations.
- Simple DX.  
  No hidden rules for getting or setting values. What you see is what you get.
- Bundle size and Performance.  
  By carefully defining scope and choosing right features that balance usability and performance, less work needed to be done in `value-enhancer` which makes it smaller and faster.

## Quick Q&A

<details>
<summary>Why not MobX?</summary>

MobX is cleverly designed to make properties magically reactive. But after using it in many of our large projects people started to complain about this implicit behavior. It is hard to tell if a property is reactive unless enforcing some kind of code style rules. Rules of MobX are easy to be broken especially for new team members.

MobX does not work well with other libraries. It could break other libraries if you forget to exclude instances from other libraries from making observable. `toJS` is also needed if data is passed to other libraries.

MobX also prints error when it sees another version of MobX in the global. It is not a good choice for making SDK or library that will be delivered into customer's environment.

In my opinion, the vision of MobX has to be implemented as language-level features, otherwise it will create all kinds of compatibility issues. Svelte, SolidJS and even Vue are heading towards the compiler direction now, looking forward to the next generation of MobX.

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

I love RxJS and the reactive paradigm behind it. But the goal of RxJS is to compose asynchronous or callback-based code.

It requires you to write code in a pipe-able way which may not be acceptable for everyone.

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

`value-enhancer` can be used in React with [`use-value-enhancer`](https://www.npmjs.com/package/use-value-enhancer) hook.

</details>

<details>
<summary>Svelte Stores?</summary>

Svelte offers excellent support for Observables. Svelte store is one of the simplest implementations. The code is really neat and clean.

Svelte store works well for simple cases but it also leaves some edge cases unresolved. For example, when `derived` a list of stores, the transform function could be [invoked with intermediate states](https://svelte.dev/repl/6218ae0ecf5c455195b4a76d7f0cff9f?version=3.49.0).

Svelte also adds a `$xxx` syntax for subscribing Observables as values. The compiled code is really simple and straightforward.

`value-enhancer` is compatible with Svelte Store contract. It can be used in Svelte just like Svelte stores.

</details>

<details>
<summary>SolidJS?</summary>

SolidJS "create"s are like React hooks but with saner signatures. It is also thoughtfully optimized for edge cases.

A thing that one may feel odd in SolidJS is accessing reactive value by calling it as function. `value-enhancer` keeps the `xxx.value` way to access reactive value which I think should be more intuitive.

It also suffers from implicit magic issues like MobX and Vue where you ended up using something like [`mergeProps`](https://www.solidjs.com/docs/latest/api#mergeprops) and [`splitProps`](https://www.solidjs.com/docs/latest/api#splitprops).

`value-enhancer` is compatible with SolidJS using [`from`](https://www.solidjs.com/docs/latest/api#from).

</details>

## Usage

```js
import { val, combine, derive } from "value-enhancer";

const count$ = val(2);

console.log(count$.value); // 2

count$.set(3);
console.log(count$.value); // 3

count$.subscribe(count => console.log(`subscribe: ${count}`)); // subscribe: 3

count$.reaction(count => console.log(`reaction: ${count}`)); // (nothing printed)

count$.set(3); // nothing happened

count$.value = 4; // subscribe: 4, reaction: 4

const derive$ = derive(count$, count => count * 3);
console.log(derived$.value); // 12
derived$.subscribe(derived => console.log(`derived: ${derived}`)); // derived: 12

const combined$ = combine(
  [count$, derived$],
  ([count, derived]) => count + derived
);
console.log(combined$.value); // 16
combined$.subscribe(combined => console.log(`combined: ${combined}`)); // combined: 16

count$.set(5); // subscribe: 5, reaction: 5, derived: 15, combined: 20
```
