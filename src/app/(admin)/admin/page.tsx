import { redirect } from "next/navigation";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import {
  listCategories,
} from "@/modules/categories";
import { AuthenticationError, AuthorizationError } from "@/server/errors";
import { requireConfigurationAdministrator } from "@/server/authorization";
import { listSectors } from "@/modules/sectors";
import { listServices } from "@/modules/services";
import { listUsers } from "@/modules/users";
import {
  createCategoryAction,
  createSectorAction,
  createServiceAction,
  createUserAction,
  toggleCategoryAction,
  toggleSectorAction,
  toggleServiceAction,
  toggleUserAction,
  updateCategoryAction,
  updateSectorAction,
  updateServiceAction,
  updateUserAction,
} from "./actions";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    entity?: string;
    notice?: string;
  }>;
};

function announcement(error?: string, notice?: string): string | null {
  if (error === "dependency") {
    return "A operação não pode ser concluída enquanto existirem dependências ativas ou solicitações pendentes.";
  }
  if (error === "validation") {
    return "Confira os campos: há valores ausentes ou inválidos.";
  }
  if (error === "missing") {
    return "O registro não existe mais. Atualize a página e tente novamente.";
  }
  if (error === "access") {
    return "Sua sessão não tem permissão para essa operação.";
  }
  if (error === "unexpected") {
    return "Não foi possível concluir a operação. Tente novamente.";
  }
  if (notice === "created") return "Registro criado.";
  if (notice === "updated") return "Alterações salvas.";
  if (notice === "status") return "Estado atualizado.";
  return null;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  try {
    await requireConfigurationAdministrator();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login");
    if (error instanceof AuthorizationError) redirect("/");
    throw error;
  }

  const [{ error, notice }, sectors, categories, users, services] =
    await Promise.all([
      searchParams,
      listSectors(),
      listCategories(),
      listUsers(),
      listServices(),
    ]);
  const message = announcement(error, notice);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="page-intro">
          <p className="eyebrow">Espaço de trabalho</p>
          <h1>Administração</h1>
          <p>Gerencie usuários, setores, categorias e serviços.</p>
        </div>
        <SignOutButton />
      </header>
      {message ? (
        <p
          className={`feedback${error ? " feedback-error" : ""}`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <div className="admin-sections">
      <section className="admin-section" aria-labelledby="sectors-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Estrutura organizacional</p>
            <h2 id="sectors-heading">Setores</h2>
            <p className="section-description">Organize as equipes responsáveis pelo atendimento.</p>
          </div>
        </div>
        <form action={createSectorAction} className="create-form">
          <label>
            Novo setor
            <input name="name" required maxLength={200} />
          </label>
          <button type="submit">Criar setor</button>
        </form>
        <ul className="entity-list">
          {sectors.map((sector) => (
            <li className="entity-item" key={sector.id}>
              <form action={updateSectorAction} className="entity-form">
                <input type="hidden" name="id" value={sector.id} />
                <label>
                  Nome
                  <input name="name" defaultValue={sector.name} required />
                </label>
                <span className={`status-badge${sector.isActive ? "" : " is-inactive"}`}>
                  {sector.isActive ? "Ativo" : "Inativo"}
                </span>
                <button className="button-secondary" type="submit">Salvar</button>
              </form>
              <form action={toggleSectorAction} className="entity-actions">
                <input type="hidden" name="id" value={sector.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!sector.isActive)}
                />
                <button className={sector.isActive ? "button-danger" : "button-secondary"} type="submit">
                  {sector.isActive ? "Desativar" : "Reativar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section" aria-labelledby="categories-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 id="categories-heading">Categorias</h2>
            <p className="section-description">Agrupe serviços em categorias fáceis de encontrar.</p>
          </div>
        </div>
        <form action={createCategoryAction} className="create-form">
          <label>
            Nova categoria
            <input name="name" required maxLength={200} />
          </label>
          <button type="submit">Criar categoria</button>
        </form>
        <ul className="entity-list">
          {categories.map((category) => (
            <li className="entity-item" key={category.id}>
              <form action={updateCategoryAction} className="entity-form">
                <input type="hidden" name="id" value={category.id} />
                <label>
                  Nome
                  <input name="name" defaultValue={category.name} required />
                </label>
                <span className={`status-badge${category.isActive ? "" : " is-inactive"}`}>
                  {category.isActive ? "Ativa" : "Inativa"}
                </span>
                <button className="button-secondary" type="submit">Salvar</button>
              </form>
              <form action={toggleCategoryAction} className="entity-actions">
                <input type="hidden" name="id" value={category.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!category.isActive)}
                />
                <button className={category.isActive ? "button-danger" : "button-secondary"} type="submit">
                  {category.isActive ? "Desativar" : "Reativar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section" aria-labelledby="users-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Acessos e equipes</p>
            <h2 id="users-heading">Usuários</h2>
            <p className="section-description">Gerencie perfis, acessos e a associação de atendentes aos setores.</p>
          </div>
        </div>
        <form action={createUserAction} className="create-form">
          <label>Nome<input name="name" required /></label>
          <label>E-mail<input name="email" type="email" required /></label>
          <label>Senha inicial<input name="password" type="password" required /></label>
          <label>
            Perfil
            <select name="role" defaultValue="REQUESTER" required>
              <option value="ADMIN">Administrador</option>
              <option value="REQUESTER">Solicitante</option>
              <option value="ATTENDANT">Atendente</option>
            </select>
          </label>
          <label>
            Setor da equipe
            <select name="sectorId" defaultValue="">
              <option value="">Selecione se for atendente</option>
              {sectors
                .filter((sector) => sector.isActive)
                .map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
            </select>
          </label>
          <button type="submit">Criar usuário</button>
        </form>
        <ul className="entity-list">
          {users.map((user) => (
            <li className="entity-item" key={user.id}>
              <form action={updateUserAction} className="entity-form">
                <input type="hidden" name="id" value={user.id} />
                <label>Nome<input name="name" defaultValue={user.name} required /></label>
                <label>E-mail<input name="email" type="email" defaultValue={user.email} required /></label>
                <label>Nova senha (opcional)<input name="password" type="password" /></label>
                <label>
                  Perfil
                  <select name="role" defaultValue={user.role} required>
                    <option value="ADMIN">Administrador</option>
                    <option value="REQUESTER">Solicitante</option>
                    <option value="ATTENDANT">Atendente</option>
                  </select>
                </label>
                <label>
                  Setor da equipe
                  <select name="sectorId" defaultValue={user.sectorId ?? ""}>
                    <option value="">Selecione se for atendente</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}{sector.isActive ? "" : " (inativo)"}
                      </option>
                    ))}
                  </select>
                </label>
                <span className={`status-badge${user.isActive ? "" : " is-inactive"}`}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </span>
                <button className="button-secondary" type="submit">Salvar usuário</button>
              </form>
              <form action={toggleUserAction} className="entity-actions">
                <input type="hidden" name="id" value={user.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!user.isActive)}
                />
                <button className={user.isActive ? "button-danger" : "button-secondary"} type="submit">
                  {user.isActive ? "Desativar usuário" : "Reativar usuário"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section" aria-labelledby="services-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Oferta de serviços</p>
            <h2 id="services-heading">Serviços</h2>
            <p className="section-description">Configure o que as pessoas podem solicitar e qual equipe atende.</p>
          </div>
        </div>
        <form action={createServiceAction} className="create-form">
          <label>Nome<input name="name" required /></label>
          <label className="wide-field">Descrição<textarea name="description" required /></label>
          <label>
            Categoria
            <select name="categoryId" required defaultValue="">
              <option value="" disabled>Selecione</option>
              {categories.filter((category) => category.isActive).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            Setor
            <select name="sectorId" required defaultValue="">
              <option value="" disabled>Selecione</option>
              {sectors.filter((sector) => sector.isActive).map((sector) => (
                <option key={sector.id} value={sector.id}>{sector.name}</option>
              ))}
            </select>
          </label>
          <button type="submit">Criar serviço</button>
        </form>
        <ul className="entity-list">
          {services.map((service) => (
            <li className="entity-item" key={service.id}>
              <form action={updateServiceAction} className="entity-form">
                <input type="hidden" name="id" value={service.id} />
                <label>Nome<input name="name" defaultValue={service.name} required /></label>
                <label className="wide-field">Descrição<textarea name="description" defaultValue={service.description} required /></label>
                <label>
                  Categoria
                  <select name="categoryId" defaultValue={service.categoryId} required>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}{category.isActive ? "" : " (inativa)"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Setor
                  <select name="sectorId" defaultValue={service.sectorId} required>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}{sector.isActive ? "" : " (inativo)"}
                      </option>
                    ))}
                  </select>
                </label>
                <span className={`status-badge${service.isActive ? "" : " is-inactive"}`}>
                  {service.isActive ? "Ativo" : "Inativo"}
                </span>
                <button className="button-secondary" type="submit">Salvar serviço</button>
              </form>
              <form action={toggleServiceAction} className="entity-actions">
                <input type="hidden" name="id" value={service.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!service.isActive)}
                />
                <button className={service.isActive ? "button-danger" : "button-secondary"} type="submit">
                  {service.isActive ? "Desativar serviço" : "Reativar serviço"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </main>
  );
}
