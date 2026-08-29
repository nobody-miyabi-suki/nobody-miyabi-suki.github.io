/**
 * Shared Character Detail Page
 * Renders hero, features, bio, stats, skills, gallery
 */

(function() {
    'use strict';

    // ----- Helper Functions (same as list) -----
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

    // ----- DOM References -----
    const heroSection = document.getElementById('characterHero');
    const featuresSection = document.getElementById('featuresSection');
    const bioSection = document.getElementById('bioSection');
    const skillsSection = document.getElementById('skillsSection');
    const gallerySection = document.getElementById('gallerySection');

    // Hero elements
    const badge = document.getElementById('charBadge');
    const charName = document.getElementById('charName');
    const subTitle = document.getElementById('charSubTitle');
    const description = document.getElementById('charDescription');
    const charImage = document.getElementById('charImage');

    // Bio
    const bioName = document.getElementById('bioName');
    const bioSub = document.getElementById('bioSub');
    const bioContent = document.getElementById('bioContent');
    const bioStats = document.getElementById('bioStats');
    const bioImage = document.getElementById('bioImage');

    // Skills
    const skillsGrid = document.getElementById('skillsGrid');

    // Gallery
    const galleryGrid = document.getElementById('galleryGrid');

    // Page title
    const pageTitle = document.getElementById('detailPageTitle');
    const backLink = document.getElementById('backLink');

    // ----- Load Data -----
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            game: params.get('game') || 'genshin',
            id: params.get('id')
        };
    }

    const GAME_CONFIG = {
        genshin: { json: '/data/genshin-characters.json', name: 'Genshin Impact' },
        starrail: { json: '/data/starrail-characters.json', name: 'Honkai: Star Rail' },
        zzz: { json: '/data/agents.json', name: 'Zenless Zone Zero' },
        honkai3rd: { json: '/data/honkai3rd-characters.json', name: 'Honkai Impact 3rd' }
    };

    async function loadCharacter() {
        const { game, id } = getParams();
        if (!id) {
            document.getElementById('charDescription').textContent = '❌ No character specified.';
            return;
        }
        const config = GAME_CONFIG[game];
        if (!config) {
            document.getElementById('charDescription').textContent = '❌ Unknown game.';
            return;
        }

        backLink.href = `/character.html?game=${game}`;

        try {
            const response = await fetch(config.json);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const charData = data[id];
            if (!charData) {
                document.getElementById('charDescription').textContent = '❌ Character not found.';
                return;
            }
            renderHero(charData);
            renderFeatures(charData);
            renderBio(charData);
            renderSkills(charData);
            
            // ✅ اینجا دیگه charData رو به renderGallery نمیدیم، فقط id رو می‌گیره
            await renderGallery(charData);
            
            pageTitle.textContent = `${charData.name} · ${config.name}`;
        } catch (err) {
            console.error('Error loading character:', err);
            document.getElementById('charDescription').textContent = '❌ Failed to load character data.';
        }
    }

    // ----- Render Functions -----
    function renderHero(char) {
        const rarity = normalizeRarity(char);
        const faction = getCharacterAttribute(char, 'faction', '✦ Faction');
        badge.textContent = faction;
        charName.innerHTML = `${char.name} <span>${getCharacterAttribute(char, 'title', '')}</span>`;
        subTitle.textContent = getCharacterAttribute(char, 'bioSub', '');
        description.textContent = char.description || 'No description available.';

        const imgPath = `/img/characters/${getParams().id}.jpg`;
        charImage.src = imgPath;
        charImage.alt = char.name;
        charImage.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%231a0a0a%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 font-size=%2280%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23ff5e5e%22%3E❓%3C/text%3E%3C/svg%3E';
        };
    }

    function renderFeatures(char) {
        if (char.features && char.features.length > 0) {
            featuresSection.style.display = 'flex';
            featuresSection.innerHTML = '';
            char.features.forEach(f => {
                const card = document.createElement('div');
                card.className = 'feature-card';
                card.innerHTML = `
                    <span class="icon">${f.icon || '⭐'}</span>
                    <h3>${f.title || ''}</h3>
                    <p>${f.desc || ''}</p>
                `;
                featuresSection.appendChild(card);
            });
        } else {
            featuresSection.style.display = 'none';
        }
    }

    function renderBio(char) {
        if (char.bioContent && char.bioContent.length > 0) {
            bioSection.style.display = 'block';
            bioName.textContent = char.name;
            bioSub.textContent = getCharacterAttribute(char, 'bioSub', '');
            bioContent.innerHTML = char.bioContent.map(p => `<p>${p}</p>`).join('');

            bioStats.innerHTML = '';
            if (char.stats && char.stats.length > 0) {
                char.stats.forEach(stat => {
                    const item = document.createElement('div');
                    item.className = 'stat-item';
                    item.innerHTML = `
                        <div class="stat-label">${stat.label}</div>
                        <div class="stat-value">${stat.value}</div>
                    `;
                    bioStats.appendChild(item);
                });
            }

            const game = getParams().game;
            const gameFolder = game === 'genshin' ? 'genshin' :
                              game === 'starrail' ? 'starrail' :
                              game === 'zzz' ? 'zzz' : 'honkai3rd';
            bioImage.src = char.bioImage || `/img/${gameFolder}/characters/${getParams().id}-bio.jpg`;
            bioImage.alt = char.name;
            bioImage.onerror = function() {
                this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22350%22 height=%22350%22%3E%3Crect fill=%22%231a0a0a%22 width=%22350%22 height=%22350%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 font-size=%2270%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23ff5e5e%22%3E📖%3C/text%3E%3C/svg%3E';
            };
        } else {
            bioSection.style.display = 'none';
        }
    }

    function renderSkills(char) {
        if (char.skills && char.skills.length > 0) {
            skillsSection.style.display = 'block';
            skillsGrid.innerHTML = '';
            char.skills.forEach(skill => {
                const card = document.createElement('div');
                card.className = 'skill-card';
                card.innerHTML = `
                    <span class="skill-icon">${skill.icon || '⚔️'}</span>
                    <div class="skill-name">${skill.name || ''}</div>
                    <span class="skill-type">${skill.type || 'Ability'}</span>
                    <p>${skill.desc || ''}</p>
                `;
                skillsGrid.appendChild(card);
            });
        } else {
            skillsSection.style.display = 'none';
        }
    }

    // ============================================================
    // ✅ گالری با آدرس درست: /img/characters/
    // ============================================================
    async function renderGallery(char) {
        // ✅ کاملاً آرایه‌های JSON رو نادیده می‌گیریم و خودمون عکس‌ها رو پیدا می‌کنیم
        const images = await generateGalleryImages();

        if (!images || images.length === 0) {
            gallerySection.style.display = 'none';
            console.log('📷 No gallery images found.');
            return;
        }

        gallerySection.style.display = 'block';
        galleryGrid.innerHTML = '';

        images.forEach(src => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = src;
            img.alt = `${char.name} Gallery`;
            img.loading = 'lazy';

            img.onerror = function() {
                this.style.display = 'none';
                this.parentElement.textContent = '🖼️';
            };

            item.appendChild(img);
            galleryGrid.appendChild(item);
        });

        console.log(`📷 Gallery rendered with ${images.length} images.`);
    }

    /**
     * ✅ پیدا کردن خودکار عکس‌های گالری از پوشه‌ی /img/characters/
     * مثلاً: anby-gallery-1.jpg, anby-gallery-2.jpg, ...
     */
    async function generateGalleryImages() {
        const { id } = getParams();
        if (!id) {
            console.warn('⚠️ No character ID found');
            return [];
        }

        // ✅ آدرس درست: /img/characters/ (نه /img/zzz/)
        const basePath = `/img/characters/${id}-gallery-`;
        const foundImages = [];
        const MAX_IMAGES = 20;

        console.log(`🔍 Looking for gallery images: ${basePath}1.jpg, ${basePath}2.jpg, ...`);

        for (let i = 1; i <= MAX_IMAGES; i++) {
            const imagePath = `${basePath}${i}.jpg`;
            console.log(`🔍 Checking: ${imagePath}`);

            const exists = await imageExists(imagePath);

            if (!exists) {
                console.log(`❌ Not found: ${imagePath}, stopping...`);
                break;
            }

            console.log(`✅ Found: ${imagePath}`);
            foundImages.push(imagePath);
        }

        console.log(`🎯 Final gallery images (${foundImages.length} found):`, foundImages);
        return foundImages;
    }

    /**
     * ✅ چک کردن وجود فایل با fetch (مطمئن‌تر از Image)
     */
    async function imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.warn('⚠️ Fetch error for:', url, error);
            return false;
        }
    }
    // ============================================================

    // ----- Init -----
    loadCharacter();

})();