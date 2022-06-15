import { describe, it, expect, vi } from "vitest";
import type {
  ReadonlyValEnhancedResult,
  ValEnhancedResult,
} from "../src/value-enhancer";
import { withReadonlyValueEnhancer } from "../src/value-enhancer";
import {
  Val,
  withValueEnhancer,
  bindInstance,
  ValManager,
} from "../src/value-enhancer";

describe("bindInstance", () => {
  it("should bind instance", () => {
    const val = new Val(1);
    const instance = bindInstance({}, "aKey", val);
    expect(instance.aKey).toBe(1);
    expect(instance._aKey$).toBe(val);
    expect(typeof instance.setAKey).toBe("function");
  });
});

describe("withValueEnhancer", () => {
  it("should add attributes to class", () => {
    interface Test1 extends ValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      str: string;
      constructor() {
        this.str = "str";
        withValueEnhancer(this, {
          member: new Val(2),
        });
      }
      addOne(): void {
        this.setMember(this.member + 1);
      }
    }

    const test1 = new Test1();
    expect(test1.member).toBe(2);

    test1.setMember(3);
    expect(test1.member).toBe(3);

    test1.addOne();
    expect(test1.member).toBe(4);

    test1.member += 1;
    expect(test1.member).toBe(5);
  });

  it("should have access to val instance", () => {
    interface Test1 extends ValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      str: string;
      constructor() {
        this.str = "str";
        withValueEnhancer(this, {
          member: new Val(2),
        });
      }
    }

    const test1 = new Test1();
    const spy = vi.fn();

    test1._member$.reaction(spy);
    expect(spy).toBeCalledTimes(0);

    test1.setMember(3);
    expect(spy).toBeCalledTimes(1);
  });

  it("should attach to val manager if provided", () => {
    interface Test1 extends ValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      public exposedValManagerForTesting: ValManager;

      constructor() {
        const valManager = new ValManager();
        this.exposedValManagerForTesting = valManager;

        withValueEnhancer(
          this,
          {
            member: new Val(2),
          },
          valManager
        );
      }
    }

    const test1 = new Test1();
    expect(test1.exposedValManagerForTesting.vals).toHaveLength(1);
  });

  describe("subscribe", () => {
    it("should subscribe", () => {
      const spy = vi.fn();

      interface Test1 extends ValEnhancedResult<{ member: Val<number> }> {}

      class Test1 {
        constructor() {
          withValueEnhancer(this, {
            member: new Val(2),
          });
        }
      }

      const test1 = new Test1();
      test1.onValChanged("member", spy);

      expect(spy).toBeCalledTimes(0);

      test1.setMember(3);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(3, undefined);

      test1.setMember(4, "t");
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(4, "t");
    });

    it("should work with multiple val configs", () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spyError = vi.fn();

      type Config1 = { a: Val<number> };
      type Config2 = { b: Val<boolean> };
      type CombinedResult = ValEnhancedResult<Config1> &
        ValEnhancedResult<Config2>;
      interface Test1 extends CombinedResult {}

      class Test1 {
        constructor() {
          withValueEnhancer(this, {
            a: new Val(2),
            b: new Val(true),
          });
        }
      }

      const test1 = new Test1();
      test1.onValChanged("a", spy1);
      test1.onValChanged("b", spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      test1.setA(3);
      test1.setB(false);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(3, undefined);
      expect(spy2).lastCalledWith(false, undefined);

      test1.setA(4, "a");
      test1.setB(true, "b");
      expect(spy1).toBeCalledTimes(2);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(4, "a");
      expect(spy2).lastCalledWith(true, "b");

      try {
        // @ts-expect-error - no c val
        test1.onValChanged("c", spy2);
      } catch (e) {
        spyError(e);
      }
      expect(spyError).toBeCalledTimes(1);
    });

    it("should work with withReadonly val", () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spyError = vi.fn();
      const a$ = new Val(2);
      const b$ = new Val(true);

      type Config1 = { a: Val<number> };
      type Config2 = { b: Val<boolean> };
      type CombinedResult = ValEnhancedResult<Config1> &
        ReadonlyValEnhancedResult<Config2>;
      interface Test1 extends CombinedResult {}

      class Test1 {
        constructor() {
          withValueEnhancer(this, {
            a: a$,
          });

          withReadonlyValueEnhancer(this, {
            b: b$,
          });
        }
      }

      const test1 = new Test1();
      // @ts-expect-error - no setValue for readonly val
      expect(test1.setB).toBeUndefined();

      test1.onValChanged("a", spy1);
      test1.onValChanged("b", spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      a$.setValue(3);
      b$.setValue(false);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(3, undefined);
      expect(spy2).lastCalledWith(false, undefined);

      a$.setValue(4, "a");
      b$.setValue(true, "b");
      expect(spy1).toBeCalledTimes(2);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(4, "a");
      expect(spy2).lastCalledWith(true, "b");

      try {
        // @ts-expect-error - no c val
        test1.onValChanged("c", spy2);
      } catch (e) {
        spyError(e);
      }
      expect(spyError).toBeCalledTimes(1);
    });
  });
});
