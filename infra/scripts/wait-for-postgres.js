const { exec } = require("node:child_process");

let intervalId;
function startLoader({ text = "Loading ...", frames, interval = 100 }) {
  const loader = frames ?? ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let index = 0;
  intervalId = setInterval(function () {
    process.stdout.write(`\r ${loader[index++]} ${text}`);
    index = index < loader.length - 1 ? index : 0;
  }, 100);
}

function stopLoader() {
  clearInterval(intervalId);
  process.stdout.write("\r\x1b[K");
}

function checkPostgres() {
  function handleReturn(error, stdout, stderr) {
    if (stdout.search("accepting connections") === -1) {
      checkPostgres();
      return;
    }
    stopLoader();
    console.log("🟢 Postgres está pronto e aceitando conexões.");
  }

  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);
}
startLoader({
  text: "🟡 Aguardando o postgres aceitar conexões",
});

checkPostgres();
