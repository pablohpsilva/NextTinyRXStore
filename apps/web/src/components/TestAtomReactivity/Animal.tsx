"use client";

import { animalStore } from "../../store";

export default function Animal() {
  const handleChangeName = () => {
    animalStore.setters.setName(`RandomName-${Math.random()}`);
  };

  return (
    <div className="mt-4 flex flex-row gap-4 items-center justify-center">
      <button
        onClick={handleChangeName}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Change Name
      </button>
    </div>
  );
}
