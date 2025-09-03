"use client";

import Animal from "./Animal";
import AnimalSimple from "./AnimalSimple";
import AnimalSimple2 from "./AnimalSimple2";

export default function TestAtomReactivity() {
  return (
    <div>
      <h2>Test Atom Reactivity</h2>
      <h5>In this example, we will test the atomicity of the store.</h5>
      <p>
        For this, we will have several components that will listen to the store.
        One of them will change the store, and we will see if the other
        components will update.
      </p>
      <span>
        you can use react chrome extension to test the atomicity of the store.
      </span>

      <div className="flex flex-col gap-4">
        <Animal />
        {Array.from({ length: 5 }).map((_, index) => (
          <AnimalSimple key={`${_}${index + 1}`} />
        ))}
        <AnimalSimple2 />
      </div>
    </div>
  );
}
