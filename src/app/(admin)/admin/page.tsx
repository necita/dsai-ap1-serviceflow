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
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Administração</h1>
          <p>Gerencie usuários, setores, categorias e serviços.</p>
        </div>
        <SignOutButton />
      </header>
      {message ? (
        <p role={error ? "alert" : "status"} aria-live="polite">
          {message}
        </p>
      ) : null}

      <section aria-labelledby="sectors-heading">
        <h2 id="sectors-heading">Setores</h2>
        <form action={createSectorAction}>
          <label>
            Novo setor
            <input name="name" required maxLength={200} />
          </label>
          <button type="submit">Criar setor</button>
        </form>
        <ul>
          {sectors.map((sector) => (
            <li key={sector.id}>
              <form action={updateSectorAction}>
                <input type="hidden" name="id" value={sector.id} />
                <label>
                  Nome
                  <input name="name" defaultValue={sector.name} required />
                </label>
                <span>{sector.isActive ? "Ativo" : "Inativo"}</span>
                <button type="submit">Salvar</button>
              </form>
              <form action={toggleSectorAction}>
                <input type="hidden" name="id" value={sector.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!sector.isActive)}
                />
                <button type="submit">
                  {sector.isActive ? "Desativar" : "Reativar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading">Categorias</h2>
        <form action={createCategoryAction}>
          <label>
            Nova categoria
            <input name="name" required maxLength={200} />
          </label>
          <button type="submit">Criar categoria</button>
        </form>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <form action={updateCategoryAction}>
                <input type="hidden" name="id" value={category.id} />
                <label>
                  Nome
                  <input name="name" defaultValue={category.name} required />
                </label>
                <span>{category.isActive ? "Ativa" : "Inativa"}</span>
                <button type="submit">Salvar</button>
              </form>
              <form action={toggleCategoryAction}>
                <input type="hidden" name="id" value={category.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!category.isActive)}
                />
                <button type="submit">
                  {category.isActive ? "Desativar" : "Reativar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="users-heading">
        <h2 id="users-heading">Usuários</h2>
        <form action={createUserAction}>
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
            Setor (somente atendente)
            <select name="sectorId" defaultValue="">
              <option value="">Sem setor</option>
              {sectors
                .filter((sector) => sector.isActive)
                .map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
            </select>
          </label>
          <button type="submit">Criar usuário</button>
        </form>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <form action={updateUserAction}>
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
                  Setor
                  <select name="sectorId" defaultValue={user.sectorId ?? ""}>
                    <option value="">Sem setor</option>
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}{sector.isActive ? "" : " (inativo)"}
                      </option>
                    ))}
                  </select>
                </label>
                <span>{user.isActive ? "Ativo" : "Inativo"}</span>
                <button type="submit">Salvar usuário</button>
              </form>
              <form action={toggleUserAction}>
                <input type="hidden" name="id" value={user.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!user.isActive)}
                />
                <button type="submit">
                  {user.isActive ? "Desativar usuário" : "Reativar usuário"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="services-heading">
        <h2 id="services-heading">Serviços</h2>
        <form action={createServiceAction}>
          <label>Nome<input name="name" required /></label>
          <label>Descrição<textarea name="description" required /></label>
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
        <ul>
          {services.map((service) => (
            <li key={service.id}>
              <form action={updateServiceAction}>
                <input type="hidden" name="id" value={service.id} />
                <label>Nome<input name="name" defaultValue={service.name} required /></label>
                <label>Descrição<textarea name="description" defaultValue={service.description} required /></label>
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
                <span>{service.isActive ? "Ativo" : "Inativo"}</span>
                <button type="submit">Salvar serviço</button>
              </form>
              <form action={toggleServiceAction}>
                <input type="hidden" name="id" value={service.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(!service.isActive)}
                />
                <button type="submit">
                  {service.isActive ? "Desativar serviço" : "Reativar serviço"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
