import useSWR from "swr";

async function fetchAPI(endpoint) {
  const response = await fetch(endpoint);
  const responseBody = await response.json();
  return responseBody;
}

export default function Status() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <Dependencies />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let UpdatedAtText = "Carregando...";
  if (!isLoading && data) {
    UpdatedAtText = new Date(data.updated_at).toLocaleString();
  }

  return (
    <>
      <div>Última atualização: {UpdatedAtText}</div>
    </>
  );
}

function Dependencies() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if (isLoading || !data) {
    return <div>Carregando dependências...</div>;
  }

  const { database } = data.dependencies;

  return (
    <>
      <h2>Dependências</h2>
      <ul>
        <li>
          <div>Banco de dados</div>
          <ul>
            <li>Versão: {database.version}</li>
            <li>Máx. Conexões: {database.max_connections}</li>
            <li>Conexões Abertas: {database.opened_connections}</li>
          </ul>
        </li>
      </ul>
    </>
  );
}
