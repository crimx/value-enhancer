import type { FlattenVal, ReadonlyVal } from "../typings";
import type { ReactiveCollection } from "./typings";

import { flattenFrom } from "../flatten-from";
import { from } from "../from";

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
        if (k === key || k == null) {
          notify();
        }
      })
  );

/**
 * Create a readonly val from a reactive collection watching a specific key.
 * Auto-flatten the value of the item if it is a Val.
 *
 * @param collection The reactive collection
 * @param key The key to watch
 * @returns A readonly val watching the item at the specified key
 *
 * @example
 * ```ts
 * import { ReactiveMap, flattenFromCollection } from "value-enhancer/collections"
 * import { val } from "value-enhancer";
 *
 * const map = new ReactiveMap();
 * const v = val("someValue")
 *
 * const item$ = flattenFromCollection(map, "someKey"); // watch the item at "someKey"
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
export const flattenFromCollection = <TKey = any, TValue = any>(
  collection: ReactiveCollection<TKey, TValue>,
  key: TKey
): ReadonlyVal<FlattenVal<TValue> | undefined> =>
  flattenFrom(
    () => collection.get(key),
    notify =>
      collection.watch(k => {
        if (k === key || k == null) {
          notify();
        }
      })
  );
