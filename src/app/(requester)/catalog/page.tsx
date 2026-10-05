import Link from "next/link";
import { groupPublishedServices, listPublishedServices } from "@/modules/services/catalog";
import { requireRequesterPageAccess } from "../page-access";

export default async function CatalogPage() {
  await requireRequesterPageAccess();
  const services = await listPublishedServices();
  const categories = groupPublishedServices(services);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <header>
        <h1>Catálogo de serviços</h1>
        <p>Escolha um serviço para consultar os detalhes e abrir uma solicitação.</p>
        <nav aria-label="Navegação do solicitante">
          <Link href="/requests">Minhas solicitações</Link>
        </nav>
      </header>
      {categories.size === 0 ? (
        <p>Nenhum serviço está disponível no momento.</p>
      ) : (
        [...categories].map(([categoryName, categoryServices]) => (
          <section key={categoryName} aria-labelledby={`category-${categoryName}`}>
            <h2 id={`category-${categoryName}`}>{categoryName}</h2>
            <ul>
              {categoryServices.map((service) => (
                <li key={service.id}>
                  <h3>
                    <Link href={`/catalog/${service.id}`}>{service.name}</Link>
                  </h3>
                  <p>{service.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
