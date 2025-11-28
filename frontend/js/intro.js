/**
 * Cinematic Intro Module
 * Epic animated intro sequence
 */

export function showCinematicIntro() {
    // Check if intro was already shown in this session
    if (sessionStorage.getItem('introShown')) {
        return;
    }

    const intro = document.createElement('div');
    intro.className = 'cinematic-intro';
    intro.id = 'cinematic-intro';

    intro.innerHTML = `
        <div class="cinematic-content">
            <!-- Stars background -->
            <div class="stars-layer stars-1"></div>
            <div class="stars-layer stars-2"></div>
            <div class="stars-layer stars-3"></div>

            <!-- Dragon silhouette -->
            <div class="dragon-silhouette"></div>

            <!-- Main title sequence -->
            <div class="title-sequence">
                <div class="title-line title-line-1">DUNGEONS</div>
                <div class="title-divider"></div>
                <div class="title-line title-line-2">& DRAGONS</div>
                <div class="title-subtitle">AI ROLEPLAY EXPERIENCE</div>
            </div>

            <!-- Particle effects -->
            <div class="magic-particles"></div>

            <!-- Skip button -->
            <button class="skip-intro-btn">Skip Intro</button>
        </div>
    `;

    document.body.appendChild(intro);

    // Create magic particles
    createMagicParticles();

    // Animate intro
    setTimeout(() => intro.classList.add('show'), 100);

    // Auto-hide after 6 seconds
    const hideIntro = () => {
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.remove();
            sessionStorage.setItem('introShown', 'true');
        }, 1000);
    };

    setTimeout(hideIntro, 6000);

    // Skip button
    intro.querySelector('.skip-intro-btn').addEventListener('click', hideIntro);
}

function createMagicParticles() {
    const container = document.querySelector('.magic-particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'magic-particle';

        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = Math.random() * 3 + 2;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
        `;

        container.appendChild(particle);
    }
}
