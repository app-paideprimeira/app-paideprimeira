import { Suspense } from "react";
import UpdatePasswordClient from "./UpdatePasswordClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <UpdatePasswordClient />
    </Suspense>
  );
}
