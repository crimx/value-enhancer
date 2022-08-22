import { describe, it, expect } from "vitest";
import { ValManager, Val } from "../src/value-enhancer";

describe("ValManager", () => {
  it("should attach a val", () => {
    const valManager = new ValManager();
    const val = valManager.attach(new Val("test"));
    expect(valManager.vals.has(val)).toBe(true);
  });

  it("should cleanup vals on destroy", () => {
    const valManager = new ValManager();
    const val1 = valManager.attach(new Val("12345"));
    const val2 = valManager.attach(new Val(""));
    val1.subscribe(str => {
      val2.set(str.split("").reverse().join(""));
    });

    expect(valManager.vals.has(val1)).toBe(true);
    expect(valManager.vals.has(val2)).toBe(true);

    expect(val1.value).toBe("12345");
    expect(val2.value).toBe("54321");

    val1.set("23456");
    expect(val1.value).toBe("23456");
    expect(val2.value).toBe("65432");

    valManager.destroy();

    val1.set("34567");
    expect(val1.value).toBe("34567");
    expect(val2.value).toBe("65432");
  });

  it("should not affect a detached val", () => {
    const valManager = new ValManager();
    const val1 = valManager.attach(new Val("12345"));
    const val2 = valManager.attach(new Val(""));
    val1.subscribe(str => {
      val2.set(str.split("").reverse().join(""));
    });

    expect(valManager.vals.has(val1)).toBe(true);
    expect(valManager.vals.has(val2)).toBe(true);

    expect(val1.value).toBe("12345");
    expect(val2.value).toBe("54321");

    val1.set("23456");
    expect(val1.value).toBe("23456");
    expect(val2.value).toBe("65432");

    valManager.detach(val1);

    valManager.destroy();

    val1.set("34567");
    expect(val1.value).toBe("34567");
    expect(val2.value).toBe("76543");
  });
});
