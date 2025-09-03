"use client";

import uuid from "apps/web/src/store/uuid";
import { userStore } from "../../../store/demoStores";

export default function Buttons() {
  const age = userStore.useField("age");
  return (
    <>
      <button
        onClick={() => userStore.setters.setName(`User-${uuid()}`)}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        🔄 Change Name (Will re-render)
      </button>

      <button
        onClick={() => userStore.setters.setAge(Number(age) + 10)}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        🎂 Change Age (Will re-render)
      </button>

      <button
        onClick={() => userStore.setters.setEmail(`user${uuid()}@test.com`)}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        📧 Change Email (Won't re-render)
      </button>
    </>
  );
}
