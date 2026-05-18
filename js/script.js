class TMDBApi {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    async fetchEndpoint(endpoint, extraParams = "") {
        try {
            const reponse = await fetch(`${this.baseUrl}/${endpoint}?api_key=${this.apiKey}&language=fr-FR${extraParams}`);
            if (!reponse.ok) throw new Error(`Erreur API: ${reponse.status}`);
            return await reponse.json();
        } catch (erreur) {
            console.error(erreur);
            return null;
        }
    }
}

class UI {
    constructor() {
        this.imgUrl = 'https://image.tmdb.org/t/p/w500';
        this.img = 'https://image.tmdb.org/t/p/original';
         this.replaceImage = './img/remplacement.png';
    }

    formaterDate(dateString) {
        if (!dateString) return "Date inconnue";
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }

    afficherCartes(donneesItems, containerSelector, limite = 4) {
        const grille = document.querySelector(containerSelector);
        if (!grille) return;

        grille.innerHTML = '';

        const items = limite === 0 ? donneesItems : donneesItems.slice(0, limite);

        items.forEach(item => {
            const titre = item.title || item.name;
            const date = this.formaterDate(item.release_date || item.first_air_date);
            const image = item.poster_path ? this.imgUrl + item.poster_path : this.replaceImage;
            const note = Math.round(item.vote_average * 10);
            const type = item.title ? 'movie' : 'tv';

            const article = document.createElement('article');
            article.classList.add('movie-card');
            article.innerHTML = `
            <a href="details.html?id=${item.id}&type=${type}" style="text-decoration: none; color: inherit;">
                <div class="banner" style="background-image: url('${image}'); background-size: cover; background-position: center;">
                    <div class="rating">${note}%</div>
                </div>
                <h3>${titre}</h3>
                <p class="date">${date}</p>
            </a>
            `;
            grille.appendChild(article);
        });
    }
}

class MovieApp {
    constructor(apiKey) {
        this.api = new TMDBApi(apiKey);
        this.ui = new UI();
        this.init();
    }

    init() {
        if (document.querySelector('.search-banner')) {
            this.initPageAccueil();
        } else if (document.getElementById('movie-content')) {
            this.initPageDetails();
        }
    }

    async initPageAccueil() {
        this.ecouterRecherche();

        const params = new URLSearchParams(window.location.search);
        const searchQuery = params.get('search');

        if (searchQuery) {
            document.getElementById('tendances').style.display = 'none';
            document.getElementById('films').style.display = 'none';
            document.getElementById('series').style.display = 'none';

            const main = document.querySelector('main');
            const resultSection = document.createElement('section');
            resultSection.classList.add('movie-section');
            resultSection.innerHTML = `
                <div class="section-header">
                    <h2>Résultats pour "${searchQuery}"</h2>
                </div>
                <div class="movie-grid" id="search-results"></div>
            `;
            main.appendChild(resultSection);

            const donnees = await this.api.fetchEndpoint('search/multi', `&query=${encodeURIComponent(searchQuery)}`);

            if (donnees && donnees.results) {
                const resultatsExacts = donnees.results.filter(item => {
                    const titre = item.title || item.name;
                    return titre && titre.toLowerCase() === searchQuery.toLowerCase();
                });

                if (resultatsExacts.length > 0) {
                    this.ui.afficherCartes(resultatsExacts, '#search-results', 0);
                } else {
                    document.getElementById('search-results').innerHTML = `<p style="grid-column: 1 / -1; font-size: 18px;">Aucun titre correspondant exactement à "<strong>${searchQuery}</strong>" n'a été trouvé.</p>`;
                }
            }
        } else {
            this.chargerSection('trending/movie/day', '#tendances .movie-grid');
            this.chargerSection('movie/popular', '#films .movie-grid');
            this.chargerSection('tv/popular', '#series .movie-grid');
            this.ecouterFiltres();
        }
    }

   

    async chargerSection(endpoint, containerSelector) {
        const donnees = await this.api.fetchEndpoint(endpoint);
        if (donnees && donnees.results) {
            this.ui.afficherCartes(donnees.results, containerSelector);
        }
    }

    ecouterFiltres() {
        this.assignerFiltre('#tendances', (index) => index === 0 ? 'trending/movie/day' : 'trending/movie/week');
        this.assignerFiltre('#films', (index) => index === 0 ? 'movie/popular' : 'movie/top_rated');
        this.assignerFiltre('#series', (index) => index === 0 ? 'tv/popular' : 'tv/top_rated');
    }

    assignerFiltre(sectionId, endpointBuilder) {
        const boutons = document.querySelectorAll(`${sectionId} .filter-btn`);
        boutons.forEach((bouton, index) => {
            bouton.addEventListener('click', () => {
                document.querySelector(`${sectionId} .filter-btn.active`).classList.remove('active');
                bouton.classList.add('active');

                const nouvelEndpoint = endpointBuilder(index);
                this.chargerSection(nouvelEndpoint, `${sectionId} .movie-grid`);
            });
        });
    }

    ecouterRecherche() {
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');

        const executerRecherche = () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            }
        };

        searchBtn.addEventListener('click', executerRecherche);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executerRecherche();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const monApp = new MovieApp('72c35ea3313374128a26f3528c1b14ec');
});