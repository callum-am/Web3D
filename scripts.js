//cookie helpers
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = name + "=" + value + ";expires=" + d.toUTCString() + ";path=/";
}
function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : "";
}

//theme
function applyMode(mode) {
    const body = document.body;
    const navbar = document.getElementById('mainNavbar');
    const modeIcon = document.getElementById('modeIcon');
    const modeText = document.getElementById('modeText');
    if (mode === 'dark') {
        body.classList.add('dark-mode');
        navbar.classList.remove('navbar-light', 'navbar-light-mode');
        navbar.classList.add('navbar-dark', 'navbar-dark-mode');
        modeIcon.className = 'bi bi-sun';
        modeText.textContent = 'Light Mode';
    } else {
        body.classList.remove('dark-mode');
        navbar.classList.remove('navbar-dark', 'navbar-dark-mode');
        navbar.classList.add('navbar-light', 'navbar-light-mode');
        modeIcon.className = 'bi bi-moon';
        modeText.textContent = 'Dark Mode';
    }
}

//homepage carousel
let galleryPanels = [];
let currentPanel = 0;
let autoInterval = null;

function renderGalleryCarousel() {
    const inner = document.getElementById('gallery-carousel-inner');
    if (!inner) return;
    inner.innerHTML = '';
    const total = galleryPanels.length;
    for (let i = 0; i < total; i++) {
        let panelClass = 'gallery-carousel-panel';
        if (i === currentPanel) panelClass += ' active';
        else if (i === (currentPanel - 1 + total) % total) panelClass += ' prev';
        else if (i === (currentPanel + 1) % total) panelClass += ' next';
        else panelClass += ' hidden';

        const panel = document.createElement('div');
        panel.className = panelClass;
        panel.style.backgroundImage = `url('${galleryPanels[i].image}')`;

        let modelParam = '';
        if (i === 0) modelParam = 'coke';
        else if (i === 1) modelParam = 'drpepper';
        else if (i === 2) modelParam = 'bottle';

        if (i === currentPanel) {
            panel.innerHTML = `
                <div class="gallery-carousel-overlay">
                    <h3>${galleryPanels[i].title}</h3>
                    <p>${galleryPanels[i].text}</p>
                    <a href="products.html?model=${modelParam}" class="btn btn-light btn-sm mt-2">${galleryPanels[i].button}</a>
                </div>
            `;
        }
        inner.appendChild(panel);
    }
}

function showPanel(idx) {
    currentPanel = (idx + galleryPanels.length) % galleryPanels.length;
    renderGalleryCarousel();
}

function nextPanel() {
    showPanel(currentPanel + 1);
}

function prevPanel() {
    showPanel(currentPanel - 1);
}

function startAutoGallery() {
    if (autoInterval) clearInterval(autoInterval);
    autoInterval = setInterval(nextPanel, 4000);
}

//load theme from cookie
document.addEventListener('DOMContentLoaded', function() {
    let mode = getCookie('theme');
    if (!mode) mode = 'light';
    applyMode(mode);

    document.getElementById('modeToggle').addEventListener('click', function() {
        let newMode = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyMode(newMode);
        setCookie('theme', newMode, 365);
    });

    //accordion logic
    const items = document.querySelectorAll('.accordion-horizontal-item');
    const headers = document.querySelectorAll('.accordion-horizontal-header');
    const contents = document.querySelectorAll('.accordion-horizontal-content');
    const previews = [
        document.getElementById('hacc-preview-1'),
        document.getElementById('hacc-preview-2'),
        document.getElementById('hacc-preview-3')
    ];
    function expandItem(idx) {
        items.forEach((item, i) => {
            if (i === idx) {
                item.classList.add('expanded');
                headers[i].classList.add('active');
                if (contents[i]) contents[i].style.display = 'block';
                if (previews[i]) previews[i].style.display = 'none';
            } else {
                item.classList.remove('expanded');
                headers[i].classList.remove('active');
                if (contents[i]) contents[i].style.display = 'none';
                if (previews[i]) previews[i].style.display = 'block';
            }
        });
    }
    headers.forEach((header, idx) => {
        header.addEventListener('click', () => expandItem(idx));
    });

    
    const params = new URLSearchParams(window.location.search);
    let model = params.get('model');
    if (model === 'drpepper') model = 'drpepper';
    if (model) {
        const btn = document.querySelector(`.accordion-horizontal-header[data-model="${model}"]`);
        if (btn) {
            btn.click();
        } else {
            expandItem(0);
        }
    } else {
        expandItem(0);
    }

    //fetch gallery panels from flask app
    fetch('gallery-panels')
        .then(res => res.json())
        .then(data => {
            galleryPanels = data;
            showPanel(0);
            startAutoGallery();
        });

    const nextBtn = document.getElementById('gallery-next');
    const prevBtn = document.getElementById('gallery-prev');
    if (nextBtn) {
        nextBtn.onclick = function() {
            nextPanel();
            startAutoGallery();
        };
    }
    if (prevBtn) {
        prevBtn.onclick = function() {
            prevPanel();
            startAutoGallery();
        };
    }
});
