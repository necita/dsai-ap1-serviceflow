import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedService } from "@/modules/services/catalog";
import { NotFoundError } from "@/server/errors";
import { requireRequesterPageAccess } from "../../page-access";
import { createRequestAction } from "../../requests/actions";

type ServicePageProps = {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ error?: string }>;
};

function errorMessage(error?: string): string | null {
  if (error === "validation") return "Informe uma descrição válida, com até 10.000 caracteres.";
  if (error === "unavailable") return "Este serviço não está mais disponível para novas solicitações.";
  if (error === "access") return "Sua sessão não permite abrir esta solicitação.";
  return null;
}

export default async function ServicePage({
  params,
  searchParams,
}: ServicePageProps) {
  await requireRequesterPageAccess();
  const [{ serviceId }, { error }] = await Promise.all([params, searchParams]);
  let service;

  try {
    service = await getPublishedService(serviceId);
  } catch (caught) {
    if (caught instanceof NotFoundError) notFound();
    throw caught;
  }

  const message = errorMessage(error);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <nav aria-label="Navegação do catálogo">
        <Link href="/catalog">Voltar ao catálogo</Link>
      </nav>
      <article>
        <h1>{service.name}</h1>
        <p>{service.description}</p>
        <p>Categoria: {service.category.name}</p>
        <p>Setor responsável: {service.sector.name}</p>
      </article>
      {message ? <p role="alert">{message}</p> : null}
      <section aria-labelledby="request-heading">
        <h2 id="request-heading">Abrir solicitação</h2>
        <form action={createRequestAction}>
          <input type="hidden" name="serviceId" value={service.id} />
          <label htmlFor="request-description">Descreva o que você precisa</label>
          <textarea
            id="request-description"
            name="description"
            required
            maxLength={10_000}
            rows={6}
          />
          <p>Máximo de 10.000 caracteres.</p>
          <button type="submit">Enviar solicitação</button>
        </form>
      </section>
    </main>
  );
}
