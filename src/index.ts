import { initDev } from "./dev";

export { combine, type CombineValTransform } from "./combine";
export { compute } from "./compute";
export { derive, type DerivedValTransform } from "./derive";
export { flatten } from "./flatten";
export { flattenFrom } from "./flatten-from";
export { from } from "./from";
export { nextTick } from "./scheduler";
export type {
  FlattenVal,
  ReadonlyVal,
  UnwrapVal,
  Val,
  ValConfig,
  ValDisposer,
  ValEqual,
  ValSetValue,
  ValSubscriber,
  ValVersion,
} from "./typings";
export {
  arrayShallowEqual,
  attachSetter,
  identity,
  isVal,
  isWritable,
  reaction,
  setValue,
  strictEqual,
  subscribe,
  unsubscribe,
} from "./utils";
export { groupVals, readonlyVal, val } from "./val";

if (process.env.NODE_ENV !== "production") {
  initDev();
}
