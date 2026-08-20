document.addEventListener("DOMContentLoaded",async function() {

    const grid = document.getElementById("charactersGrid");
    const noResults = document.getElementById("noResults");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const title = document.getElementById("charactersTitle");

    if(!grid) {
        return;
    }

    let characters = {};

    try {

        const response = await fetch(
            "/data/honkai3rd/characters.json"
        );

        if(!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        characters = await response.json();

    } catch(error) {

        console.error(
            "Failed to load Honkai Impact 3rd characters:",
            error
        );

        grid.innerHTML = `
            <div class="data-error">
                <strong>Failed to load characters.</strong>
                <br>
                Please check characters.json.
            </div>
        `;

        return;
    }

    const characterList =
        Object.entries(characters);

    function createCard(id,character) {

        const card =
            document.createElement("article");

        card.className = "character-card";

        card.dataset.id = id;
        card.dataset.rank =
            character.rank || "";

        card.dataset.type =
            character.type || "";

        card.dataset.faction =
            character.faction || "";

        const rankLabel =
            character.rank === "srank"
                ? "★ S-Rank"
                : "★ A-Rank";

        const rankClass =
            character.rank === "srank"
                ? "rank-s"
                : "rank-a";

        card.innerHTML = `
            <span class="rank ${rankClass}">
                ${rankLabel}
            </span>

            <div class="char-img-wrapper">

                ${
                    character.image
                    ?
                    `
                    <img
                        src="${character.image}"
                        alt="${character.name}"
                        loading="lazy"
                    >
                    `
                    :
                    `
                    <div class="placeholder-icon">
                        ⚡
                    </div>
                    `
                }

            </div>

            <div class="char-name">
                ${character.name}
            </div>

            <div class="char-info">

                <span class="tag">
                    ${character.role || "⚔️ Valkyrie"}
                </span>

                <span class="tag">
                    ${character.element || "✨ Unknown"}
                </span>

            </div>

            <span class="char-faction">
                ${character.faction || "🏛️ Unknown"}
            </span>

            <div class="char-desc">
                ${character.description || ""}
            </div>

            <a
                href="/honkai3rd/character.html?id=${encodeURIComponent(id)}"
                class="btn-char"
            >
                View Profile →
            </a>
        `;

        const image =
            card.querySelector("img");

        if(image) {

            image.addEventListener(
                "error",
                function() {

                    image.style.display = "none";

                    const wrapper =
                        image.parentElement;

                    wrapper.innerHTML = `
                        <div class="placeholder-icon">
                            ⚡
                        </div>
                    `;

                }
            );

        }

        return card;
    }

    function renderCharacters(list) {

        grid.innerHTML = "";

        list.forEach(function([id,character]) {

            grid.appendChild(
                createCard(id,character)
            );

        });

        const hasCharacters =
            list.length > 0;

        noResults.classList.toggle(
            "visible",
            !hasCharacters
        );

        grid.style.display =
            hasCharacters
                ? "grid"
                : "none";
    }

    function matchesFilter(
        character,
        filter
    ) {

        if(filter === "all") {
            return true;
        }

        if(
            filter === "srank" ||
            filter === "arank"
        ) {
            return character.rank === filter;
        }

        return character.type === filter;
    }

    function applyFilter(filter) {

        const filtered =
            characterList.filter(
                function([,character]) {

                    return matchesFilter(
                        character,
                        filter
                    );

                }
            );

        renderCharacters(
            filtered
        );

        updateTitle(filter);
    }

    function updateTitle(filter) {

        const titles = {

            all:
                "🌟 All Valkyries",

            srank:
                "🌟 S-Rank Valkyries",

            arank:
                "⭐ A-Rank Valkyries",

            psychic:
                "🔮 Psychic Valkyries",

            mecha:
                "🤖 Mecha Valkyries",

            bio:
                "🧬 Bio Valkyries",

            quantum:
                "🌀 Quantum Valkyries",

            imaginary:
                "🌌 Imaginary Valkyries"

        };

        title.textContent =
            titles[filter] ||
            "🌟 Valkyries";
    }

    filterButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    filterButtons.forEach(
                        function(btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    applyFilter(
                        button.dataset.filter
                    );

                }
            );

        }
    );

    renderCharacters(
        characterList
    );

});