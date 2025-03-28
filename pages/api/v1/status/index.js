import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

const status = async (request, response) => {
  try {
    const updated_at = new Date().toISOString();
    const databaseName = process.env.POSTGRES_DB;

    const databaseVersionResult = await database.query(`SHOW server_version;`);
    const databaseVersionValue = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query(
      `SHOW max_connections;`,
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].max_connections;

    const databaseOpenedConnectionsResult = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datName = $1;",
      values: [databaseName],
    });
    const databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].count;

    response.status(200).json({
      updated_at,
      dependencies: {
        database: {
          version: databaseVersionValue,
          max_connections: Number(databaseMaxConnectionsValue),
          opened_connections: databaseOpenedConnectionsValue,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });
    console.log("Erro dentro do catch do controller: status");
    console.error(publicErrorObject);
    response.status(publicErrorObject.statusCode).json(publicErrorObject);
  }
};

export default status;
