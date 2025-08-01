# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [5.6.1](https://github.com/crimx/value-enhancer/compare/v5.6.0...v5.6.1) (2025-08-01)

## [5.6.0](https://github.com/crimx/value-enhancer/compare/v5.5.3...v5.6.0) (2025-08-01)


### Features

* add watch ([4f060b8](https://github.com/crimx/value-enhancer/commit/4f060b882799735befaf3690aee8b70e6355da90))

### [5.5.3](https://github.com/crimx/value-enhancer/compare/v5.5.2...v5.5.3) (2025-06-04)

### [5.5.2](https://github.com/crimx/value-enhancer/compare/v5.5.1...v5.5.2) (2025-04-03)


### Bug Fixes

* should notify if some keys with same value are removed ([f9b4455](https://github.com/crimx/value-enhancer/commit/f9b44558f8b5027d1b5cec55fb47e7798e40249a))

### [5.5.1](https://github.com/crimx/value-enhancer/compare/v5.5.0...v5.5.1) (2024-12-24)

## [5.5.0](https://github.com/crimx/value-enhancer/compare/v5.4.6...v5.5.0) (2024-09-04)


### Features

* **reactive-map:** add rename ([a7080de](https://github.com/crimx/value-enhancer/commit/a7080de84968323ff253774506a990ded4e5a69a))

### [5.4.6](https://github.com/crimx/value-enhancer/compare/v5.4.5...v5.4.6) (2024-07-19)


### Bug Fixes

* use lowercase `jsdelivr` ([#3](https://github.com/crimx/value-enhancer/issues/3)) ([b839826](https://github.com/crimx/value-enhancer/commit/b839826b14e336e5ec7317816fb6873c75b9278d))

### [5.4.5](https://github.com/crimx/value-enhancer/compare/v5.4.4...v5.4.5) (2024-07-16)

### [5.4.4](https://github.com/crimx/value-enhancer/compare/v5.4.3...v5.4.4) (2024-07-15)

### [5.4.3](https://github.com/crimx/value-enhancer/compare/v5.4.2...v5.4.3) (2024-07-15)

### [5.4.2](https://github.com/crimx/value-enhancer/compare/v5.4.1...v5.4.2) (2024-06-20)


### Bug Fixes

* **map:** trigger onDelete for replacing same key ([a956c0a](https://github.com/crimx/value-enhancer/commit/a956c0abc09bd9cee704cb029dbabbdce2938c4d))

### [5.4.1](https://github.com/crimx/value-enhancer/compare/v5.4.0...v5.4.1) (2024-05-22)

## [5.4.0](https://github.com/crimx/value-enhancer/compare/v5.3.0...v5.4.0) (2024-05-17)


### Features

* add compute ([dcdfbd3](https://github.com/crimx/value-enhancer/commit/dcdfbd33c0797ca38389b0629322269476067f17))

## [5.3.0](https://github.com/crimx/value-enhancer/compare/v5.2.1...v5.3.0) (2024-05-13)


### ⚠ BREAKING CHANGES

* `onChange`(`listen`) is called immediately on val creation instead of on first subscriber.
  No action is needed if the callback timing is insignificant(which should be the case in most scenarios).

### Features

* implement with FinalizationRegistry ([5b9c02a](https://github.com/crimx/value-enhancer/commit/5b9c02a8818a6844eeef19fd4ea0dc5498b404e1))

### [5.2.1](https://github.com/crimx/value-enhancer/compare/v5.2.0...v5.2.1) (2024-05-08)

## [5.2.0](https://github.com/crimx/value-enhancer/compare/v5.1.3...v5.2.0) (2024-05-02)


### Features

* add custom formatter ([fdbca03](https://github.com/crimx/value-enhancer/commit/fdbca03990178fde2209cca12653aa24c56da52d))
* add isWritable ([e5633ba](https://github.com/crimx/value-enhancer/commit/e5633ba1d95be99a5c3e02b8b6fe5f12666470e6))


### Bug Fixes

* **flatten-from:** follow source equal if equal is not provided ([e63308a](https://github.com/crimx/value-enhancer/commit/e63308ae7df26a7acc2e65a5ebf2f3910ce3c72d))

### [5.1.3](https://github.com/crimx/value-enhancer/compare/v5.1.2...v5.1.3) (2024-04-15)


### Features

* **utils:** export attachSetter ([8035ea9](https://github.com/crimx/value-enhancer/commit/8035ea9b12ea409a952f8f3c2409343da35bbd27))

### [5.1.2](https://github.com/crimx/value-enhancer/compare/v5.1.1...v5.1.2) (2024-04-08)


### Bug Fixes

* **collections:** trigger onDelete on setting new item ([6629c5b](https://github.com/crimx/value-enhancer/commit/6629c5bb2e959a4cee6bb205ee87c7a732ec1992))

### [5.1.1](https://github.com/crimx/value-enhancer/compare/v5.1.0...v5.1.1) (2024-03-23)


### Bug Fixes

* **collections:** clear collection on dispose ([aa490cb](https://github.com/crimx/value-enhancer/commit/aa490cb0b4ddec8998ba55458e32c4dda0a42d49))

## [5.1.0](https://github.com/crimx/value-enhancer/compare/v5.0.4...v5.1.0) (2024-03-23)


### Features

* **collections:** add onDelete config to reactive map and set ([7240e26](https://github.com/crimx/value-enhancer/commit/7240e26ff13741e535dc4e8036723ee4e2aed0f5))

### [5.0.4](https://github.com/crimx/value-enhancer/compare/v5.0.3...v5.0.4) (2024-03-04)

### [5.0.3](https://github.com/crimx/value-enhancer/compare/v5.0.2...v5.0.3) (2024-03-01)

### [5.0.2](https://github.com/crimx/value-enhancer/compare/v5.0.1...v5.0.2) (2024-02-23)


### Bug Fixes

* better type infer for empty array ([152ea5f](https://github.com/crimx/value-enhancer/commit/152ea5fcd789ac584f47d8e968180b8f6ceca581))

### [5.0.1](https://github.com/crimx/value-enhancer/compare/v5.0.0...v5.0.1) (2024-02-23)

## [5.0.0](https://github.com/crimx/value-enhancer/compare/v4.3.2...v5.0.0) (2024-02-22)

### [4.3.2](https://github.com/crimx/value-enhancer/compare/v4.3.1...v4.3.2) (2024-02-04)


### Bug Fixes

* **version:** update version on subscription ([ce88d0b](https://github.com/crimx/value-enhancer/commit/ce88d0b8c8b560060d9030241b7d3e016850ba40))

### [4.3.1](https://github.com/crimx/value-enhancer/compare/v4.3.0...v4.3.1) (2024-02-04)

## [4.3.0](https://github.com/crimx/value-enhancer/compare/v4.2.2...v4.3.0) (2024-02-04)


### Features

* add val version ([156b3f5](https://github.com/crimx/value-enhancer/commit/156b3f5b52bd814800dae52fdab442a5df98114f))
* **ref:** add ref to readonly val ([827b268](https://github.com/crimx/value-enhancer/commit/827b2681057c3880abab21e4d15327458fce9099))

### [4.2.2](https://github.com/crimx/value-enhancer/compare/v4.2.1...v4.2.2) (2024-02-02)


### Bug Fixes

* **collections:** replace not triggering val changes ([717d2d0](https://github.com/crimx/value-enhancer/commit/717d2d0982a881214a35888b34caba23145ff0e8))

### [4.2.1](https://github.com/crimx/value-enhancer/compare/v4.2.0...v4.2.1) (2024-01-26)

## [4.2.0](https://github.com/crimx/value-enhancer/compare/v4.1.2...v4.2.0) (2024-01-26)


### Features

* **val:** add ref val ([65e83fb](https://github.com/crimx/value-enhancer/commit/65e83fb97b0a5d989a68ee7eaf1110f6021ae689))

### [4.1.2](https://github.com/crimx/value-enhancer/compare/v4.1.1...v4.1.2) (2024-01-21)


### Bug Fixes

* **collections:** correct ReadonlyReactiveMap typo ([dbeb461](https://github.com/crimx/value-enhancer/commit/dbeb4610fb2323d4023f1d29ad6c45498b4b0a6c))

### [4.1.1](https://github.com/crimx/value-enhancer/compare/v4.1.0...v4.1.1) (2024-01-12)

## [4.1.0](https://github.com/crimx/value-enhancer/compare/v4.0.3...v4.1.0) (2024-01-05)

### [4.0.3](https://github.com/crimx/value-enhancer/compare/v4.0.2...v4.0.3) (2023-12-25)

### [4.0.2](https://github.com/crimx/value-enhancer/compare/v4.0.1...v4.0.2) (2023-12-22)

### [4.0.1](https://github.com/crimx/value-enhancer/compare/v4.0.0...v4.0.1) (2023-12-22)

## [4.0.0](https://github.com/crimx/value-enhancer/compare/v3.1.5...v4.0.0) (2023-12-21)

### [3.1.5](https://github.com/crimx/value-enhancer/compare/v3.1.4...v3.1.5) (2023-12-21)

### [3.1.4](https://github.com/crimx/value-enhancer/compare/v3.1.3...v3.1.4) (2023-11-23)


### Bug Fixes

* should trigger if values are emitted during subscription ([0737d4f](https://github.com/crimx/value-enhancer/commit/0737d4f441c50a346f7676c9476690c7ee09a574))

### [3.1.3](https://github.com/crimx/value-enhancer/compare/v3.1.2...v3.1.3) (2023-11-22)

### [3.1.2](https://github.com/crimx/value-enhancer/compare/v3.1.1...v3.1.2) (2023-10-31)

### [3.1.1](https://github.com/crimx/value-enhancer/compare/v3.1.0...v3.1.1) (2023-10-23)

## [3.1.0](https://github.com/crimx/value-enhancer/compare/v3.0.7...v3.1.0) (2023-10-23)


### Features

* **readonlyVal:** add groupVals ([9d18ac9](https://github.com/crimx/value-enhancer/commit/9d18ac998555606bd48a092d55fe5a2916c49d01))

### [3.0.7](https://github.com/crimx/value-enhancer/compare/v3.0.6...v3.0.7) (2023-10-20)

### [3.0.6](https://github.com/crimx/value-enhancer/compare/v3.0.5...v3.0.6) (2023-10-20)

### [3.0.5](https://github.com/crimx/value-enhancer/compare/v3.0.4...v3.0.5) (2023-08-10)

### [3.0.4](https://github.com/crimx/value-enhancer/compare/v3.0.3...v3.0.4) (2023-07-27)

### [3.0.3](https://github.com/crimx/value-enhancer/compare/v3.0.2...v3.0.3) (2023-07-27)

### [3.0.2](https://github.com/crimx/value-enhancer/compare/v3.0.1...v3.0.2) (2023-07-27)

### [3.0.1](https://github.com/crimx/value-enhancer/compare/v3.0.0...v3.0.1) (2023-07-27)

## [3.0.0](https://github.com/crimx/value-enhancer/compare/v2.4.4...v3.0.0) (2023-07-27)


### Features

* add from and unwrapFrom ([796d345](https://github.com/crimx/value-enhancer/commit/796d345dff8f3eedd96fda2cb1e46a59a5d82d40))
* add reactive collections ([54c6fa3](https://github.com/crimx/value-enhancer/commit/54c6fa3cfbdabe28fa7f6d5729d7992f5f731e77))


### Bug Fixes

* add unwrap value typing ([6df5b09](https://github.com/crimx/value-enhancer/commit/6df5b097ba1d74a2a1c536ee121f58d10053a2b3))
* fix reaction triggered on unchanged value ([0328e33](https://github.com/crimx/value-enhancer/commit/0328e332984f32d3c18decee1c49d505198e5781))

### [2.4.4](https://github.com/crimx/value-enhancer/compare/v2.4.3...v2.4.4) (2023-05-17)

### [2.4.3](https://github.com/crimx/value-enhancer/compare/v2.4.2...v2.4.3) (2023-03-27)

### [2.4.2](https://github.com/crimx/value-enhancer/compare/v2.4.1...v2.4.2) (2023-03-10)

### [2.4.1](https://github.com/crimx/value-enhancer/compare/v2.4.0...v2.4.1) (2023-03-03)

## [2.4.0](https://github.com/crimx/value-enhancer/compare/v2.3.3...v2.4.0) (2023-02-28)


### Features

* add default eager config ([ae0ea27](https://github.com/crimx/value-enhancer/commit/ae0ea27ffd9a7753b996ffc0eff296e87cff6eba))
* add setValue ([811d18a](https://github.com/crimx/value-enhancer/commit/811d18ae0043d90129145ba7538d1610d8fc5822))

### [2.3.3](https://github.com/crimx/value-enhancer/compare/v2.3.2...v2.3.3) (2023-02-13)

### [2.3.2](https://github.com/crimx/value-enhancer/compare/v2.3.1...v2.3.2) (2023-02-10)

### [2.3.1](https://github.com/crimx/value-enhancer/compare/v2.3.0...v2.3.1) (2023-02-08)

## [2.3.0](https://github.com/crimx/value-enhancer/compare/v2.2.0...v2.3.0) (2023-02-08)


### Features

* **unwrap:** support get function ([4a0c893](https://github.com/crimx/value-enhancer/commit/4a0c893afd255956d70a034d51af53aa0994fcc1))

## [2.2.0](https://github.com/crimx/value-enhancer/compare/v2.1.0...v2.2.0) (2023-02-03)


### Features

* support toString and toJSON of val value ([ee64f0f](https://github.com/crimx/value-enhancer/commit/ee64f0f4825a5c50f9baf21c03a95744ee0721dd))

## [2.1.0](https://github.com/crimx/value-enhancer/compare/v2.0.6...v2.1.0) (2023-01-23)


### Features

* add unwrap ([aeaaef1](https://github.com/crimx/value-enhancer/commit/aeaaef11e45cfcda62ff18983c6738a84331dea8))

### [2.0.6](https://github.com/crimx/value-enhancer/compare/v2.0.5...v2.0.6) (2022-10-17)


### Bug Fixes

* trigger subscribers after dirty value is cleared ([e5969dc](https://github.com/crimx/value-enhancer/commit/e5969dc6f62293ef37db2c2c7616ecbda1cc38dd))

### [2.0.5](https://github.com/crimx/value-enhancer/compare/v2.0.4...v2.0.5) (2022-10-17)

### [2.0.4](https://github.com/crimx/value-enhancer/compare/v2.0.3...v2.0.4) (2022-10-17)

### [2.0.3](https://github.com/crimx/value-enhancer/compare/v2.0.2...v2.0.3) (2022-10-16)

### [2.0.2](https://github.com/crimx/value-enhancer/compare/v2.0.1...v2.0.2) (2022-10-16)

### [2.0.1](https://github.com/crimx/value-enhancer/compare/v2.0.0...v2.0.1) (2022-09-22)


### Bug Fixes

* udpate d.ts entry ([7167ab2](https://github.com/crimx/value-enhancer/commit/7167ab299d4d8a74ff4d1a655160f29fc1e346be))

## [2.0.0](https://github.com/crimx/value-enhancer/compare/v2.0.0-alpha.0...v2.0.0) (2022-09-20)


### Features

* add top-level subscribe and reaction ([bee2126](https://github.com/crimx/value-enhancer/commit/bee2126b54c98845e63767502c956dc744ed4999))

## [2.0.0-alpha.0](https://github.com/crimx/value-enhancer/compare/v1.3.2...v2.0.0-alpha.0) (2022-08-27)

### [1.3.2](https://github.com/crimx/value-enhancer/compare/v1.3.0...v1.3.2) (2022-07-12)

## [1.3.0](https://github.com/crimx/value-enhancer/compare/v1.2.1...v1.3.0) (2022-06-15)


### Features

* add onValChanged for withValueEnhancer ([7a4d13a](https://github.com/crimx/value-enhancer/commit/7a4d13a642087703beaa02aa2d6b9abd624ecaa3))

### [1.2.1](https://github.com/crimx/value-enhancer/compare/v1.2.0...v1.2.1) (2022-06-10)

## [1.2.0](https://github.com/crimx/value-enhancer/compare/v1.1.1...v1.2.0) (2022-06-10)


### Features

* add val manager ([8d89dbf](https://github.com/crimx/value-enhancer/commit/8d89dbfc0f364c14486bc52bd9823e89b96dc81e))

### [1.1.1](https://github.com/crimx/value-enhancer/compare/v1.1.0...v1.1.1) (2022-06-02)


### Bug Fixes

* remove readonly val enhancer setter ([62aaf22](https://github.com/crimx/value-enhancer/commit/62aaf22fd099c1234d6de32c2692e837f16b9e5a))

## [1.1.0](https://github.com/crimx/value-enhancer/compare/v1.0.3...v1.1.0) (2022-06-01)


### Features

* add with readonly value enhancer ([1b96c9a](https://github.com/crimx/value-enhancer/commit/1b96c9abcc8b98a29c9c39af5044f5dfbc392722))

### [1.0.3](https://github.com/crimx/value-enhancer/compare/v1.0.2...v1.0.3) (2022-04-13)

### [1.0.2](https://github.com/crimx/value-enhancer/compare/v1.0.1...v1.0.2) (2022-04-08)

### [1.0.1](https://github.com/crimx/value-enhancer/compare/v1.0.0...v1.0.1) (2022-04-08)

## [1.0.0](https://github.com/crimx/value-enhancer/compare/v0.0.9...v1.0.0) (2022-04-07)

### 0.0.9 (2022-04-07)


### Features

* add enhanced combine val ([3efb541](https://github.com/crimx/value-enhancer/commit/3efb541597115eabcc99fe460fe291153e6b9599))
* add side-effect-binder ([e4543aa](https://github.com/crimx/value-enhancer/commit/e4543aa75f10f849aa084ca98a61c5eaa089466c))
* add value-enhancer ([7099609](https://github.com/crimx/value-enhancer/commit/70996096c3ef9bcce05d2c9edfbe738aedcebf4f))
* add withValueEnhancer ([91ee585](https://github.com/crimx/value-enhancer/commit/91ee585a3d6e336d75b1cb1dd4634facb7386396))
* v1 api ([bab746f](https://github.com/crimx/value-enhancer/commit/bab746f5a50b5389db3b1126293e5c24fc40d1ea))


### Bug Fixes

* add meta for enhanceVal ([6dfbd4a](https://github.com/crimx/value-enhancer/commit/6dfbd4ade54e9ed71de306136a9dbb87614f3aff))
* fix combine incorrect reaction params ([3319d50](https://github.com/crimx/value-enhancer/commit/3319d50f2de3eb8e9a50fd3891281256a751a17e))
