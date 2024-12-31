# [value-enhancer](https://github.com/crimx/value-enhancer)

<p align="center">
  <img width="200" src="https://raw.githubusercontent.com/crimx/value-enhancer/main/assets/value-enhancer.svg">
</p>

[![Docs](https://img.shields.io/badge/Docs-read-%23fdf9f5)](https://crimx.github.io/value-enhancer)
[![Build Status](https://github.com/crimx/value-enhancer/actions/workflows/build.yml/badge.svg)](https://github.com/crimx/value-enhancer/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/value-enhancer.svg)](https://www.npmjs.com/package/value-enhancer)
[![Coverage Status](https://img.shields.io/coverallsCoverage/github/crimx/value-enhancer)](https://coveralls.io/github/crimx/value-enhancer)
[![minified-size](https://img.shields.io/bundlephobia/minzip/value-enhancer)](https://bundlephobia.com/package/value-enhancer)

Enhance value with plain and explicit reactive wrapper. Think of it as hook-style signals.

Legacy versions: [v5](https://value-enhancer.js.org/v5/)

## Features

- Plain reactivity.  
  Without the implicit-cast Proxy magic like Vue Reactivity and MobX.
- Single-layer shallow reactivity.  
  It does not convert the value with `Object.defineProperty` nor `Proxy`. Keeping everything as plain JavaScript value makes it easier to work with other libraries and easier for the JavaScript engine to optimize.
- Safe and fast lazy computation.  
  It solves multi-level derivation issue (like in [Svelte Stores](<(https://svelte.dev/repl/6218ae0ecf5c455195b4a76d7f0cff9f?version=3.49.0)>)) with smart lazy value evaluation.
- Weak side effects.  
  `Val`s are managed with `FinalizationRegistry` and `WeakRef` which means you can create and access derived `Val.value` without worrying about memory leaks. Disposers returned by subscriptions can also be easily managed with libraries like [`@wopjs/disposable`](https://github.com/wopjs/disposable).
- Explicit.  
  Reactive objects are easy to tell since their types are different from normal objects. Subscription also requires explicit dependency declaration which reduce the work of repetitive dynamic dependency collection in Proxy/Signal implementations.
- Simple DX.  
  Designed with ergonomics in mind. No hidden rules for getting or setting values. What you see is what you get.

## Install

```bash
npm add value-enhancer
```
