import { describe, it, expect, vi } from "vitest";
import type {
  ReadonlyVal,
  ReadonlyValEnhancedResult,
} from "../src/value-enhancer";
import {
  combine,
  derive,
  Val,
  withReadonlyValueEnhancer,
  ValManager,
} from "../src/value-enhancer";

describe("withReadonlyValueEnhancer", () => {
  it("should add attributes to class", () => {
    interface Test1
      extends ReadonlyValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      str: string;
      constructor() {
        this.str = "str";
        withReadonlyValueEnhancer(this, {
          member: new Val(2),
        });
      }
      addOne(): void {
        this._member$.set(this.member + 1);
      }
    }

    const test1 = new Test1();
    expect(test1.member).toBe(2);

    // @ts-expect-error - readonly val does not expose set
    expect(test1.setMember).toBeUndefined();

    expect(test1).not.toEqual(
      expect.objectContaining({
        setMember: expect.any(Function),
      })
    );

    test1.addOne();
    expect(test1.member).toBe(3);
  });

  it("should have access to readonly val instance", () => {
    interface Test1
      extends ReadonlyValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      str: string;
      constructor() {
        this.str = "str";
        withReadonlyValueEnhancer(this, {
          member: new Val(2),
        });
      }
    }

    const test1 = new Test1();
    const spy = vi.fn();

    test1._member$.reaction(spy);
    expect(spy).toBeCalledTimes(0);

    test1._member$.set(3);
    expect(spy).toBeCalledTimes(1);
  });

  it("should attach to val manager if provided", () => {
    interface Test1
      extends ReadonlyValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      public exposedValManagerForTesting: ValManager;

      constructor() {
        const valManager = new ValManager();
        this.exposedValManagerForTesting = valManager;

        withReadonlyValueEnhancer(
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

  it("should not pass tsc for mismatched val types", () => {
    interface Test1
      extends ReadonlyValEnhancedResult<{ member: Val<number> }> {}

    class Test1 {
      str: string;
      constructor() {
        this.str = "str";
        // @ts-expect-error - mismatched val type
        withReadonlyValueEnhancer(this, {
          member: new Val("ee"),
        });
      }
    }

    const test1 = new Test1();
    expect(test1.member).toBe("ee");
  });

  it("should work with derive and combine", () => {
    type ReadonlyValConfig = {
      a: Val<number>;
      c: ReadonlyVal<number>;
      d: ReadonlyVal<[string]>;
    };

    interface Test1 extends ReadonlyValEnhancedResult<ReadonlyValConfig> {}

    class Test1 {
      str: string;
      constructor() {
        this.str = "str";
        withReadonlyValueEnhancer(this, {
          a: new Val(2),
          c: derive(new Val("1"), val => Number(val)),
          d: combine([new Val("str")]),
        });
      }
    }
    const test1 = new Test1();
    expect(test1.a).toBe(2);
  });

  describe("subscribe", () => {
    it("should subscribe", () => {
      const spy = vi.fn();
      const member$ = new Val(2);

      interface Test1
        extends ReadonlyValEnhancedResult<{ member: Val<number> }> {}

      class Test1 {
        constructor() {
          withReadonlyValueEnhancer(this, {
            member: member$,
          });
        }
      }

      const test1 = new Test1();
      test1.onValChanged("member", spy);

      expect(spy).toBeCalledTimes(0);

      member$.set(3);
      expect(spy).toBeCalledTimes(1);
      expect(spy).lastCalledWith(3);

      member$.set(4);
      expect(spy).toBeCalledTimes(2);
      expect(spy).lastCalledWith(4);
    });

    it("should work with multiple val configs", () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spyError = vi.fn();
      const a$ = new Val(2);
      const b$ = new Val(true);

      type Config1 = { a: Val<number> };
      type Config2 = { b: Val<boolean> };
      type CombinedResult = ReadonlyValEnhancedResult<Config1> &
        ReadonlyValEnhancedResult<Config2>;
      interface Test1 extends CombinedResult {}

      class Test1 {
        constructor() {
          withReadonlyValueEnhancer(this, {
            a: a$,
            b: b$,
          });
        }
      }

      const test1 = new Test1();
      test1.onValChanged("a", spy1);
      test1.onValChanged("b", spy2);

      expect(spy1).toBeCalledTimes(0);
      expect(spy2).toBeCalledTimes(0);

      a$.set(3);
      b$.set(false);
      expect(spy1).toBeCalledTimes(1);
      expect(spy2).toBeCalledTimes(1);
      expect(spy1).lastCalledWith(3);
      expect(spy2).lastCalledWith(false);

      a$.set(4);
      b$.set(true);
      expect(spy1).toBeCalledTimes(2);
      expect(spy2).toBeCalledTimes(2);
      expect(spy1).lastCalledWith(4);
      expect(spy2).lastCalledWith(true);

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
