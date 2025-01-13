const { exec } = require("node:child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout, stderr) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }

    console.log("\n🟢 POSTGRES está pronto e aceitando conexões!");

  }
}

process.stdout.write("\n\n🟡 Aguardando POSTGRES aceitar conexões");
checkPostgres();