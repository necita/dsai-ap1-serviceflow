import Link from "next/link";
import { listRequesterRequests } from "@/modules/requests";
import { requireRequesterPageAccess } from "../page-access";

const statusLabels = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída",
} as const;

export default async function RequestListPage() {
  await requireRequesterPageAccess();
  const requests = await listRequesterRequests();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header>
        <h1>Minhas solicitações</h1>
        <Link href="/catalog">Voltar ao catálogo</Link>
      </header>
      {requests.length === 0 ? (
        <p>Você ainda não abriu solicitações.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <h2>
                <Link href={`/requests/${request.id}`}>
                  {request.serviceNameSnapshot}
                </Link>
              </h2>
              <p>{statusLabels[request.status]}</p>
              <p>
                Aberta em{" "}
                <time dateTime={request.createdAt.toISOString()}>
                  {request.createdAt.toLocaleString("pt-BR")}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
