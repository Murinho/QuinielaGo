const countryById = COUNTRY_DATA;
const allCountryIds = POTS.flatMap((pot) => pot.countries);
const probabilityRanking = Object.values(countryById).sort((a, b) => {
  if (b.probability !== a.probability) {
    return b.probability - a.probability;
  }

  return a.name.localeCompare(b.name, "es");
});

const participants = [];
const selectedCountries = new Map(allCountryIds.map((id) => [id, true]));

let gameState = null;

const els = {
  appShell: document.querySelector(".app-shell"),
  participantCount: document.querySelector("#participantCount"),
  teamSlotCount: document.querySelector("#teamSlotCount"),
  selectedCountryCount: document.querySelector("#selectedCountryCount"),
  selectedCountryPill: document.querySelector("#selectedCountryPill"),
  participantsList: document.querySelector("#participantsList"),
  participantEmpty: document.querySelector("#participantEmpty"),
  potsGrid: document.querySelector("#potsGrid"),
  balanceStatus: document.querySelector("#balanceStatus"),
  balanceCopy: document.querySelector("#balanceCopy"),
  personDialog: document.querySelector("#personDialog"),
  personForm: document.querySelector("#personForm"),
  personName: document.querySelector("#personName"),
  teamAmount: document.querySelector("#teamAmount"),
  validationDialog: document.querySelector("#validationDialog"),
  validationCard: document.querySelector(".validation-card"),
  validationEyebrow: document.querySelector("#validationEyebrow"),
  validationTitle: document.querySelector("#validationTitle"),
  validationCopy: document.querySelector("#validationCopy"),
  validationTeams: document.querySelector("#validationTeams"),
  validationCountries: document.querySelector("#validationCountries"),
  closeValidation: document.querySelector("#closeValidation"),
  startGameButton: document.querySelector("#startGameButton"),
  gameShell: document.querySelector("#gameShell"),
  turnNumber: document.querySelector("#turnNumber"),
  assignedCount: document.querySelector("#assignedCount"),
  remainingCount: document.querySelector("#remainingCount"),
  backToMenuButton: document.querySelector("#backToMenuButton"),
  personStep: document.querySelector("#personStep"),
  countryStep: document.querySelector("#countryStep"),
  assignmentStep: document.querySelector("#assignmentStep"),
  summaryStep: document.querySelector("#summaryStep"),
  personWheel: document.querySelector("#personWheel"),
  countryWheel: document.querySelector("#countryWheel"),
  spinPersonButton: document.querySelector("#spinPersonButton"),
  spinCountryButton: document.querySelector("#spinCountryButton"),
  personSpinCopy: document.querySelector("#personSpinCopy"),
  countrySpinCopy: document.querySelector("#countrySpinCopy"),
  selectedPersonResult: document.querySelector("#selectedPersonResult"),
  selectedCountryResult: document.querySelector("#selectedCountryResult"),
  assignmentHero: document.querySelector("#assignmentHero"),
  nextTurnButton: document.querySelector("#nextTurnButton"),
  summaryList: document.querySelector("#summaryList"),
  newGameButton: document.querySelector("#newGameButton"),
};

function flagUrl(code, width = 80) {
  return `https://flagcdn.com/w${width}/${code}.png`;
}

function fallbackFlag(code, width = 80) {
  const fallback = code === "gb-eng" || code === "gb-sct" ? "gb" : code;
  return `https://flagcdn.com/w${width}/${fallback}.png`;
}

