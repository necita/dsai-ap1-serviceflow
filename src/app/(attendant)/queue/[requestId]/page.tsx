import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttendantRequest } from "@/modules/requests";
import { NotFoundError } from "@/server/errors";
import { requireAttendantPageAccess } from "../../page-access";
import { completeRequestAction, startRequestAction } from "../actions";

type QueueRequestPageProps = {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

const statusLabels = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída",
} as const;

function feedback(error?: string, notice?: string): string | null {
  if (error === "missing") return "A solicitação não está disponível no seu setor.";
  if (error === "state") return "O estado da solicitação mudou. Atualize a página e tente novamente.";
  if (error === "access") return "Sua sessão não permite esta operação.";
  if (error === "validation") return "Os dados enviados são inválidos.";
  if (error === "unexpected") return "Não foi possível concluir a operação.";
  if (notice === "started") return "Atendimento iniciado.";
  if (notice === "completed") return "Solicitação concluída.";
  return null;
}

export default async function QueueRequestPage({
  params,
  searchParams,
}: QueueRequestPageProps) {
  await requireAttendantPageAccess();
  const [{ requestId }, { error, notice }] = await Promise.all([
    params,
    searchParams,
  ]);
  let request;

  try {
    request = await getAttendantRequest(requestId);
  } catch (caught) {
    if (caught instanceof NotFoundError) notFound();
    throw caught;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <nav aria-label="Navegação da fila">
        <Link href="/queue">Voltar à fila</Link>
      </nav>
      {feedback(error, notice) ? (
        <p role={error ? "alert" : "status"}>{feedback(error, notice)}</p>
      ) : null}
      <article>
        <h1>{request.serviceNameSnapshot}</h1>
        <p>{statusLabels[request.status]}</p>
        <p>Categoria: {request.categoryNameSnapshot}</p>
        <p>Setor de origem: {request.sectorNameSnapshot}</p>
        <p>{request.serviceDescriptionSnapshot}</p>
        <h2>Descrição da solicitação</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{request.description}</p>
      </article>
      {request.status === "OPEN" ? (
        <form action={startRequestAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button type="submit">Iniciar atendimento</button>
        </form>
      ) : null}
      {request.status === "IN_PROGRESS" ? (
        <form action={completeRequestAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button type="submit">Concluir solicitação</button>
        </form>
      ) : null}
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Histórico</h2>
        <ol>
          {request.events.map((event) => (
            <li key={event.id}>
              <p>
                {event.fromStatus
                  ? `${statusLabels[event.fromStatus]} → ${statusLabels[event.toStatus]}`
                  : `Solicitação aberta: ${statusLabels[event.toStatus]}`}
              </p>
              <p>Atendente: {event.actor.name}</p>
              <time dateTime={event.occurredAt.toISOString()}>
                {event.occurredAt.toLocaleString("pt-BR")}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
