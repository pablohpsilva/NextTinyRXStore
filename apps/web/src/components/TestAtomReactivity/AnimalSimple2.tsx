"use client";

import { animalStore } from "../../store";

export default function Animal() {
  //   const { name } = animalStore.useStore();
  const age = animalStore.useField("age");

  return (
    <div>
      <h2>Animal age: {age}</h2>
      <h4>(I should NOT re-render. I'm only listening to the age field)</h4>
    </div>
  );
}
