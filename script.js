// Liste des stations disponibles
const stations = [
  { id: "68200004", nom: "Carrefour Mulhouse Dornach" },
  { id: "68390004", nom: "A35 - Aire de Battenheim" },
  { id: "68313001", nom: "Carrefour Illzach" }
];

// Récupération de l'ID depuis le localStorage ou valeur par défaut
let stationId = localStorage.getItem("stationId") || stations[0].id;

// Génération du menu déroulant
function createStationSelector() {
  const container = document.getElementById("stationSelectorContainer");
  const select = document.createElement("select");
  select.id = "stationSelector";
  select.style.margin = "1rem auto";
  select.style.padding = "0.5rem";
  select.style.fontSize = "1rem";

  stations.forEach(({ id, nom }) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = nom;
    if (id === stationId) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    localStorage.setItem("stationId", select.value);
    location.reload();
  });

  container.innerHTML = ""; // clean if reloaded
  container.appendChild(select);
}

createStationSelector();

// Construction de l’URL API avec désactivation du cache
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
  _: Date.now().toString() // désactive le cache
});

const url = `${baseUrl}?${params.toString()}`;

// Données carburants
const carburants = {
  gazole_prix: { nom: "Gazole (B7)", icone: "fa-solid fa-oil-can", couleur: "#cccc00", alias: "Gazole" },
  e85_prix:    { nom: "E85",         icone: "fa-solid fa-leaf",     couleur: "#33cc33", alias: "E85" },
  gplc_prix:   { nom: "GPLc (LPG)",  icone: "fa-solid fa-fire",     couleur: "#ff6600", alias: "GPLc" },
  e10_prix:    { nom: "SP95-E10",    icone: "fa-solid fa-gas-pump", couleur: "#3399ff", alias: "E10" },
  sp98_prix:   { nom: "SP98 (E5)",   icone: "fa-solid fa-car-side", couleur: "#ff3366", alias: "SP98" },
  sp95_prix:   { nom: "SP95 (E5)",   icone: "fa-solid fa-truck-pickup", couleur: "#66ccff", alias: "SP95" }
};

// Récupération et affichage
fetch(url, { cache: "no-store" })
  .then((res) => res.json())
  .then((data) => {
    const record = data.results[0];
    const stationInfo = document.getElementById("stationInfo");
    stationInfo.innerHTML = `<strong>${record.adresse}</strong><br>${record.cp} ${record.ville}, ${record.departement}, ${record.region}`;

    const selectedStation = stations.find(s => s.id === stationId);
    const pageTitle = document.getElementById("pageTitle");
    if (selectedStation && pageTitle) {
      pageTitle.textContent = `⛽ Prix Carburants - ${selectedStation.nom}`;
    }

    const container = document.getElementById("carburantContainer");
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
  })
  .catch((err) => {
    console.error("Erreur lors du chargement des données :", err);
  });

// Mise à jour automatique à l'heure pile
function actualiserALHeure() {
  const maintenant = new Date();
  const prochainHeure = new Date(maintenant);
  prochainHeure.setHours(maintenant.getHours() + 1);
  prochainHeure.setMinutes(0, 0, 0);
  const delai = prochainHeure.getTime() - maintenant.getTime();
  setTimeout(() => location.reload(), delai);
}

actualiserALHeure();
