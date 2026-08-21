/**
 * Shared Character List Page
 * Supports:
 * Genshin Impact
 * Honkai: Star Rail
 * Zenless Zone Zero
 * Honkai Impact 3rd
 *
 * URL:
 * /characters.html?game=genshin
 * /characters.html?game=genshin&filter=5-Star
 * /characters.html?game=zzz&filter=S-Rank
 */

(function() {
    'use strict';

    // ============================================================
    // GAME CONFIG
    // ============================================================

    const GAME_CONFIG = {
        genshin: {
            json: '/data/genshin-characters.json',
            title: 'Genshin Impact',
            subtitle: 'All playable characters in Teyvat',
            icon: '👤',
            detailPath: '/character.html?game=genshin&id=',
            filterCategories: [
                'Rarity',
                'Element',
                'Weapon'
            ]
        },

        starrail: {
            json: '/data/starrail-characters.json',
            title: 'Honkai: Star Rail',
            subtitle: 'All playable characters across the cosmos',
            icon: '🚀',
            detailPath: '/character.html?game=starrail&id=',
            filterCategories: [
                'Rarity',
                'Element',
                'Path'
            ]
        },

        zzz: {
            json: '/data/agents.json',
            title: 'Zenless Zone Zero',
            subtitle: 'All agents of New Eridu',
            icon: '🎯',
            detailPath: '/character.html?game=zzz&id=',
            filterCategories: [
                'Rarity',
                'Role',
                'Element'
            ]
        },

        honkai3rd: {
            json: '/data/honkai3rd-characters.json',
            title: 'Honkai Impact 3rd',
            subtitle: 'All Valkyries and their battlesuits',
            icon: '⚡',
            detailPath: '/character.html?game=honkai3rd&id=',
            filterCategories: [
                'Rarity',
                'Role',
                'Element',
                'Type'
            ]
        }
    };

    // ============================================================
    // DOM
    // ============================================================

    const grid = document.getElementById('charactersGrid');
    const loading = document.getElementById('loadingMessage');
    const noResults = document.getElementById('noResults');
    const filterContainer = document.getElementById('filterButtons');
    const searchInput = document.getElementById('searchInput');
    const gameTitle = document.getElementById('gameTitle');
    const gameSubtitle = document.getElementById('gameSubtitle');
    const pageTitle = document.getElementById('pageTitle');
    const gameSelector = document.getElementById('gameSelector');

    // ============================================================
    // STATE
    // ============================================================

    let currentGame = 'genshin';
    let allCharacters = [];
    let filteredCharacters = [];
    let activeFilter = 'all';

    // ============================================================
    // HELPERS
    // ============================================================

    function getStat(data, label) {
        if (!data || !Array.isArray(data.stats)) {
            return '';
        }

        const found = data.stats.find(function(stat) {
            return String(stat.label).toLowerCase() === String(label).toLowerCase();
        });

        return found ? String(found.value || '') : '';
    }

    function getCharacterAttribute(data, field) {
        if (!data) {
            return '';
        }

        // Direct field first
        if (data[field] !== undefined && data[field] !== null) {
            return String(data[field]);
        }

        // Then stats
        const statValue = getStat(data, field);

        if (statValue) {
            return statValue;
        }

        return '';
    }

    function normalizeRarity(data) {
        const rarity = getCharacterAttribute(data, 'Rarity');

        if (!rarity) {
            return '';
        }

        const value = rarity.toLowerCase();

        if (value.includes('5-star') || value.includes('5★') || value === '5') {
            return '5-Star';
        }

        if (value.includes('4-star') || value.includes('4★') || value === '4') {
            return '4-Star';
        }

        if (value.includes('s-rank') || value === 's') {
            return 'S-Rank';
        }

        if (value.includes('a-rank') || value === 'a') {
            return 'A-Rank';
        }

        return rarity;
    }

    function normalizeText(value) {
        return String(value || '')
            .trim()
            .toLowerCase();
    }

    function getSearchableText(char) {
        const values = [
            char.id,
            char.name,
            char.title,
            char.faction,
            char.element,
            char.weapon,
            char.path,
            char.role,
            char.type,
            normalizeRarity(char),
            getCharacterAttribute(char, 'Rarity'),
            char.description
        ];

        if (Array.isArray(char.stats)) {
            char.stats.forEach(function(stat) {
                values.push(stat.label);
                values.push(stat.value);
            });
        }

        return normalizeText(values.join(' '));
    }

    // ============================================================
    // URL
    // ============================================================

    function getURLParams() {
        const params = new URLSearchParams(window.location.search);

        return {
            game: params.get('game') || 'genshin',
            filter: params.get('filter') || 'all',
            search: params.get('search') || ''
        };
    }

    function updateURL(filter) {
        const params = new URLSearchParams(window.location.search);

        params.set('game', currentGame);

        if (filter && filter !== 'all') {
            params.set('filter', filter);
        } else {
            params.delete('filter');
        }

        const searchValue = searchInput ? searchInput.value.trim() : '';

        if (searchValue) {
            params.set('search', searchValue);
        } else {
            params.delete('search');
        }

        const newURL =
            window.location.pathname +
            '?' +
            params.toString();

        window.history.replaceState({}, '', newURL);
    }

    // ============================================================
    // GAME SELECTOR
    // ============================================================

    function setGameSelector(gameKey) {
        if (!gameSelector) {
            return;
        }

        gameSelector.value = gameKey;
    }

    // ============================================================
    // PAGE HEADER
    // ============================================================

    function updatePageHeader() {
        const config = GAME_CONFIG[currentGame];

        if (!config) {
            return;
        }

        if (pageTitle) {
            pageTitle.textContent = config.title + ' · Characters';
        }

        if (gameTitle) {
            gameTitle.innerHTML =
                config.icon +
                ' <span>' +
                config.title +
                '</span> Characters';
        }

        if (gameSubtitle) {
            gameSubtitle.textContent = config.subtitle;
        }

        const headerSub = document.getElementById('headerSub');

        if (headerSub) {
            headerSub.textContent = config.title + ' · Characters';
        }
    }

    // ============================================================
    // LOAD GAME
    // ============================================================

    async function loadGameData(gameKey, initialFilter, initialSearch) {
        const config = GAME_CONFIG[gameKey];

        if (!config) {
            if (loading) {
                loading.textContent =
                    '❌ Unknown game. Please use genshin, starrail, zzz, or honkai3rd.';
            }

            return;
        }

        currentGame = gameKey;

        setGameSelector(gameKey);
        updatePageHeader();

        if (searchInput) {
            searchInput.value = initialSearch || '';
        }

        activeFilter = initialFilter || 'all';

        try {
            const response = await fetch(config.json, {
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();

            allCharacters = Object.entries(data).map(function(entry) {
                const id = entry[0];
                const char = entry[1];

                return {
                    id: id,
                    ...char
                };
            });

            allCharacters.sort(function(a, b) {
                return String(a.name || '').localeCompare(
                    String(b.name || '')
                );
            });

            if (loading) {
                loading.style.display = 'none';
            }

            generateFilters();

            setActiveFilterButton(activeFilter);

            applyFilters();

        } catch (error) {
            console.error('Failed to load character data:', error);

            if (loading) {
                loading.textContent =
                    '❌ Failed to load character data. Please try again later.';

                loading.style.color = 'var(--text-muted)';
            }
        }
    }

    // ============================================================
    // FILTER GENERATION
    // ============================================================

    function generateFilters() {
        if (!filterContainer) {
            return;
        }

        const config = GAME_CONFIG[currentGame];

        const filterSet = new Set();

        filterSet.add('all');

        allCharacters.forEach(function(char) {
            config.filterCategories.forEach(function(category) {
                let value = '';

                if (category === 'Rarity') {
                    value = normalizeRarity(char);
                } else {
                    value = getCharacterAttribute(char, category);
                }

                if (value) {
                    filterSet.add(value);
                }
            });
        });

        // Put common filters first
        const priorityOrder = [
            '5-Star',
            '4-Star',
            'S-Rank',
            'A-Rank'
        ];

        const others = Array.from(filterSet)
            .filter(function(filter) {
                return filter !== 'all' &&
                    !priorityOrder.includes(filter);
            })
            .sort(function(a, b) {
                return String(a).localeCompare(String(b));
            });

        const sortedFilters = [
            'all',
            ...priorityOrder.filter(function(filter) {
                return filterSet.has(filter);
            }),
            ...others
        ];

        filterContainer.innerHTML = '';

        sortedFilters.forEach(function(filter) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className =
                'filter-btn' +
                (filter === activeFilter ? ' active' : '');

            button.dataset.filter = filter;

            if (filter === 'all') {
                button.textContent = 'All';
            } else {
                button.textContent = filter;
            }

            button.addEventListener('click', function() {
                activeFilter = filter;

                setActiveFilterButton(filter);
                updateURL(filter);
                applyFilters();
            });

            filterContainer.appendChild(button);
        });
    }

    // ============================================================
    // ACTIVE FILTER BUTTON
    // ============================================================

    function setActiveFilterButton(filter) {
        if (!filterContainer) {
            return;
        }

        const buttons = filterContainer.querySelectorAll('.filter-btn');

        let found = false;

        buttons.forEach(function(button) {
            const isActive =
                button.dataset.filter === filter;

            button.classList.toggle('active', isActive);

            if (isActive) {
                found = true;
            }
        });

        // If URL has a filter that doesn't exist,
        // fall back to All.
        if (!found) {
            activeFilter = 'all';

            buttons.forEach(function(button) {
                button.classList.toggle(
                    'active',
                    button.dataset.filter === 'all'
                );
            });
        }
    }

    // ============================================================
    // FILTER MATCHING
    // ============================================================

    function characterMatchesFilter(char, filter) {
        if (!filter || filter === 'all') {
            return true;
        }

        const normalizedFilter = normalizeText(filter);

        // Rarity
        const rarity = normalizeText(normalizeRarity(char));

        if (rarity === normalizedFilter) {
            return true;
        }

        // Common attributes
        const fields = [
            'element',
            'weapon',
            'path',
            'role',
            'type',
            'faction'
        ];

        for (const field of fields) {
            const value = normalizeText(
                getCharacterAttribute(char, field)
            );

            if (!value) {
                continue;
            }

            if (value === normalizedFilter) {
                return true;
            }

            // Handles values like:
            // "Sword User"
            // "The Hunt"
            // "Ice"
            // etc.
            if (value.includes(normalizedFilter)) {
                return true;
            }
        }

        // Stats
        if (Array.isArray(char.stats)) {
            for (const stat of char.stats) {
                const value = normalizeText(stat.value);

                if (
                    value === normalizedFilter ||
                    value.includes(normalizedFilter)
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    // ============================================================
    // APPLY FILTERS
    // ============================================================

    function applyFilters() {
        const searchTerm =
            searchInput ?
            normalizeText(searchInput.value) :
            '';

        filteredCharacters = allCharacters.filter(function(char) {
            const matchesFilter =
                characterMatchesFilter(
                    char,
                    activeFilter
                );

            let matchesSearch = true;

            if (searchTerm) {
                matchesSearch =
                    getSearchableText(char)
                        .includes(searchTerm);
            }

            return matchesFilter && matchesSearch;
        });

        renderGrid();
    }

    // ============================================================
    // RENDER GRID
    // ============================================================

    function renderGrid() {
        if (!grid) {
            return;
        }

        grid.innerHTML = '';

        if (filteredCharacters.length === 0) {
            if (noResults) {
                noResults.style.display = 'block';
            }

            return;
        }

        if (noResults) {
            noResults.style.display = 'none';
        }

        const fragment = document.createDocumentFragment();

        filteredCharacters.forEach(function(char) {
            fragment.appendChild(
                createCard(char)
            );
        });

        grid.appendChild(fragment);
    }

    // ============================================================
    // IMAGE PATH
    // ============================================================

    function getCharacterImagePath(char) {
        /*
         * All character list images are stored here:
         *
         * /img/characters/
         *
         * Example:
         * miyabi.jpg
         * qingyi.jpg
         * arlan.jpg
         * jingyuan.jpg
         * dan-heng.jpg
         */

        return '/img/characters/' + char.id + '.jpg';
    }

    // ============================================================
    // CREATE CARD
    // ============================================================

    function createCard(char) {
        const card = document.createElement('div');

        card.className = 'character-card';

        // --------------------------------------------------------
        // IMAGE
        // --------------------------------------------------------

        const wrapper = document.createElement('div');

        wrapper.className = 'image-wrapper';

        const img = document.createElement('img');

        img.src = getCharacterImagePath(char);

        img.alt = char.name || 'Character';

        img.loading = 'lazy';

        img.decoding = 'async';

        img.onerror = function() {
            this.style.display = 'none';

            if (
                !wrapper.querySelector('.no-image')
            ) {
                const span = document.createElement('span');

                span.className = 'no-image';

                span.textContent = '❓';

                wrapper.appendChild(span);
            }
        };

        wrapper.appendChild(img);

        card.appendChild(wrapper);

        // --------------------------------------------------------
        // RARITY
        // --------------------------------------------------------

        const rarity = normalizeRarity(char);

        const rarityLabel =
            getCharacterAttribute(char, 'Rarity') ||
            rarity ||
            '?';

        const rarityDiv =
            document.createElement('div');

        rarityDiv.className =
            'rarity ' +
            (
                rarity === '5-Star' ||
                rarity === 'S-Rank' ?
                'rarity-5' :
                'rarity-4'
            );

        rarityDiv.textContent = rarityLabel;

        card.appendChild(rarityDiv);

        // --------------------------------------------------------
        // NAME
        // --------------------------------------------------------

        const name =
            document.createElement('h4');

        name.textContent =
            char.name || 'Unknown';

        card.appendChild(name);

        // --------------------------------------------------------
        // DETAILS
        // --------------------------------------------------------

        const details =
            document.createElement('div');

        details.className =
            'char-details';

        const element =
            getCharacterAttribute(
                char,
                'element'
            );

        let secondary = '';

        if (currentGame === 'genshin') {
            secondary =
                getCharacterAttribute(
                    char,
                    'weapon'
                );
        }

        else if (currentGame === 'starrail') {
            secondary =
                getCharacterAttribute(
                    char,
                    'path'
                );
        }

        else if (currentGame === 'zzz') {
            secondary =
                getCharacterAttribute(
                    char,
                    'role'
                );
        }

        else if (currentGame === 'honkai3rd') {
            secondary =
                getCharacterAttribute(
                    char,
                    'type'
                );
        }

        if (element && secondary) {
            details.textContent =
                element +
                ' · ' +
                secondary;
        }

        else if (element) {
            details.textContent =
                element;
        }

        else if (secondary) {
            details.textContent =
                secondary;
        }

        card.appendChild(details);

        // --------------------------------------------------------
        // FACTION
        // --------------------------------------------------------

        const faction =
            getCharacterAttribute(
                char,
                'faction'
            );

        if (faction) {
            const tag =
                document.createElement('span');

            tag.className =
                'faction-tag';

            tag.textContent =
                faction;

            card.appendChild(tag);
        }

        // --------------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------------

        const description =
            char.description || '';

        if (description) {
            const desc =
                document.createElement('div');

            desc.className =
                'description';

            desc.textContent =
                description;

            card.appendChild(desc);
        }

        // --------------------------------------------------------
        // VIEW PROFILE
        // --------------------------------------------------------

        const btn =
            document.createElement('a');

        btn.className =
            'btn-char';

        btn.href =
            GAME_CONFIG[currentGame].detailPath +
            encodeURIComponent(char.id);

        btn.textContent =
            'View Profile →';

        card.appendChild(btn);

        return card;
    }

    // ============================================================
    // SEARCH
    // ============================================================

    if (searchInput) {
        searchInput.addEventListener(
            'input',
            function() {
                updateURL(activeFilter);
                applyFilters();
            }
        );
    }

    // ============================================================
    // GAME SELECTOR
    // ============================================================

    if (gameSelector) {
        gameSelector.addEventListener(
            'change',
            function() {
                const newGame =
                    this.value;

                window.location.href =
                    '/characters.html?game=' +
                    encodeURIComponent(newGame);
            }
        );
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    const initialParams =
        getURLParams();

    let initialGame =
        initialParams.game;

    if (!GAME_CONFIG[initialGame]) {
        initialGame = 'genshin';
    }

    let initialFilter =
        initialParams.filter ||
        'all';

    let initialSearch =
        initialParams.search ||
        '';

    setGameSelector(
        initialGame
    );

    loadGameData(
        initialGame,
        initialFilter,
        initialSearch
    );

})();