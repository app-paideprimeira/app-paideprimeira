import { Suspense } from "react";
import BebeClient from "./BebeClient";

export default function BebePage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Carregando...</p>}>
      <BebeClient />
    </Suspense>
  );
}
