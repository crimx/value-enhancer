import { describe, it, expect, vi } from "vitest";
import type { ValEnhancedResult } from "../src/value-enhancer";
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
});
