import { type ValVersion } from "./typings";

const objectVersion = /* @__PURE__ */ new WeakMap<WeakKey, ValVersion>();

const isObject = (value: unknown): value is object =>
  value !== null && (typeof value === "object" || typeof value === "function");

export const getVersion = (value: unknown): ValVersion =>
  isObject(value) ? objectVersion.get(value) || objectVersion.set(value, Symbol()).get(value)! : value;
