const url =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=id%2C%20adresse%2C%20cp%2C%20ville%2C%20departement%2C%20region%2C%20gazole_prix%2C%20gazole_maj%2C%20e85_prix%2C%20e85_maj%2C%20gplc_prix%2C%20gplc_maj%2C%20e10_prix%2C%20e10_maj%2C%20sp98_prix%2C%20sp98_maj%2C%20sp95_prix%2C%20sp95_maj%2C%20carburants_indisponibles%2C%20carburants_rupture_temporaire&limit=1&refine=id%3A75014008&lang=fr&timezone=Europe%2FParis";

const carburants = {
  gazole_prix: { nom: "Gazole (B7)", icone: "fa-solid fa-oil-can", couleur: "#cccc00", alias: "Gazole" },
  e85_prix: { nom: "E85", icone: "fa-solid fa-leaf", couleur: "#33cc33", alias: "E85" },
  gplc_prix: { nom: "GPLc (LPG)", icone: "fa-solid fa-fire", couleur: "#ff6600", alias: "GPLc" },
  e10_prix: { nom: "SP95-E10", icone: "fa-solid fa-gas-pump", couleur: "#3399ff", alias: "E10" },
  sp98_prix: { nom: "SP98 (E5)", icone: "fa-solid fa-car-side", couleur: "#ff3366", alias: "SP98" },
  sp95_prix: { nom: "SP95 (E5)", icone: "fa-solid fa-truck-pickup", couleur: "#66ccff", alias: "SP95" }
};

fetch(url)
  .then((res) => res.json())
  .then((data) => {
    const record = data.results[0];
    const stationInfo = document.getElementById("stationInfo");
    stationInfo.innerHTML = `<strong>${record.adresse}</strong><br>${record.cp} ${record.ville}, ${record.departement}, ${record.region}`;

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
        <div class="maj">${majFormatted}</div>
      `;
      container.appendChild(block);
    }
  })
  .catch((err) => {
    console.error("Erreur lors du chargement des données :", err);
  });

function actualiserALHeure() {
  const maintenant = new Date();
  const prochainHeure = new Date(maintenant);
  prochainHeure.setHours(maintenant.getHours() + 1);
  prochainHeure.setMinutes(0, 0, 0);
  const delai = prochainHeure.getTime() - maintenant.getTime();
  setTimeout(() => location.reload(), delai);
}

actualiserALHeure();
