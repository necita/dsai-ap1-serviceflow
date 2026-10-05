import Link from "next/link";
import { notFound } from "next/navigation";
import { getRequesterRequest } from "@/modules/requests";
import { NotFoundError } from "@/server/errors";
import { requireRequesterPageAccess } from "../../page-access";

type RequestPageProps = {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ notice?: string }>;
};

const statusLabels = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída",
} as const;

export default async function RequestPage({
  params,
  searchParams,
}: RequestPageProps) {
  await requireRequesterPageAccess();
  const [{ requestId }, { notice }] = await Promise.all([params, searchParams]);
  let request;

  try {
    request = await getRequesterRequest(requestId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <nav aria-label="Navegação das solicitações">
        <Link href="/requests">Minhas solicitações</Link>
      </nav>
      {notice === "created" ? (
        <p role="status">Sua solicitação foi aberta.</p>
      ) : null}
      <article>
        <h1>{request.serviceNameSnapshot}</h1>
        <p>{statusLabels[request.status]}</p>
        <p>Categoria: {request.categoryNameSnapshot}</p>
        <p>Setor responsável: {request.sectorNameSnapshot}</p>
        <p>{request.serviceDescriptionSnapshot}</p>
        <h2>Sua descrição</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{request.description}</p>
      </article>
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">Histórico</h2>
        {request.events.length === 0 ? (
          <p>Nenhum evento registrado.</p>
        ) : (
          <ol>
            {request.events.map((event) => (
              <li key={event.id}>
                <p>
                  {event.fromStatus
                    ? `${statusLabels[event.fromStatus]} → ${statusLabels[event.toStatus]}`
                    : `Solicitação aberta: ${statusLabels[event.toStatus]}`}
                </p>
                <p>Responsável pelo evento: {event.actor.name}</p>
                <time dateTime={event.occurredAt.toISOString()}>
                  {event.occurredAt.toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
