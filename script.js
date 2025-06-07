// Vider tout cache existant au démarrage
if ("caches" in window) {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => caches.delete(cacheName));
  });
}

// Récupération de l'ID depuis le localStorage ou valeur par défaut
let stationId = localStorage.getItem("stationId") || stations[0].id;

// Génération du menu déroulant
function createStationSelector() {
  const container = document.getElementById("stationSelectorContainer");
  const select = document.createElement("select");
  select.id = "stationSelector";

  // Styles du selecteur
  select.style.margin = "1rem auto";
  select.style.padding = "0.5rem 1rem";
  select.style.fontSize = "1rem";
  select.style.background = "#2a2a2a";
  select.style.color = "#ffffff";
  select.style.border = "1px solid #555";
  select.style.borderRadius = "6px";
  select.style.width = "260px";
  select.style.textOverflow = "ellipsis";
  select.style.whiteSpace = "nowrap";
  select.style.overflow = "hidden";

  // Remplissage des options
  stations.forEach(({ id, nom }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = nom;
    if (id === stationId) option.selected = true;
    select.appendChild(option);
  });

  // Gestion du changement de station
  select.addEventListener("change", () => {
    localStorage.setItem("stationId", select.value);
    window.location.reload(); // Rechargement complet pour appliquer les changements
  });

  container.innerHTML = "";
  container.appendChild(select);
}

// Construction de l'URL API avec anti-cache
function buildApiUrl(stationId) {
  const baseUrl =
    "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records";
  const params = new URLSearchParams({
    select: [
      "id",
      "adresse",
      "cp",
      "ville",
      "departement",
      "region",
      "gazole_prix",
      "gazole_maj",
      "e85_prix",
      "e85_maj",
      "gplc_prix",
      "gplc_maj",
      "e10_prix",
      "e10_maj",
      "sp98_prix",
      "sp98_maj",
      "sp95_prix",
      "sp95_maj",
      "carburants_indisponibles",
      "carburants_rupture_temporaire"
    ].join(", "),
    limit: "1",
    refine: `id:${stationId}`,
    lang: "fr",
    timezone: "Europe/Paris",
    _: Date.now().toString() // Anti-cache
  });

  return `${baseUrl}?${params.toString()}`;
}

// Données carburants avec icônes et couleurs
const carburants = {
  gazole_prix: { nom: "Gazole (B7)", icone: "fa-solid fa-oil-can", couleur: "#cccc00", alias: "Gazole" },
  e85_prix: { nom: "E85", icone: "fa-solid fa-leaf", couleur: "#33cc33", alias: "E85" },
  gplc_prix: { nom: "GPLc (LPG)", icone: "fa-solid fa-fire", couleur: "#ff6600", alias: "GPLc" },
  e10_prix: { nom: "SP95-E10", icone: "fa-solid fa-gas-pump", couleur: "#3399ff", alias: "E10" },
  sp98_prix: { nom: "SP98 (E5)", icone: "fa-solid fa-car-side", couleur: "#ff3366", alias: "SP98" },
  sp95_prix: { nom: "SP95 (E5)", icone: "fa-solid fa-truck-pickup", couleur: "#66ccff", alias: "SP95" }
};

// Fonction principale pour charger et afficher les données
async function loadAndDisplayData() {
  try {
    const url = buildApiUrl(stationId);
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    const record = data.results[0];

    // Mise à jour des infos de la station
    const stationInfo = document.getElementById("stationInfo");
    if (stationInfo) {
      stationInfo.innerHTML = `<strong>${record.adresse}</strong><br>${record.cp} ${record.ville}, ${record.departement}, ${record.region}`;
    }

    // Mise à jour du titre
    const selectedStation = stations.find((s) => s.id === stationId);
    const pageTitle = document.getElementById("pageTitle");
    if (selectedStation && pageTitle) {
      pageTitle.textContent = `⛽ Prix Carburants - ${selectedStation.nom}`;
    }

    // Affichage des carburants
    const container = document.getElementById("carburantContainer");
    container.innerHTML = "";

    const indisponibles = record.carburants_indisponibles || [];
    const ruptures = record.carburants_rupture_temporaire || [];

    for (const [champ, { nom, icone, couleur, alias }] of Object.entries(carburants)) {
      const enRupture = ruptures.includes(alias);
      const estIndisponible = indisponibles.includes(alias);

      if (enRupture) {
        const block = document.createElement("div");
        block.className = "rupture";
        block.innerHTML = `
          <div class="type"><i class="${icone}"></i> ${nom}</div>
          <div class="message">Rupture de stock</div>
          <div class="maj">Non disponible</div>
        `;
        container.appendChild(block);
        continue;
      }

      if (estIndisponible) continue;

      const prix = record[champ];
      const majIso = record[champ.replace("_prix", "_maj")];
      let majFormatted = "Non disponible";

      if (majIso) {
        const date = new Date(majIso);
        majFormatted = date.toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Paris"
        });
      }

      const block = document.createElement("div");
      block.className = "carburant";
      block.innerHTML = `
        <div class="type">
          <i class="${icone}" style="color: ${couleur}; margin-right: 0.5rem;"></i>${nom}
        </div>
        <div class="prix">${prix ? prix.toFixed(3) + " €" : "N/A"}</div>
        <div class="maj">Dernière MàJ : ${majFormatted}</div>
      `;
      container.appendChild(block);
    }
  } catch (err) {
    console.error("Erreur lors du chargement des données :", err);
    const container = document.getElementById("carburantContainer");
    if (container) {
      container.innerHTML = `<div class="error">Erreur de chargement des données. Veuillez réessayer.</div>`;
    }
  }
}

// Initialisation de l'application
function initApp() {
  createStationSelector();
  loadAndDisplayData();

  // Mise à jour automatique toutes les heures
  setInterval(
    () => {
      window.location.reload();
    },
    60 * 60 * 1000
  );
}

function refreshPage() {
    location.reload(); // Rafraîchit la page
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth" // Défilement fluide vers le haut
    });
}

// Démarrer l'app
initApp();
