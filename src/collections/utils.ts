import type { ReadonlyVal, UnwrapVal } from "../typings";
import type { ReactiveCollection } from "./typings";

import { from } from "../from";
import { unwrapFrom } from "../unwrap-from";

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
