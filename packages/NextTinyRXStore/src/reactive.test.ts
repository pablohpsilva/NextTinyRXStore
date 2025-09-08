import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  objectEquals,
  SimpleObservable,
  Observer,
  Subscription,
} from "./reactive";

describe("Custom Reactive Implementation", () => {
  describe("BehaviorSubject", () => {
    it("should emit initial value to new subscribers", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      subject.subscribe(observer);

      expect(observer).toHaveBeenCalledWith("initial");
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should emit current value via getValue()", () => {
      const subject = new BehaviorSubject("test");
      expect(subject.getValue()).toBe("test");
    });

    it("should emit current value via value property", () => {
      const subject = new BehaviorSubject("test");
      expect(subject.value).toBe("test");
    });

    it("should emit new values to all subscribers", () => {
      const subject = new BehaviorSubject("initial");
      const observer1 = vi.fn();
      const observer2 = vi.fn();

      subject.subscribe(observer1);
      subject.subscribe(observer2);

      subject.next("updated");

      expect(observer1).toHaveBeenCalledWith("updated");
      expect(observer2).toHaveBeenCalledWith("updated");
    });

    it("should update getValue() after next()", () => {
      const subject = new BehaviorSubject("initial");

      subject.next("updated");

      expect(subject.getValue()).toBe("updated");
    });

    it("should handle subscription cleanup", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      const subscription = subject.subscribe(observer);
      subscription.unsubscribe();

      subject.next("updated");

      // Should only have been called once (for initial value)
      expect(observer).toHaveBeenCalledTimes(1);
      expect(observer).toHaveBeenCalledWith("initial");
    });

    it("should handle multiple unsubscriptions safely", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      const subscription = subject.subscribe(observer);
      subscription.unsubscribe();
      subscription.unsubscribe(); // Should not throw

      expect(subscription.closed).toBe(true);
    });

    it("should handle observer errors gracefully", () => {
      const subject = new BehaviorSubject("initial");
      const errorObserver = vi.fn().mockImplementation(() => {
        throw new Error("Observer error");
      });
      const normalObserver = vi.fn();

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      subject.subscribe(errorObserver);
      subject.subscribe(normalObserver);

      subject.next("test");

      expect(consoleSpy).toHaveBeenCalled();
      expect(normalObserver).toHaveBeenCalledWith("test");

      consoleSpy.mockRestore();
    });

    it("should handle error state", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      subject.subscribe(observer);
      subject.error(new Error("Test error"));

      expect(() => subject.getValue()).toThrow("Test error");

      // Should not emit after error
      subject.next("should not emit");
      expect(observer).toHaveBeenCalledTimes(1); // Only initial value
    });

    it("should handle completion", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      subject.subscribe(observer);
      subject.complete();

      // Should not emit after completion
      subject.next("should not emit");
      expect(observer).toHaveBeenCalledTimes(1); // Only initial value
    });

    it("should throw when getting value from closed subject", () => {
      const subject = new BehaviorSubject("initial");

      subject.complete();

      expect(() => subject.getValue()).toThrow("Object is closed");
    });

    it("should work with different data types", () => {
      // Number
      const numberSubject = new BehaviorSubject(42);
      expect(numberSubject.getValue()).toBe(42);

      // Object
      const objectSubject = new BehaviorSubject({ a: 1 });
      expect(objectSubject.getValue()).toEqual({ a: 1 });

      // Array
      const arraySubject = new BehaviorSubject([1, 2, 3]);
      expect(arraySubject.getValue()).toEqual([1, 2, 3]);

      // Boolean
      const boolSubject = new BehaviorSubject(true);
      expect(boolSubject.getValue()).toBe(true);
    });

    it("should work with pipe operator", () => {
      const subject = new BehaviorSubject(1);
      const observer = vi.fn();

      subject
        .pipe(
          map((x) => x * 2),
          distinctUntilChanged()
        )
        .subscribe(observer);

      expect(observer).toHaveBeenCalledWith(2);

      subject.next(2);
      expect(observer).toHaveBeenCalledWith(4);
    });
  });

  describe("combineLatest", () => {
    it("should combine latest values from multiple sources", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new BehaviorSubject("b");
      const observer = vi.fn();

      combineLatest([subject1, subject2]).subscribe(observer);

      expect(observer).toHaveBeenCalledWith(["a", "b"]);
    });

    it("should wait for all sources to emit before first emission", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new SimpleObservable<string>(() => () => {}); // Never emits
      const observer = vi.fn();

      combineLatest([subject1, subject2]).subscribe(observer);

      // Should not have emitted because subject2 hasn't emitted
      expect(observer).not.toHaveBeenCalled();
    });

    it("should emit when any source emits after all have emitted once", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new BehaviorSubject("b");
      const observer = vi.fn();

      combineLatest([subject1, subject2]).subscribe(observer);

      observer.mockClear(); // Clear initial emission

      subject1.next("a2");
      expect(observer).toHaveBeenCalledWith(["a2", "b"]);

      subject2.next("b2");
      expect(observer).toHaveBeenCalledWith(["a2", "b2"]);
    });

    it("should handle empty array", () => {
      const observer = vi.fn();

      combineLatest([]).subscribe(observer);

      // Should not emit for empty array
      expect(observer).not.toHaveBeenCalled();
    });

    it("should handle single source", () => {
      const subject = new BehaviorSubject("test");
      const observer = vi.fn();

      combineLatest([subject]).subscribe(observer);

      expect(observer).toHaveBeenCalledWith(["test"]);
    });

    it("should handle subscription cleanup", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new BehaviorSubject("b");
      const observer = vi.fn();

      const subscription = combineLatest([subject1, subject2]).subscribe(
        observer
      );
      subscription.unsubscribe();

      observer.mockClear();

      subject1.next("a2");
      subject2.next("b2");

      expect(observer).not.toHaveBeenCalled();
    });

    it("should handle observer errors gracefully", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new BehaviorSubject("b");
      const errorObserver = vi.fn().mockImplementation(() => {
        throw new Error("Observer error");
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      combineLatest([subject1, subject2]).subscribe(errorObserver);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should work with different data types", () => {
      const stringSubject = new BehaviorSubject("hello");
      const numberSubject = new BehaviorSubject(42);
      const boolSubject = new BehaviorSubject(true);
      const observer = vi.fn();

      combineLatest([stringSubject, numberSubject, boolSubject]).subscribe(
        observer
      );

      expect(observer).toHaveBeenCalledWith(["hello", 42, true]);
    });

    it("should preserve array immutability", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new BehaviorSubject("b");
      const observer = vi.fn();

      combineLatest([subject1, subject2]).subscribe(observer);

      const firstCall = observer.mock.calls[0][0];

      subject1.next("a2");

      const secondCall = observer.mock.calls[1][0];

      expect(firstCall).not.toBe(secondCall);
      expect(firstCall).toEqual(["a", "b"]);
      expect(secondCall).toEqual(["a2", "b"]);
    });
  });

  describe("distinctUntilChanged", () => {
    it("should emit first value", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      subject.pipe(distinctUntilChanged()).subscribe(observer);

      expect(observer).toHaveBeenCalledWith("initial");
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should not emit duplicate values", () => {
      const subject = new BehaviorSubject("initial");
      const observer = vi.fn();

      subject.pipe(distinctUntilChanged()).subscribe(observer);

      observer.mockClear();

      subject.next("initial"); // Same value
      expect(observer).not.toHaveBeenCalled();

      subject.next("different");
      expect(observer).toHaveBeenCalledWith("different");
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should use custom comparison function", () => {
      const subject = new BehaviorSubject({ id: 1, value: "a" });
      const observer = vi.fn();

      // Only compare by id
      const compareById = (a: any, b: any) => a.id === b.id;

      subject.pipe(distinctUntilChanged(compareById)).subscribe(observer);

      observer.mockClear();

      // Same id, different value - should not emit
      subject.next({ id: 1, value: "b" });
      expect(observer).not.toHaveBeenCalled();

      // Different id - should emit
      subject.next({ id: 2, value: "c" });
      expect(observer).toHaveBeenCalledWith({ id: 2, value: "c" });
    });

    it("should handle primitive values correctly", () => {
      const subject = new BehaviorSubject(1);
      const observer = vi.fn();

      subject.pipe(distinctUntilChanged()).subscribe(observer);

      observer.mockClear();

      subject.next(1); // Same
      expect(observer).not.toHaveBeenCalled();

      subject.next(2); // Different
      expect(observer).toHaveBeenCalledWith(2);

      subject.next(2); // Same again
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should handle object references", () => {
      const obj1 = { value: "test" };
      const obj2 = { value: "test" };
      const subject = new BehaviorSubject(obj1);
      const observer = vi.fn();

      subject.pipe(distinctUntilChanged()).subscribe(observer);

      observer.mockClear();

      // Different reference, same content - should emit (using === comparison)
      subject.next(obj2);
      expect(observer).toHaveBeenCalledWith(obj2);

      // Same reference - should not emit
      subject.next(obj2);
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should handle observer errors gracefully", () => {
      const subject = new BehaviorSubject("initial");
      const errorObserver = vi.fn().mockImplementation(() => {
        throw new Error("Observer error");
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      subject.pipe(distinctUntilChanged()).subscribe(errorObserver);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("map", () => {
    it("should transform emitted values", () => {
      const subject = new BehaviorSubject(5);
      const observer = vi.fn();

      subject.pipe(map((x) => x * 2)).subscribe(observer);

      expect(observer).toHaveBeenCalledWith(10);
    });

    it("should transform string values", () => {
      const subject = new BehaviorSubject("hello");
      const observer = vi.fn();

      subject.pipe(map((s) => s.toUpperCase())).subscribe(observer);

      expect(observer).toHaveBeenCalledWith("HELLO");
    });

    it("should handle complex transformations", () => {
      const subject = new BehaviorSubject({ name: "John", age: 30 });
      const observer = vi.fn();

      subject
        .pipe(map((person) => `${person.name} is ${person.age} years old`))
        .subscribe(observer);

      expect(observer).toHaveBeenCalledWith("John is 30 years old");
    });

    it("should handle projection errors gracefully", () => {
      const subject = new BehaviorSubject("test");
      const observer = vi.fn();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      subject
        .pipe(
          map(() => {
            throw new Error("Projection error");
          })
        )
        .subscribe(observer);

      expect(consoleSpy).toHaveBeenCalled();
      expect(observer).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should work with multiple transformations", () => {
      const subject = new BehaviorSubject(5);
      const observer = vi.fn();

      subject
        .pipe(
          map((x) => x * 2),
          map((x) => x + 1),
          map((x) => `Result: ${x}`)
        )
        .subscribe(observer);

      expect(observer).toHaveBeenCalledWith("Result: 11");
    });
  });

  describe("objectEquals utility", () => {
    it("should return true for identical objects", () => {
      const obj = { a: 1, b: 2 };
      expect(objectEquals(obj, obj)).toBe(true);
    });

    it("should return true for shallow equal objects", () => {
      expect(objectEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(objectEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });

    it("should return false for different objects", () => {
      expect(objectEquals({ a: 1 }, { a: 2 })).toBe(false);
      expect(objectEquals({ a: 1 }, { b: 1 })).toBe(false);
      expect(objectEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it("should handle null and undefined", () => {
      expect(objectEquals(null, null)).toBe(true);
      expect(objectEquals(undefined, undefined)).toBe(true);
      expect(objectEquals(null, undefined)).toBe(false);
      expect(objectEquals(null, {})).toBe(false);
      expect(objectEquals({}, null)).toBe(false);
    });

    it("should handle primitives", () => {
      expect(objectEquals(5, 5)).toBe(true);
      expect(objectEquals(5, 10)).toBe(false);
      expect(objectEquals("hello", "hello")).toBe(true);
      expect(objectEquals("hello", "world")).toBe(false);
    });

    it("should handle empty objects", () => {
      expect(objectEquals({}, {})).toBe(true);
    });
  });

  describe("Integration tests", () => {
    it("should work with complex operator chains", () => {
      const subject1 = new BehaviorSubject(1);
      const subject2 = new BehaviorSubject(2);
      const observer = vi.fn();

      combineLatest([subject1, subject2])
        .pipe(
          map(([a, b]) => a + b),
          distinctUntilChanged(),
          map((sum) => `Sum: ${sum}`)
        )
        .subscribe(observer);

      expect(observer).toHaveBeenCalledWith("Sum: 3");

      observer.mockClear();

      // Change one value but keep same sum - should emit intermediate values but end with same sum
      subject1.next(2); // Sum becomes 4, should emit "Sum: 4"
      expect(observer).toHaveBeenCalledWith("Sum: 4");

      subject2.next(1); // Sum becomes 3 again, should emit "Sum: 3"
      expect(observer).toHaveBeenCalledWith("Sum: 3");
      expect(observer).toHaveBeenCalledTimes(2);

      observer.mockClear();

      // Same sum again - should not emit due to distinctUntilChanged
      subject1.next(2);
      subject2.next(1);
      expect(observer).not.toHaveBeenCalled();

      // Different sum - should emit
      subject1.next(3);
      expect(observer).toHaveBeenCalledWith("Sum: 4");
    });

    it("should handle cleanup in complex chains", () => {
      const subject1 = new BehaviorSubject("a");
      const subject2 = new BehaviorSubject("b");
      const observer = vi.fn();

      const subscription = combineLatest([subject1, subject2])
        .pipe(
          map(([a, b]) => `${a}-${b}`),
          distinctUntilChanged()
        )
        .subscribe(observer);

      subscription.unsubscribe();
      observer.mockClear();

      subject1.next("x");
      subject2.next("y");

      expect(observer).not.toHaveBeenCalled();
    });
  });
});
