import { FieldStore, createFieldStore } from "@repo/next-tiny-rx-store";
export {
  createFieldStore,
  createSSRStore,
  initializeServerStore,
} from "@repo/next-tiny-rx-store";

/*
 * You can use the FieldStore class to create a store for your application.
 * It is a simple store that can be used to store your application's data.
 */
export const animalStore = new FieldStore({
  name: "Dog",
  age: 5,
});

/*
 * Or you can use the createFieldStore function to create a store for your application.
 */
export const userStore = createFieldStore({
  username: "Alice",
  age: 18,
}).derived("isAdult", ["age"], ({ age }) => age >= 18);
