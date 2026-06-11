import { redirect } from "next/navigation";

// O middleware envia usuários autenticados para /dashboard e os não
// autenticados para /login. Esta rota apenas encaminha para o destino padrão.
export default function HomePage() {
  redirect("/dashboard");
}
