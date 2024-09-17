import { ValVersion } from "./typings";
import { strictEqual } from "./utils";

const objectVersion = new WeakMap<WeakKey, ValVersion>();

const isObject = (value: unknown): value is object =>
  strictEqual(Object(value), value);

export const uniqueVersion = () => Symbol();

export const getVersion = (value: unknown): ValVersion =>
  isObject(value)
    ? objectVersion.get(value) ||
      objectVersion.set(value, uniqueVersion()).get(value)!
    : value;
