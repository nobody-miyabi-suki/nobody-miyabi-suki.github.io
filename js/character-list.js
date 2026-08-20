/**
 * Shared Character List Page
 * Handles loading, filtering, searching, and rendering character cards
 * Supports all four games via ?game= parameter and a game selector dropdown
 */

(function() {
    'use strict';

    // ----- Configuration -----
    const GAME_CONFIG = {
        genshin: {
            json: '/data/genshin-characters.json',
            title: 'Genshin Impact',
            subtitle: 'All playable characters in Teyvat',
            icon: '👤',
            detailPath: '/character.html?game=genshin&id=',
            filterCategories: {
                rarity: ['5-Star', '4-Star'],
                element: ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'],
                weapon: ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst']
            }
        },
        starrail: {
            json: '/data/starrail-characters.json',
            title: 'Honkai: Star Rail',
            subtitle: 'All playable characters across the cosmos',
            icon: '🚀',
            detailPath: '/character.html?game=starrail&id=',
            filterCategories: {
                rarity: ['5-Star', '4-Star'],
            }
        },
        zzz: {
            json: '/data/agents.json',
            title: 'Zenless Zone Zero',
            subtitle: 'All agents of New Eridu',
            icon: '🎯',
            detailPath: '/character.html?game=zzz&id=',
            filterCategories: {
                rarity: ['S-Rank', 'A-Rank'],
                role: ['Attack', 'Support', 'Stun', 'Anomaly', 'Defense'],
                element: ['Ice', 'Fire', 'Electric', 'Ether', 'Physical']
            }
        },
        honkai3rd: {
            json: '/data/honkai3rd-characters.json',
            title: 'Honkai Impact 3rd',
            subtitle: 'All Valkyries and their battlesuits',
            icon: '⚡',
            detailPath: '/character.html?game=honkai3rd&id=',
            filterCategories: {
                rarity: ['S-Rank', 'A-Rank'],
                type: ['Psychic', 'Mecha', 'Bio', 'Quantum', 'Imaginary']
            }
        }
    };

    // ----- Helper Functions -----
    function getStat(data, label) {
        if (!data.stats || !Array.isArray(data.stats)) return null;
        const found = data.stats.find(s => s.label === label);
        return found ? found.value : null;
    }

    function getCharacterAttribute(data, field, fallback) {
        if (data[field]) return data[field];
        const stat = getStat(data, field);
        if (stat) return stat;
        return fallback || '';
    }

    function normalizeRarity(data) {
        let rarity = getCharacterAttribute(data, 'Rarity', '');
        if (!rarity) return '?';
        if (rarity.includes('5')) return '5';
        if (rarity.includes('4')) return '4';
        if (rarity.includes('S')) return 'S';
        if (rarity.includes('A')) return 'A';
        return rarity;
    }

    // ----- DOM Elements -----
    const grid = document.getElementById('charactersGrid');
    const loading = document.getElementById('loadingMessage');
    const noResults = document.getElementById('noResults');
    const filterContainer = document.getElementById('filterButtons');
    const searchInput = document.getElementById('searchInput');
    const gameTitle = document.getElementById('gameTitle');
    const gameSubtitle = document.getElementById('gameSubtitle');
    const pageTitle = document.getElementById('pageTitle');
    const gameSelector = document.getElementById('gameSelector');

    // ----- State -----
    let currentGame = null;
    let allCharacters = [];
    let filteredCharacters = [];
    let activeFilters = new Set(['all']);

    // ----- URL Handling -----
    function getGameFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('game') || 'genshin';
    }

    function setGameSelector(gameKey) {
        if (gameSelector) {
            gameSelector.value = gameKey;
        }
    }

    // ----- Data Loading -----
    async function loadGameData(gameKey) {
        const config = GAME_CONFIG[gameKey];
        if (!config) {
            loading.textContent = '❌ Unknown game. Please specify ?game=genshin, starrail, zzz, or honkai3rd.';
            return;
        }
        currentGame = gameKey;

        // Update page title and header
        pageTitle.textContent = `${config.title} · Characters`;
        gameTitle.innerHTML = `${config.icon} <span>${config.title}</span> Characters`;
        gameSubtitle.textContent = config.subtitle;

        // Sync selector
        setGameSelector(gameKey);

        try {
            const response = await fetch(config.json);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // ✅ HIDE LOADING SPINNER
            loading.style.display = 'none';

            // Convert object to array with id
            allCharacters = Object.entries(data).map(([id, char]) => ({ id, ...char }));
            allCharacters.sort((a, b) => a.name.localeCompare(b.name));

            generateFilters();
            applyFilters();
        } catch (err) {
            console.error('Failed to load characters:', err);
            loading.textContent = '❌ Failed to load character data. Please try again later.';
            loading.style.color = 'var(--text-muted)';
        }
    }

    // ----- Filter Generation -----
    function generateFilters() {
        const config = GAME_CONFIG[currentGame];
        const filterSet = new Set(['all']);

        allCharacters.forEach(char => {
            const rarity = normalizeRarity(char);
            if (rarity !== '?') filterSet.add(rarity);

            const categories = config.filterCategories;
            for (const [cat, values] of Object.entries(categories)) {
                const charVal = getCharacterAttribute(char, cat);
                if (charVal) {
                    if (Array.isArray(charVal)) {
                        charVal.forEach(v => filterSet.add(v));
                    } else {
                        filterSet.add(charVal);
                    }
                }
            }

            if (char.stats) {
                char.stats.forEach(stat => {
                    const knownLabels = ['Rarity', 'Element', 'Weapon', 'Path', 'Role', 'Type'];
                    if (knownLabels.includes(stat.label)) {
                        filterSet.add(stat.value);
                    }
                });
            }
        });

        const sorted = ['all', ...Array.from(filterSet).filter(f => f !== 'all').sort()];
        filterContainer.innerHTML = '';

        sorted.forEach(filter => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (filter === 'all' ? ' active' : '');
            btn.dataset.filter = filter;
            btn.textContent = filter === 'all' ? 'All' : filter;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters = new Set([filter]);
                applyFilters();
            });
            filterContainer.appendChild(btn);
        });
    }

    // ----- Filter & Search -----
    function applyFilters() {
        const term = searchInput.value.toLowerCase().trim();

        filteredCharacters = allCharacters.filter(char => {
            let passesFilter = true;
            if (!activeFilters.has('all')) {
                const rarity = normalizeRarity(char);
                const matched = Array.from(activeFilters).some(filter => {
                    if (filter === rarity) return true;
                    const attr = getCharacterAttribute(char, filter);
                    if (attr && (Array.isArray(attr) ? attr.includes(filter) : attr === filter)) return true;
                    if (char.stats) {
                        return char.stats.some(s => s.value === filter);
                    }
                    return false;
                });
                passesFilter = matched;
            }

            let passesSearch = true;
            if (term) {
                const searchable = [
                    char.name,
                    getCharacterAttribute(char, 'faction', ''),
                    getCharacterAttribute(char, 'element', ''),
                    getCharacterAttribute(char, 'weapon', ''),
                    getCharacterAttribute(char, 'path', ''),
                    getCharacterAttribute(char, 'role', ''),
                    getCharacterAttribute(char, 'type', ''),
                    getCharacterAttribute(char, 'Rarity', '')
                ].join(' ').toLowerCase();
                passesSearch = searchable.includes(term);
            }

            return passesFilter && passesSearch;
        });

        renderGrid();
    }

    // ----- Rendering -----
    function renderGrid() {
        grid.innerHTML = '';
        if (filteredCharacters.length === 0) {
            noResults.style.display = 'block';
            return;
        }
        noResults.style.display = 'none';

        filteredCharacters.forEach(char => {
            const card = createCard(char);
            grid.appendChild(card);
        });
    }

    function createCard(char) {
        const card = document.createElement('div');
        card.className = 'character-card';

        // Image
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        const img = document.createElement('img');

        // Use flat path: /img/characters/[id].jpg
        img.src = `/img/characters/${char.id}.jpg`;
        img.alt = char.name;

        img.onerror = function() {
            this.style.display = 'none';
            const span = document.createElement('span');
            span.className = 'no-image';
            span.textContent = '❓';
            wrapper.appendChild(span);
        };
        wrapper.appendChild(img);
        card.appendChild(wrapper);

        // Rarity
        const rarity = normalizeRarity(char);
        const rarityLabel = getCharacterAttribute(char, 'Rarity', '');
        const rarityDiv = document.createElement('div');
        rarityDiv.className = 'rarity ' + (rarity === '5' || rarity === 'S' ? 'rarity-5' : 'rarity-4');
        rarityDiv.textContent = rarityLabel || rarity;
        card.appendChild(rarityDiv);

        // Name
        const name = document.createElement('h4');
        name.textContent = char.name || 'Unknown';
        card.appendChild(name);

        // Details
        const details = document.createElement('div');
        details.className = 'char-details';
        const elements = getCharacterAttribute(char, 'element', '');
        const weapon = getCharacterAttribute(char, 'weapon', '') || getCharacterAttribute(char, 'path', '') || getCharacterAttribute(char, 'role', '') || '';
        details.textContent = `${elements} ${weapon ? '· ' + weapon : ''}`;
        card.appendChild(details);

        // Faction
        const faction = getCharacterAttribute(char, 'faction', '');
        if (faction) {
            const tag = document.createElement('span');
            tag.className = 'faction-tag';
            tag.textContent = faction;
            card.appendChild(tag);
        }

        // View button
        const btn = document.createElement('a');
        btn.className = 'btn-char';
        const config = GAME_CONFIG[currentGame];
        btn.href = config.detailPath + char.id;
        btn.textContent = 'View Profile →';
        card.appendChild(btn);

        return card;
    }

    // ----- Event Listeners -----
    searchInput.addEventListener('input', applyFilters);

    if (gameSelector) {
        gameSelector.addEventListener('change', function() {
            const newGame = this.value;
            window.location.href = `/characters.html?game=${newGame}`;
        });
    }

    // ----- Init -----
    const initialGame = getGameFromURL();
    setGameSelector(initialGame);
    loadGameData(initialGame);

})();