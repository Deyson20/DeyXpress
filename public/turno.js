const turnName = document.querySelector("#turn-name");
const turnPosition = document.querySelector("#turn-position");
const statusMessage = document.querySelector("#status");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
let csrfToken = "";
let currentIndex = 0;
let people = [];

async function ensureSession() {
  const response = await fetch("/api/session");
  const session = await response.json();
  if (!response.ok) throw new Error(session.error || "No se pudo iniciar la sesión.");
  csrfToken = session.csrf;
  return session;
}

async function request(url, options = {}) {
  const send = () => fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
  });

  let response = await send();
  let result = await response.json();
  if (response.status === 403 && result.error === "Sesión inválida. Recarga la página e inténtalo de nuevo.") {
    await ensureSession();
    response = await send();
    result = await response.json();
  }
  if (!response.ok) throw new Error(result.error || "No se pudo completar la solicitud.");
  return result;
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function renderTurn() {
  const person = people[currentIndex];
  turnName.textContent = person ? person.nombre.toLocaleUpperCase("es") : "NO HAY TURNOS";
  turnPosition.textContent = person ? person.puesto.toLocaleUpperCase("es") : "";
  previousButton.disabled = !person || currentIndex === 0;
  nextButton.disabled = !person || currentIndex >= people.length - 1;
}

async function loadTurn() {
  const [session, currentPeople] = await Promise.all([ensureSession(), request("/api/people")]);
  currentIndex = session.index;
  people = currentPeople;
  renderTurn();
}

async function changeTurn(direction) {
  try {
    await ensureSession();
    const result = await request("/api/turn", {
      method: "POST",
      body: JSON.stringify({ direction }),
    });
    currentIndex = result.index;
    csrfToken = result.csrf;
    people = await request("/api/people");
    renderTurn();
    showStatus("");
  } catch (error) {
    showStatus(error.message, true);
  }
}

previousButton.addEventListener("click", () => changeTurn("previous"));
nextButton.addEventListener("click", () => changeTurn("next"));

loadTurn().catch((error) => showStatus(error.message, true));
