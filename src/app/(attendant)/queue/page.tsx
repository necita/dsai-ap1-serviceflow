import Link from "next/link";
import { listAttendantQueue } from "@/modules/requests";
import { requireAttendantPageAccess } from "../page-access";

const statusLabels = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída",
} as const;

export default async function AttendantQueuePage() {
  await requireAttendantPageAccess();
  const requests = await listAttendantQueue();

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <h1>Fila do meu setor</h1>
      {requests.length === 0 ? (
        <p>Não há solicitações no setor.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <h2>
                <Link href={`/queue/${request.id}`}>
                  {request.serviceNameSnapshot}
                </Link>
              </h2>
              <p>{statusLabels[request.status]}</p>
              <p>{request.description}</p>
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
