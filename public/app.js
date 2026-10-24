const form = document.querySelector("#person-form");
const peopleList = document.querySelector("#people-list");
const statusMessage = document.querySelector("#status");
const deleteAllButton = document.querySelector("#delete-all");
let csrfToken = "";

async function ensureSession() {
  const response = await fetch("/api/session");
  const session = await response.json();
  if (!response.ok) throw new Error(session.error || "No se pudo iniciar la sesión.");
  csrfToken = session.csrf;
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

async function loadPeople() {
  const people = await request("/api/people");
  peopleList.replaceChildren();

  if (people.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No hay personas agregadas.";
    peopleList.append(emptyItem);
    return;
  }

  for (const person of people) {
    const item = document.createElement("li");
    const description = document.createElement("span");
    description.textContent = `${person.nombre} - ${person.puesto}`;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "small-button";
    deleteButton.textContent = "Eliminar";
    deleteButton.addEventListener("click", async () => {
      if (!confirm("¿Estás seguro de que deseas eliminar a esta persona?")) return;
      try {
        await request(`/api/people/${person.id}`, { method: "DELETE" });
        await loadPeople();
        showStatus("Persona eliminada.");
      } catch (error) {
        showStatus(error.message, true);
      }
    });

    item.append(description, deleteButton);
    peopleList.append(item);
  }
}

async function initialize() {
  try {
    await ensureSession();
    await loadPeople();
  } catch (error) {
    showStatus(error.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  try {
    await ensureSession();
    await request("/api/people", {
      method: "POST",
      body: JSON.stringify({
        nombre: data.get("nombre"),
        puesto: data.get("puesto"),
      }),
    });
    form.reset();
    await loadPeople();
    showStatus("Persona agregada.");
  } catch (error) {
    showStatus(error.message, true);
  }
});

deleteAllButton.addEventListener("click", async () => {
  if (!confirm("¿Estás seguro de que deseas eliminar todos los registros?")) return;
  try {
    await ensureSession();
    await request("/api/people", { method: "DELETE" });
    await loadPeople();
    showStatus("Todos los registros eliminados.");
  } catch (error) {
    showStatus(error.message, true);
  }
});

initialize();
