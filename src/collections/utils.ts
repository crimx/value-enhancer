import type { ReadonlyVal, UnwrapVal } from "../typings";
import type { ReactiveCollection } from "./typings";

import { from } from "../from";
import { unwrapFrom } from "../unwrap-from";

/**
 * Create a readonly val from a reactive collection watching a specific key.
 *
 * @param collection The reactive collection
 * @param key The key to watch
 * @returns A readonly val watching the item at the specified key
 *
 * @example
 * ```ts
 * import { ReactiveMap, fromCollection } from "value-enhancer/collections"
 *
 * const map = new ReactiveMap();
 *
 * const item$ = fromCollection(map, "someKey"); // watch the item at "someKey"
 *
 * console.log(item$.value); // undefined
 *
 * map.set("someKey", "someValue");
 *
 * console.log(item$.value); // "someValue"
 * ```
 */
export const fromCollection = <TKey = any, TValue = any>(
  collection: ReactiveCollection<TKey, TValue>,
  key: TKey
): ReadonlyVal<TValue | undefined> =>
  from(
    () => collection.get(key),
    notify =>
      collection.watch(k => {
        if (!k || k === key) {
          notify();
        }
      })
  );

/**
 * Create a readonly val from a reactive collection watching a specific key.
 * Auto-unwrap the value of the item if it is a Val.
 *
 * @param collection The reactive collection
 * @param key The key to watch
 * @returns A readonly val watching the item at the specified key
 *
 * @example
 * ```ts
 * import { ReactiveMap, unwrapFromCollection } from "value-enhancer/collections"
 * import { val } from "value-enhancer";
 *
 * const map = new ReactiveMap();
 * const v = val("someValue")
 *
 * const item$ = unwrapFromCollection(map, "someKey"); // watch the item at "someKey"
 *
 * console.log(item$.value); // undefined
 *
 * map.set("someKey", v);
 *
 * console.log(item$.value); // "someValue"
 *
 * v.set("someValue2");
 *
 * console.log(item$.value); // "someValue2"
 * ```
 */
export const unwrapFromCollection = <TKey = any, TValue = any>(
  collection: ReactiveCollection<TKey, TValue>,
  key: TKey
): ReadonlyVal<UnwrapVal<TValue> | undefined> =>
  unwrapFrom(
    () => collection.get(key),
    notify =>
      collection.watch(k => {
        if (!k || k === key) {
          notify();
        }
      })
  );
