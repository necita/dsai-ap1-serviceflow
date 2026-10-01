"use client";

import { useMemo, useState, type CSSProperties } from "react";

type Role = "admin" | "requester" | "attendant";
type RequestStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED";

type Sector = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  sectorId: string;
  isActive: boolean;
};

type RequestItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  requester: string;
  status: RequestStatus;
  sectorId: string;
  description: string;
};

const initialSectors: Sector[] = [
  { id: "setor-ti", name: "TI" },
  { id: "setor-rh", name: "Recursos Humanos" },
];

const initialCategories: Category[] = [
  { id: "cat-infra", name: "Infraestrutura" },
  { id: "cat-pessoal", name: "Pessoal" },
];

const initialServices: ServiceItem[] = [
  {
    id: "svc-helpdesk",
    name: "Helpdesk",
    description: "Solicitação de suporte técnico para computadores e acesso",
    categoryId: "cat-infra",
    sectorId: "setor-ti",
    isActive: true,
  },
  {
    id: "svc-contrato",
    name: "Acesso a documento de pessoal",
    description: "Pedido de documentos e informações de RH",
    categoryId: "cat-pessoal",
    sectorId: "setor-rh",
    isActive: true,
  },
];

const initialRequests: RequestItem[] = [
  {
    id: "req-001",
    serviceId: "svc-helpdesk",
    serviceName: "Helpdesk",
    requester: "solicitante@serviceflow.local",
    status: "OPEN",
    sectorId: "setor-ti",
    description: "Preciso de suporte para meu notebook que não está ligando.",
  },
  {
    id: "req-002",
    serviceId: "svc-contrato",
    serviceName: "Acesso a documento de pessoal",
    requester: "solicitante@serviceflow.local",
    status: "IN_PROGRESS",
    sectorId: "setor-rh",
    description: "Solicito cópia do contrato de trabalho para análise pessoal.",
  },
];

