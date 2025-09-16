"use client";
import { userStore } from "../../store/demoStores";

export default function Buttons() {
  return (
    <>
      <button
        onClick={() =>
          userStore.setters.setName(`User-${Date.now().toString().slice(-4)}`)
        }
        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        🔄 Change Name (Will re-render Name component)
      </button>

      <button
        onClick={() =>
          userStore.setters.setAge(Math.floor(Math.random() * 50) + 18)
        }
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        🎲 Change Age (Won't re-render Name component)
      </button>

      <button
        onClick={() => userStore.setters.setEmail(`user${Date.now()}@test.com`)}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        📧 Change Email (Won't re-render Name component)
      </button>
    </>
  );
}