function makeId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `person-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pluralizeTeams(amount) {
  return amount === 1 ? "1 equipo" : `${amount} equipos`;
}

function formatProbability(value) {
  if (value < 0.1) {
    return "<0.1%";
  }

  return `${Number(value.toFixed(1))}%`;
}

function getTeamTotal() {
  return participants.reduce((total, person) => total + person.teams, 0);
}

function getSelectedCountryIds() {
  return allCountryIds.filter((id) => selectedCountries.get(id));
}

function getSelectedCountryTotal() {
  return getSelectedCountryIds().length;
}

function getProbabilityRank(countryId) {
  return probabilityRanking.findIndex((country) => country.id === countryId) + 1;
}

function getGroupMembers(country) {
  return GROUPS[country.group].map((id) => countryById[id]);
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getReadableTextColor(hexColor) {
  const cleanHex = hexColor.replace("#", "");
  const red = Number.parseInt(cleanHex.slice(0, 2), 16);
  const green = Number.parseInt(cleanHex.slice(2, 4), 16);
  const blue = Number.parseInt(cleanHex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? "#111111" : "#ffffff";
}

function getRandomPaletteColor() {
  return FIFA_COLORS[Math.floor(Math.random() * FIFA_COLORS.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function renderPots() {
  els.potsGrid.innerHTML = POTS.map((pot) => {
    const selectedInPot = pot.countries.filter((id) => selectedCountries.get(id)).length;

    const countriesMarkup = pot.countries
      .map((id) => {
        const country = countryById[id];
        const isSelected = selectedCountries.get(id);
        const checked = isSelected ? "checked" : "";
        const selectedClass = isSelected ? " is-selected" : "";
        const escapedName = escapeHtml(country.name);

        return `
          <label class="country-card${selectedClass}" data-country-id="${country.id}">
            <input class="country-checkbox" type="checkbox" data-country-id="${country.id}" data-pot-id="${pot.id}" ${checked} />
            <span class="country-check" aria-hidden="true"></span>
            <img
              class="flag"
              src="${flagUrl(country.flagCode)}"
              alt="Bandera de ${escapedName}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${fallbackFlag(country.flagCode)}';"
            />
            <span class="country-name">${escapedName}</span>
          </label>
        `;
      })
      .join("");

    return `
      <article class="pot-panel" data-pot="${pot.id}">
        <div class="pot-header">
          <label class="pot-toggle">
            <input class="pot-checkbox" type="checkbox" data-pot-id="${pot.id}" />
            <span class="pot-box" aria-hidden="true"></span>
            <span>${pot.name}</span>
          </label>
          <span class="pot-count" data-pot-count="${pot.id}">${selectedInPot}/${pot.countries.length}</span>
        </div>
        <div class="country-list">${countriesMarkup}</div>
      </article>
    `;
  }).join("");

  updatePotCheckboxes();
}

function renderParticipants() {
  els.participantEmpty.hidden = participants.length > 0;
  els.participantsList.innerHTML = participants
    .map(
      (person) => `
        <article class="person-card" style="--person-color: ${person.color}">
          <div class="person-name">${escapeHtml(person.name)}</div>
          <span class="team-badge">${pluralizeTeams(person.teams)}</span>
          <button class="remove-person" type="button" data-person-id="${person.id}" aria-label="Quitar a ${escapeHtml(person.name)}">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </article>
      `,
    )
    .join("");
}

function updatePotCheckboxes() {
  POTS.forEach((pot) => {
    const selectedInPot = pot.countries.filter((id) => selectedCountries.get(id)).length;
    const checkbox = document.querySelector(`.pot-checkbox[data-pot-id="${pot.id}"]`);
    const count = document.querySelector(`[data-pot-count="${pot.id}"]`);

    if (checkbox) {
      checkbox.checked = selectedInPot === pot.countries.length;
      checkbox.indeterminate = selectedInPot > 0 && selectedInPot < pot.countries.length;
    }

    if (count) {
      count.textContent = `${selectedInPot}/${pot.countries.length}`;
    }
  });
}

function updateCountryCard(countryId) {
  const checkbox = document.querySelector(`.country-checkbox[data-country-id="${countryId}"]`);
  const card = document.querySelector(`.country-card[data-country-id="${countryId}"]`);
  const isSelected = selectedCountries.get(countryId);

  if (checkbox) {
    checkbox.checked = isSelected;
  }

  if (card) {
    card.classList.toggle("is-selected", isSelected);
  }
}

function updateSummary() {
  const teamTotal = getTeamTotal();
  const selectedTotal = getSelectedCountryTotal();

  els.participantCount.textContent = participants.length;
  els.teamSlotCount.textContent = teamTotal;
  els.selectedCountryCount.textContent = selectedTotal;
  els.selectedCountryPill.textContent = selectedTotal;

  els.balanceStatus.classList.toggle("is-ready", teamTotal > 0 && teamTotal === selectedTotal);

  if (participants.length === 0) {
    els.balanceCopy.textContent = "Agrega participantes para iniciar.";
  } else if (selectedTotal === 0) {
    els.balanceCopy.textContent = "Selecciona al menos un país.";
  } else if (teamTotal === selectedTotal) {
    els.balanceCopy.textContent = "Todo listo para jugar.";
  } else if (teamTotal > selectedTotal) {
    els.balanceCopy.textContent = `Faltan ${teamTotal - selectedTotal} países.`;
  } else {
    els.balanceCopy.textContent = `Sobran ${selectedTotal - teamTotal} países.`;
  }
}

function resetPersonForm() {
  els.personForm.reset();
  els.teamAmount.value = "1";
}

function openPersonDialog() {
  resetPersonForm();
  els.personDialog.showModal();
  window.setTimeout(() => els.personName.focus(), 0);
}

function closePersonDialog() {
  els.personDialog.close();
}

function clampTeamAmount() {
  const value = Number.parseInt(els.teamAmount.value, 10);
  const safeValue = Number.isFinite(value) ? value : 1;
  els.teamAmount.value = String(Math.min(48, Math.max(1, safeValue)));
}

function stepTeamAmount(direction) {
  clampTeamAmount();
  const nextValue = Number.parseInt(els.teamAmount.value, 10) + direction;
  els.teamAmount.value = String(Math.min(48, Math.max(1, nextValue)));
}

function addParticipant(event) {
  event.preventDefault();
  clampTeamAmount();

  const name = els.personName.value.trim();
  const teams = Number.parseInt(els.teamAmount.value, 10);

  if (!name) {
    els.personName.focus();
    return;
  }

  participants.push({
    id: makeId(),
    name,
    teams,
    color: getRandomPaletteColor(),
  });

  renderParticipants();
  updateSummary();
  closePersonDialog();
}

function showValidation() {
  const teamTotal = getTeamTotal();
  const selectedTotal = getSelectedCountryTotal();
  const diff = Math.abs(teamTotal - selectedTotal);
  const canStart = participants.length > 0 && selectedTotal > 0;
  let title = "Revisa la quiniela";
  let eyebrow = "Balance";
  let copy = "";
  let ready = false;

  if (participants.length === 0) {
    title = "Faltan participantes";
    eyebrow = "Pendiente";
    copy = "Agrega al menos una persona antes de iniciar el sorteo.";
  } else if (selectedTotal === 0) {
    title = "Faltan países";
    eyebrow = "Pendiente";
    copy = "Selecciona al menos un país para poder armar la quiniela.";
  } else if (teamTotal > selectedTotal) {
    title = "Faltan países";
    eyebrow = "Desbalance";
    copy = `Hay ${teamTotal} equipos pedidos y ${selectedTotal} países elegidos. Faltan ${diff} países para cubrir a todos los participantes.`;
  } else if (teamTotal < selectedTotal) {
    title = "Sobran países";
    eyebrow = "Desbalance";
    copy = `Hay ${teamTotal} equipos pedidos y ${selectedTotal} países elegidos. Sobran ${diff} países sin asignar al terminar el sorteo.`;
  } else {
    title = "Todo listo";
    eyebrow = "Listo";
    copy = `${teamTotal} equipos pedidos y ${selectedTotal} países elegidos. La quiniela está balanceada.`;
    ready = true;
  }

  els.validationTitle.textContent = title;
  els.validationEyebrow.textContent = eyebrow;
  els.validationCopy.textContent = copy;
  els.validationTeams.textContent = teamTotal;
  els.validationCountries.textContent = selectedTotal;
  els.validationCard.classList.toggle("is-ready", ready);
  els.validationCard.classList.toggle("has-warning", !ready);
  els.startGameButton.hidden = !canStart;
  els.startGameButton.textContent = ready ? "Iniciar sorteo" : "Jugar de todos modos";
  els.validationDialog.showModal();
}

function buildParticipantSlots() {
  return participants.map((person) => ({
    id: person.id,
    name: person.name,
    teams: person.teams,
    color: person.color,
    assignedCountryIds: [],
  }));
}

function getEligibleParticipants() {
  return gameState.participants.filter((person) => person.assignedCountryIds.length < person.teams);
}

function startGame() {
  const countryIds = getSelectedCountryIds();

  if (!participants.length || !countryIds.length) {
    showValidation();
    return;
  }

  gameState = {
    participants: buildParticipantSlots(),
    remainingCountryIds: [...countryIds],
    assignments: [],
    selectedPersonId: null,
    selectedCountryId: null,
    personRotation: 0,
    countryRotation: 0,
    isSpinning: false,
  };

  els.validationDialog.close();
  els.appShell.hidden = true;
  els.gameShell.hidden = false;
  document.body.classList.add("playing-game");
  renderPersonStep();
}

function returnToMenu() {
  gameState = null;
  els.gameShell.hidden = true;
  els.appShell.hidden = false;
  document.body.classList.remove("playing-game");
}

function setGameStep(stepName) {
  const stepByName = {
    person: els.personStep,
    country: els.countryStep,
    assignment: els.assignmentStep,
    summary: els.summaryStep,
  };

  Object.entries(stepByName).forEach(([name, element]) => {
    element.hidden = name !== stepName;
  });
}

function updateGameProgress() {
  if (!gameState) {
    return;
  }

  const assigned = gameState.assignments.length;
  const totalPossible = Math.min(getTeamTotal(), getSelectedCountryTotal());

  els.turnNumber.textContent = Math.min(assigned + 1, Math.max(totalPossible, 1));
  els.assignedCount.textContent = assigned;
  els.remainingCount.textContent = gameState.remainingCountryIds.length;
}

function renderWheel(wheelEl, items, rotation) {
  if (!items.length) {
    wheelEl.innerHTML = "";
    wheelEl.style.setProperty("--wheel-gradient", "conic-gradient(var(--wc-teal), var(--wc-blue))");
    wheelEl.style.setProperty("--wheel-rotation", "0deg");
    return;
  }

  const segmentAngle = 360 / items.length;
  const gradient = items
    .map((item, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  const labels = items
    .map((item, index) => {
      const center = index * segmentAngle + segmentAngle / 2;
      const label = item.shortLabel || item.label;
      const textColor = getReadableTextColor(item.color);

      return `
        <span class="wheel-label" style="--angle: ${center}deg; --label-color: ${textColor}">
          <span>${escapeHtml(label)}</span>
        </span>
      `;
    })
    .join("");

  wheelEl.style.setProperty("--wheel-gradient", `conic-gradient(from -90deg, ${gradient})`);
  wheelEl.style.setProperty("--wheel-rotation", `${rotation}deg`);
  wheelEl.style.removeProperty("--spin-duration");
  wheelEl.innerHTML = `
    ${labels}
    <div class="wheel-center">
      <img src="assets/world_cup_2026_logo.png" alt="" aria-hidden="true" />
    </div>
  `;
}

function spinWheel({ wheelEl, items, rotationKey, selectedIndex, onDone }) {
  const duration = randomInt(4000, 8000);
  const segmentAngle = 360 / items.length;
  const selectedCenter = selectedIndex * segmentAngle + segmentAngle / 2;
  const currentRotation = gameState[rotationKey];
  const targetRotation = -selectedCenter;
  const delta = positiveModulo(targetRotation - currentRotation, 360);
  const fullTurns = randomInt(6, 10) * 360;
  const finalRotation = currentRotation + fullTurns + delta;

  gameState.isSpinning = true;
  gameState[rotationKey] = finalRotation;
  wheelEl.classList.add("is-spinning");
  wheelEl.style.setProperty("--spin-duration", `${duration}ms`);
  wheelEl.style.setProperty("--wheel-rotation", `${finalRotation}deg`);

  window.setTimeout(() => {
    if (!gameState) {
      return;
    }

    wheelEl.classList.remove("is-spinning");
    gameState.isSpinning = false;
    onDone();
  }, duration + 150);
}

function renderSelectedResult(element, title, body, flagCode = null) {
  const flagMarkup = flagCode
    ? `<img class="selected-flag" src="${flagUrl(flagCode)}" alt="" onerror="this.onerror=null;this.src='${fallbackFlag(flagCode)}';" />`
    : "";

  element.hidden = false;
  element.innerHTML = `
    ${flagMarkup}
    <div>
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(body)}</strong>
    </div>
  `;
}

function renderPersonStep() {
  if (!gameState) {
    return;
  }

  const eligibleParticipants = getEligibleParticipants();

  if (!eligibleParticipants.length || !gameState.remainingCountryIds.length) {
    renderSummaryStep();
    return;
  }

  setGameStep("person");
  updateGameProgress();
  els.selectedPersonResult.hidden = true;
  els.spinPersonButton.disabled = false;
  els.personSpinCopy.textContent = "La flecha marca a la persona que recibirá el siguiente país.";

  const wheelItems = eligibleParticipants.map((person) => ({
    id: person.id,
    label: person.name,
    shortLabel: person.name,
    color: person.color,
  }));

  renderWheel(els.personWheel, wheelItems, gameState.personRotation);
}

function renderCountryStep() {
  if (!gameState) {
    return;
  }

  setGameStep("country");
  updateGameProgress();
  els.selectedCountryResult.hidden = true;
  els.spinCountryButton.disabled = false;

  const person = gameState.participants.find((item) => item.id === gameState.selectedPersonId);
  els.countrySpinCopy.textContent = `${person.name} recibirá el país que marque la flecha.`;

  const wheelItems = gameState.remainingCountryIds.map((id) => {
    const country = countryById[id];

    return {
      id,
      label: country.name,
      shortLabel: country.shortName,
      color: country.color,
    };
  });

  renderWheel(els.countryWheel, wheelItems, gameState.countryRotation);
}

function spinPerson() {
  if (!gameState || gameState.isSpinning) {
    return;
  }

  const eligibleParticipants = getEligibleParticipants();

  if (!eligibleParticipants.length || !gameState.remainingCountryIds.length) {
    renderSummaryStep();
    return;
  }

  const selectedIndex = Math.floor(Math.random() * eligibleParticipants.length);
  const selectedPerson = eligibleParticipants[selectedIndex];

  els.spinPersonButton.disabled = true;
  els.personSpinCopy.textContent = "Girando la ruleta de participantes...";

  spinWheel({
    wheelEl: els.personWheel,
    items: eligibleParticipants,
    rotationKey: "personRotation",
    selectedIndex,
    onDone: () => {
      if (!gameState) {
        return;
      }

      gameState.selectedPersonId = selectedPerson.id;
      renderSelectedResult(els.selectedPersonResult, "Participante seleccionado", selectedPerson.name);
      els.personSpinCopy.textContent = `${selectedPerson.name} fue seleccionado.`;
      window.setTimeout(renderCountryStep, 900);
    },
  });
}

function spinCountry() {
  if (!gameState || gameState.isSpinning || !gameState.selectedPersonId) {
    return;
  }

  if (!gameState.remainingCountryIds.length) {
    renderSummaryStep();
    return;
  }

  const selectedIndex = Math.floor(Math.random() * gameState.remainingCountryIds.length);
  const countryId = gameState.remainingCountryIds[selectedIndex];
  const country = countryById[countryId];

  els.spinCountryButton.disabled = true;
  els.countrySpinCopy.textContent = "Girando la ruleta de países...";

  spinWheel({
    wheelEl: els.countryWheel,
    items: gameState.remainingCountryIds.map((id) => countryById[id]),
    rotationKey: "countryRotation",
    selectedIndex,
    onDone: () => {
      if (!gameState) {
        return;
      }

      gameState.selectedCountryId = countryId;
      renderSelectedResult(els.selectedCountryResult, "País seleccionado", country.name, country.flagCode);
      els.countrySpinCopy.textContent = `${country.name} fue seleccionado.`;
      window.setTimeout(assignSelectedCountry, 900);
    },
  });
}

function assignSelectedCountry() {
  const person = gameState.participants.find((item) => item.id === gameState.selectedPersonId);
  const countryId = gameState.selectedCountryId;

  if (!person || !countryId) {
    renderSummaryStep();
    return;
  }

  person.assignedCountryIds.push(countryId);
  gameState.remainingCountryIds = gameState.remainingCountryIds.filter((id) => id !== countryId);
  gameState.assignments.push({
    personId: person.id,
    countryId,
  });

  renderAssignmentStep(person, countryById[countryId]);
}

function renderPlayerCard(player, index, country) {
  const [name, position, photo] = player;
  const media = photo
    ? `<img src="${photo}" alt="Foto de ${escapeHtml(name)}" loading="lazy" />`
    : `<span>${escapeHtml(getInitials(name))}</span>`;

  return `
    <article class="player-card">
      <div class="player-photo" style="--country-color: ${country.color}">
        ${media}
      </div>
      <div>
        <span>#${index + 1}</span>
        <strong>${escapeHtml(name)}</strong>
        <p>${escapeHtml(position)}</p>
      </div>
    </article>
  `;
}

function renderProbabilityBoard(selectedCountry) {
  const topFive = probabilityRanking.slice(0, 5);
  const selectedRank = getProbabilityRank(selectedCountry.id);
  const selectedAlreadyShown = topFive.some((country) => country.id === selectedCountry.id);
  const countriesToShow = selectedAlreadyShown ? topFive : [...topFive, selectedCountry];

  return countriesToShow
    .map((country) => {
      const rank = getProbabilityRank(country.id);
      const width = Math.max(2, (country.probability / probabilityRanking[0].probability) * 100);
      const activeClass = country.id === selectedCountry.id ? " is-active" : "";

      return `
        <div class="probability-row${activeClass}">
          <span>${rank}. ${escapeHtml(country.name)}</span>
          <div class="probability-track">
            <span style="width: ${width}%"></span>
          </div>
          <strong>${formatProbability(country.probability)}</strong>
        </div>
      `;
    })
    .join("");
}

function renderAssignmentStep(person, country) {
  const groupMembers = getGroupMembers(country);
  const rivals = groupMembers.filter((member) => member.id !== country.id);
  const rank = getProbabilityRank(country.id);

  setGameStep("assignment");
  updateGameProgress();

  els.assignmentHero.innerHTML = `
    <article class="country-detail-card" style="--country-color: ${country.color}">
      <div class="country-hero-block">
        <div class="country-flag-frame">
          <img
            src="${flagUrl(country.flagCode, 160)}"
            alt="Bandera de ${escapeHtml(country.name)}"
            onerror="this.onerror=null;this.src='${fallbackFlag(country.flagCode, 160)}';"
          />
        </div>
        <div>
          <p class="section-label">Paso 3 · País asignado</p>
          <h2 id="assignmentTitle">${escapeHtml(country.name)}</h2>
          <p class="assignment-copy">
            ${escapeHtml(person.name)} recibe a ${escapeHtml(country.name)} para esta quiniela.
          </p>
        </div>
      </div>

      <div class="country-stats-grid">
        <div>
          <span>Mejor participación</span>
          <strong>${escapeHtml(country.bestParticipation)}</strong>
        </div>
        <div>
          <span>Probabilidad de campeón</span>
          <strong>${formatProbability(country.probability)}</strong>
        </div>
        <div>
          <span>Ranking de probabilidad</span>
          <strong>#${rank} de ${probabilityRanking.length}</strong>
        </div>
        <div>
          <span>Grupo</span>
          <strong>Grupo ${country.group}</strong>
        </div>
      </div>

      <section class="detail-section">
        <div class="detail-section-title">
          <p class="section-label">Grupo ${country.group}</p>
          <h3>Rivales de grupo</h3>
        </div>
        <div class="group-chip-list">
          ${groupMembers
            .map(
              (member) => `
                <span class="group-chip${member.id === country.id ? " is-current" : ""}">
                  <img src="${flagUrl(member.flagCode)}" alt="" onerror="this.onerror=null;this.src='${fallbackFlag(member.flagCode)}';" />
                  ${escapeHtml(member.name)}
                </span>
              `,
            )
            .join("")}
        </div>
        <p class="micro-copy">También comparte grupo con ${rivals.map((item) => item.name).join(", ")}.</p>
      </section>

      <section class="detail-section">
        <div class="detail-section-title">
          <p class="section-label">Probabilidades</p>
          <h3>Comparativo de campeón</h3>
        </div>
        <div class="probability-board">
          ${renderProbabilityBoard(country)}
        </div>
      </section>

      <section class="detail-section">
        <div class="detail-section-title">
          <p class="section-label">Figuras</p>
          <h3>Jugadores a seguir</h3>
        </div>
        <div class="players-grid">
          ${country.players.map((player, index) => renderPlayerCard(player, index, country)).join("")}
        </div>
      </section>

      <div class="source-strip">
        <a href="${DATA_SOURCES.groups.url}" target="_blank" rel="noreferrer">${DATA_SOURCES.groups.label}: ${DATA_SOURCES.groups.name}</a>
        <a href="${DATA_SOURCES.probability.url}" target="_blank" rel="noreferrer">${DATA_SOURCES.probability.label}: ${DATA_SOURCES.probability.name}</a>
        <a href="${DATA_SOURCES.history.url}" target="_blank" rel="noreferrer">${DATA_SOURCES.history.label}: ${DATA_SOURCES.history.name}</a>
      </div>
    </article>
  `;

  const shouldFinish = !getEligibleParticipants().length || !gameState.remainingCountryIds.length;
  els.nextTurnButton.textContent = shouldFinish ? "Ver resumen" : "Siguiente turno";
}

function continueGame() {
  gameState.selectedPersonId = null;
  gameState.selectedCountryId = null;

  if (!getEligibleParticipants().length || !gameState.remainingCountryIds.length) {
    renderSummaryStep();
    return;
  }

  renderPersonStep();
}

function renderCountryPill(countryId) {
  const country = countryById[countryId];

  return `
    <span class="assigned-country-pill">
      <img src="${flagUrl(country.flagCode)}" alt="" onerror="this.onerror=null;this.src='${fallbackFlag(country.flagCode)}';" />
      ${escapeHtml(country.name)}
    </span>
  `;
}

function renderSummaryStep() {
  setGameStep("summary");
  updateGameProgress();

  const peopleSummary = gameState.participants
    .map((person) => {
      const countries = person.assignedCountryIds.length
        ? person.assignedCountryIds.map(renderCountryPill).join("")
        : `<span class="empty-assignment">Sin país asignado</span>`;

      return `
        <article class="summary-card" style="--person-color: ${person.color}">
          <div class="summary-person">
            <strong>${escapeHtml(person.name)}</strong>
            <span>${person.assignedCountryIds.length}/${person.teams} equipos</span>
          </div>
          <div class="assigned-country-list">${countries}</div>
        </article>
      `;
    })
    .join("");

  const remainingCountries = gameState.remainingCountryIds.length
    ? `
      <article class="summary-card leftovers-card">
        <div class="summary-person">
          <strong>Países sin asignar</strong>
          <span>${gameState.remainingCountryIds.length} disponibles</span>
        </div>
        <div class="assigned-country-list">
          ${gameState.remainingCountryIds.map(renderCountryPill).join("")}
        </div>
      </article>
    `
    : "";

  els.summaryList.innerHTML = peopleSummary + remainingCountries;
}

document.querySelector("#openPersonDialog").addEventListener("click", openPersonDialog);
document.querySelector("#cancelPerson").addEventListener("click", closePersonDialog);
document.querySelector("#increaseTeams").addEventListener("click", () => stepTeamAmount(1));
document.querySelector("#decreaseTeams").addEventListener("click", () => stepTeamAmount(-1));
document.querySelector("#teamAmount").addEventListener("change", clampTeamAmount);
document.querySelector("#playButton").addEventListener("click", showValidation);
els.closeValidation.addEventListener("click", () => els.validationDialog.close());
els.startGameButton.addEventListener("click", startGame);
els.backToMenuButton.addEventListener("click", returnToMenu);
els.spinPersonButton.addEventListener("click", spinPerson);
els.spinCountryButton.addEventListener("click", spinCountry);
els.nextTurnButton.addEventListener("click", continueGame);
els.newGameButton.addEventListener("click", returnToMenu);
els.personForm.addEventListener("submit", addParticipant);

els.personDialog.addEventListener("click", (event) => {
  if (event.target === els.personDialog) {
    closePersonDialog();
  }
});

els.validationDialog.addEventListener("click", (event) => {
  if (event.target === els.validationDialog) {
    els.validationDialog.close();
  }
});

els.participantsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-person");

  if (!removeButton) {
    return;
  }

  const personIndex = participants.findIndex((person) => person.id === removeButton.dataset.personId);

  if (personIndex >= 0) {
    participants.splice(personIndex, 1);
    renderParticipants();
    updateSummary();
  }
});

els.potsGrid.addEventListener("change", (event) => {
  const target = event.target;

  if (target.classList.contains("pot-checkbox")) {
    const pot = POTS.find((item) => String(item.id) === target.dataset.potId);

    pot.countries.forEach((countryId) => {
      selectedCountries.set(countryId, target.checked);
      updateCountryCard(countryId);
    });
  }

  if (target.classList.contains("country-checkbox")) {
    selectedCountries.set(target.dataset.countryId, target.checked);
    updateCountryCard(target.dataset.countryId);
  }

  updatePotCheckboxes();
  updateSummary();
});

renderPots();
renderParticipants();
updateSummary();
