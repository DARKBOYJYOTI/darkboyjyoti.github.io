document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeSwitcherIcon = themeSwitcher.querySelector('i');
    const queryInputDesktop = document.getElementById('query-desktop');
    const queryInputMobile = document.getElementById('query-mobile');
    const fileTypeButton = document.getElementById('file-type-button');
    const engineButton = document.getElementById('engine-button');
    const searchForm = document.getElementById('search-form');
    const searchHistoryList = document.getElementById('search-history');
    const clearQueryButtonDesktop = document.getElementById('clear-query-desktop');
    const clearQueryButtonMobile = document.getElementById('clear-query-mobile');
    const clearHistoryButton = document.getElementById('clear-history');

    let currentFileType = '';
    let currentResType = '';
    let currentEngine = 'google';
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

    // Theme switcher
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        if (theme === 'dark') {
            themeSwitcherIcon.classList.remove('bi-sun-fill');
            themeSwitcherIcon.classList.add('bi-moon-stars-fill');
        } else {
            themeSwitcherIcon.classList.remove('bi-moon-stars-fill');
            themeSwitcherIcon.classList.add('bi-sun-fill');
        }
        localStorage.setItem('theme', theme);
    };

    themeSwitcher.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(systemPrefersDark ? 'dark' : 'light');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // File type selection
    document.getElementById('file-type-dropdown').addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target) {
            currentFileType = target.dataset.fileType;
            currentResType = target.dataset.resType;
            const icon = target.querySelector('i').outerHTML;
            fileTypeButton.innerHTML = `${icon} ${target.textContent}`;
        }
    });

    // Engine selection
    document.getElementById('engine-dropdown').addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target) {
            currentEngine = target.dataset.engine;
            engineButton.textContent = target.textContent;
        }
    });

    // Clear query
    clearQueryButtonDesktop.addEventListener('click', () => {
        queryInputDesktop.value = '';
        queryInputDesktop.focus();
    });

    clearQueryButtonMobile.addEventListener('click', () => {
        queryInputMobile.value = '';
        queryInputMobile.focus();
    });

    // Search history
    const renderSearchHistory = () => {
        searchHistoryList.innerHTML = '';
        if (searchHistory.length === 0) {
            const li = document.createElement('li');
            li.className = 'list-group-item text-muted';
            li.textContent = 'No recent searches.';
            searchHistoryList.appendChild(li);
            clearHistoryButton.disabled = true;
        } else {
            searchHistory.forEach(query => {
                const li = document.createElement('li');
                li.className = 'list-group-item list-group-item-action';
                li.textContent = query;
                li.addEventListener('click', () => {
                    queryInputDesktop.value = query;
                    queryInputMobile.value = query;
                    startSearch();
                });
                searchHistoryList.prepend(li);
            });
            clearHistoryButton.disabled = false;
        }
    };

    clearHistoryButton.addEventListener('click', () => {
        searchHistory = [];
        localStorage.removeItem('searchHistory');
        renderSearchHistory();
    });

    const addToSearchHistory = (query) => {
        if (query && !searchHistory.includes(query)) {
            searchHistory.push(query);
            if (searchHistory.length > 10) {
                searchHistory.shift();
            }
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            renderSearchHistory();
        }
    };

    renderSearchHistory();

    // Search
    const startSearch = () => {
        const query = window.innerWidth >= 768 ? queryInputDesktop.value.trim() : queryInputMobile.value.trim();
        if (!query) return;

        if (window.innerWidth >= 768) {
            queryInputDesktop.blur();
        } else {
            queryInputMobile.blur();
        }

        let finalQuery = query;
        if (currentFileType && currentFileType !== '-1') {
            finalQuery = `${query} +(${currentFileType})`;
        }

        finalQuery += ' -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml) intitle:index.of -inurl:(listen77|mp3raid|mp3toss|mp3drug|index_of|index-of|wallywashis|downloadmana)';

        let url;
        switch (currentEngine) {
            case 'bing':
                url = `https://www.bing.com/search?q=${encodeURIComponent(finalQuery)}`;
                break;
            case 'duckduckgo':
                url = `https://www.duckduckgo.com/?q=${encodeURIComponent(finalQuery)}`;
                break;
            case 'startpage':
                url = `https://www.startpage.com/do/dsearch?query=${encodeURIComponent(finalQuery)}`;
                break;
            case 'searx':
                url = `https://searx.me/?q=${encodeURIComponent(finalQuery)}`;
                break;
            default: // google
                url = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`;
        }

        setTimeout(() => {
            window.open(url, '_blank');
        }, 100);

        addToSearchHistory(query);
    };

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        startSearch();
    });
});
