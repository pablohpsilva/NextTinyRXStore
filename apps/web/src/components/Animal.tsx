"use client";

import { animalStore } from "../store";

export default function Animal() {
  const { name } = animalStore.useStore();

  return (
    <div>
      <h2>Animal Name: {name}</h2>
    </div>
  );
}