const panelStyle: CSSProperties = {
  background: "#f5f7fb",
  border: "1px solid #dfe5f1",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

export default function Home() {
  const [role, setRole] = useState<Role>("admin");
  const [sectors, setSectors] = useState<Sector[]>(initialSectors);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [newSectorName, setNewSectorName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    categoryId: initialCategories[0]?.id ?? "",
    sectorId: initialSectors[0]?.id ?? "",
  });
  const [selectedServiceId, setSelectedServiceId] = useState(initialServices[0]?.id ?? "");
  const [requestDescription, setRequestDescription] = useState("");

  const activeServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.isActive &&
          categories.some((category) => category.id === service.categoryId) &&
          sectors.some((sector) => sector.id === service.sectorId),
      ),
    [categories, sectors, services],
  );

  const requesterRequests = useMemo(
    () =>
      requests.filter(
        (request) => request.requester === "solicitante@serviceflow.local",
      ),
    [requests],
  );

  const attendantQueue = useMemo(
    () => requests.filter((request) => request.sectorId === "setor-ti"),
    [requests],
  );

  const nextStatusMap: Record<RequestStatus, RequestStatus> = {
    OPEN: "IN_PROGRESS",
    IN_PROGRESS: "COMPLETED",
    COMPLETED: "COMPLETED",
  };

  const addSector = () => {
    const trimmedName = newSectorName.trim();
    if (!trimmedName) {
      return;
    }

    const sectorAlreadyExists = sectors.some(
      (sector) => sector.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (sectorAlreadyExists) {
      return;
    }

    const nextSector: Sector = {
      id: `setor-${Date.now()}`,
      name: trimmedName,
    };

    setSectors((current) => [...current, nextSector]);
    setNewSectorName("");
    if (!newService.sectorId) {
      setNewService((current) => ({ ...current, sectorId: nextSector.id }));
    }
  };

  const addCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      return;
    }

    const categoryAlreadyExists = categories.some(
      (category) => category.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (categoryAlreadyExists) {
      return;
    }

    const nextCategory: Category = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
    };

    setCategories((current) => [...current, nextCategory]);
    setNewCategoryName("");
    if (!newService.categoryId) {
      setNewService((current) => ({ ...current, categoryId: nextCategory.id }));
    }
  };

  const addService = () => {
    const trimmedName = newService.name.trim();
    const trimmedDescription = newService.description.trim();

    if (!trimmedName || !trimmedDescription || !newService.categoryId || !newService.sectorId) {
      return;
    }

    const nextService: ServiceItem = {
      id: `svc-${Date.now()}`,
      name: trimmedName,
      description: trimmedDescription,
      categoryId: newService.categoryId,
      sectorId: newService.sectorId,
      isActive: true,
    };

    setServices((current) => [...current, nextService]);
    setSelectedServiceId(nextService.id);
    setNewService({
      name: "",
      description: "",
      categoryId: newService.categoryId,
      sectorId: newService.sectorId,
    });
  };

  const openRequest = () => {
    if (!selectedServiceId || !requestDescription.trim()) {
      return;
    }

    const service = services.find((item) => item.id === selectedServiceId);
    if (!service) {
      return;
    }

    const nextRequest: RequestItem = {
      id: `req-${Date.now()}`,
      serviceId: service.id,
      serviceName: service.name,
      requester: "solicitante@serviceflow.local",
      status: "OPEN",
      sectorId: service.sectorId,
      description: requestDescription.trim(),
    };

    setRequests((current) => [nextRequest, ...current]);
    setRequestDescription("");
    setRole("requester");
  };

  const advanceStatus = (requestId: string) => {
    setRequests((current) =>
      current.map((request) => {
        if (request.id !== requestId) {
          return request;
        }

        return {
          ...request,
          status: nextStatusMap[request.status],
        };
      }),
    );
  };

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;

  return (
    <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 1200, margin: "0 auto", padding: 24, color: "#10233d" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 38 }}>ServiceFlow</h1>
        <p style={{ margin: "8px 0 0", color: "#44607c" }}>
          Fluxo funcional da primeira entrega: administrador, catálogo, solicitação e atendimento.
        </p>
      </header>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "inline-block", marginRight: 12, fontWeight: 700 }}>Perfil</label>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #c7d3ea", minWidth: 220 }}
        >
          <option value="admin">Administrador</option>
          <option value="requester">Solicitante</option>
          <option value="attendant">Atendente</option>
        </select>
      </div>

      {role === "admin" && (
        <section>
          <div style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Administrador</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>Adicionar setor</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newSectorName}
                    onChange={(event) => setNewSectorName(event.target.value)}
                    placeholder="Ex.: Financeiro"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #c7d3ea" }}
                  />
                  <button
                    onClick={addSector}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", cursor: "pointer" }}
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>Adicionar categoria</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder="Ex.: Suporte"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #c7d3ea" }}
                  />
                  <button
                    onClick={addCategory}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", cursor: "pointer" }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <h3 style={{ marginTop: 0 }}>Cadastrar serviço</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <input
                value={newService.name}
                onChange={(event) => setNewService((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome do serviço"
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #c7d3ea" }}
              />
              <select
                value={newService.categoryId}
                onChange={(event) => setNewService((current) => ({ ...current, categoryId: event.target.value }))}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #c7d3ea" }}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={newService.sectorId}
                onChange={(event) => setNewService((current) => ({ ...current, sectorId: event.target.value }))}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #c7d3ea" }}
              >
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={newService.description}
              onChange={(event) => setNewService((current) => ({ ...current, description: event.target.value }))}
              placeholder="Descrição do serviço"
              rows={3}
              style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 8, border: "1px solid #c7d3ea", boxSizing: "border-box" }}
            />
            <div style={{ marginTop: 12 }}>
              <button
                onClick={addService}
                style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#0f766e", color: "#fff", cursor: "pointer" }}
              >
                Cadastrar serviço
              </button>
            </div>
          </div>
        </section>
      )}

      {role === "requester" && (
        <section>
          <div style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Catálogo de serviços</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {activeServices.map((service) => {
                const categoryName = categories.find((category) => category.id === service.categoryId)?.name ?? "Categoria";
                const sectorName = sectors.find((sector) => sector.id === service.sectorId)?.name ?? "Setor";

                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    style={{
                      textAlign: "left",
                      background: selectedServiceId === service.id ? "#e7f0ff" : "#fff",
                      border: selectedServiceId === service.id ? "2px solid #1a73e8" : "1px solid #dfe5f1",
                      borderRadius: 12,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{service.name}</div>
                    <div style={{ color: "#44607c", marginBottom: 8 }}>{service.description}</div>
                    <div style={{ fontSize: 12, color: "#5d7087" }}>
                      {categoryName} · {sectorName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={panelStyle}>
            <h3 style={{ marginTop: 0 }}>Abrir solicitação</h3>
            {selectedService && (
              <>
                <div style={{ marginBottom: 8, fontWeight: 700 }}>{selectedService.name}</div>
                <textarea
                  value={requestDescription}
                  onChange={(event) => setRequestDescription(event.target.value)}
                  rows={4}
                  placeholder="Descreva sua solicitação"
                  style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8, border: "1px solid #c7d3ea" }}
                />
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={openRequest}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#0f766e", color: "#fff", cursor: "pointer" }}
                  >
                    Enviar solicitação
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={panelStyle}>
            <h3 style={{ marginTop: 0 }}>Minhas solicitações</h3>
            {requesterRequests.length === 0 && <p style={{ color: "#44607c" }}>Nenhuma solicitação registrada.</p>}
            {requesterRequests.map((request) => (
              <div key={request.id} style={{ border: "1px solid #dfe5f1", borderRadius: 10, padding: 12, marginBottom: 8, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong>{request.serviceName}</strong>
                  <span style={{ background: "#dff2ea", color: "#0f766e", padding: "4px 8px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                    {request.status}
                  </span>
                </div>
                <p style={{ margin: "8px 0" }}>{request.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {role === "attendant" && (
        <section>
          <div style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Fila do setor de TI</h2>
            {attendantQueue.length === 0 && <p style={{ color: "#44607c" }}>Não há solicitações em atendimento para o setor.</p>}
            {attendantQueue.map((request) => (
              <div key={request.id} style={{ border: "1px solid #dfe5f1", background: "#fff", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong>{request.serviceName}</strong>
                  <span style={{ background: request.status === "COMPLETED" ? "#dff2ea" : "#eaf1ff", color: request.status === "COMPLETED" ? "#0f766e" : "#214b8a", padding: "4px 8px", borderRadius: 50, fontSize: 12, fontWeight: 700 }}>
                    {request.status}
                  </span>
                </div>
                <p style={{ margin: "8px 0" }}>{request.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "#44607c" }}>Solicitante: {request.requester}</span>
                  <button
                    onClick={() => advanceStatus(request.id)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#214b8a", color: "#fff", cursor: "pointer" }}
                  >
                    {request.status === "OPEN" ? "Iniciar atendimento" : request.status === "IN_PROGRESS" ? "Concluir" : "Finalizada"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}