"use client";

import { animalStore } from "../../store";

export default function Animal() {
  //   const { name } = animalStore.useStore();
  const name = animalStore.useField("name");

  return (
    <div>
      <h2>Animal Name: {name}</h2>
    </div>
  );
}
