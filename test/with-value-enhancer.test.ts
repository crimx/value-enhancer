import type { ValEnhancedResult } from "../src/value-enhancer";
import { Val, withValueEnhancer } from "../src/value-enhancer";

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
    const spy = jest.fn();

    test1.$member.reaction(spy);
    expect(spy).toBeCalledTimes(0);

    test1.setMember(3);
    expect(spy).toBeCalledTimes(1);
  });
});
