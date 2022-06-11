import { describe, it, expect, vi } from "vitest";
import type { ReadonlyValEnhancedResult } from "../src/value-enhancer";
import {
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
        this._member$.setValue(this.member + 1);
      }
    }

    const test1 = new Test1();
    expect(test1.member).toBe(2);

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

    test1._member$.setValue(3);
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
});
