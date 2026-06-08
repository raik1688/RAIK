/**
 * RAIK PORTFOLIO PRESENTATION PLAYER LOGIC (LIVE TEXT REVISION)
 * - Auto-scaling PowerPoint stage (16:9 ratio preservation)
 * - Keyboard / Mouse wheel / Touch swipe slider navigation
 * - Autoplay Slideshow & Fullscreen API
 * - Auto-hiding HUD controls on idle
 * - Canvas-based tech particle network animation on Slide 9 (Thank You)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. State Variables
    let currentSlide = 0;
    const totalSlides = 9;
    let isTransitioning = false;
    const transitionDuration = 700;
    
    let autoplayActive = false;
    let autoplayInterval = null;
    const autoplayDelay = 5000;

    // 3. DOM Elements
    const slideWrapper = document.getElementById('slideWrapper');
    const slides = document.querySelectorAll('.slide');
    const currentSlideNum = document.getElementById('currentSlideNum');
    const dotBtns = document.querySelectorAll('.dot-btn');
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const playBtn = document.getElementById('playBtn');
    const playIcon = document.getElementById('playIcon');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    
    const hudHeader = document.querySelector('.hud-header');
    const hudControls = document.getElementById('hudControls');
    const navDots = document.getElementById('navDots');

    // 4. Auto-scaling 16:9 Stage Layout
    function resizeStage() {
        const stages = document.querySelectorAll('.slide-stage');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const baseWidth = 1280;
        const baseHeight = 714;
        
        // Calculate scale factor to fit either width or height
        const scaleX = windowWidth / baseWidth;
        const scaleY = windowHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        
        stages.forEach(stage => {
            stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
        });
    }

    window.addEventListener('resize', resizeStage);
    resizeStage(); // Run initially

    // Initialize slide active states
    slides[0].classList.add('active');

    // 5. Slide Glide Navigation Function
    function goToSlide(index) {
        if (isTransitioning) return;
        if (index < 0 || index >= totalSlides) return;
        if (index === currentSlide) return;

        isTransitioning = true;
        
        // Remove active class from previous slide
        slides[currentSlide].classList.remove('active');
        
        currentSlide = index;

        // Slide wrapper horizontal translate
        slideWrapper.style.transform = `translateX(-${currentSlide * 100}vw)`;

        // Add active class to new slide
        slides[currentSlide].classList.add('active');

        // Update Slide Count Indicator
        if (currentSlideNum) {
            currentSlideNum.textContent = currentSlide + 1;
        }

        // Update Navigation Dots
        dotBtns.forEach((dot, idx) => {
            if (idx === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Invert HUD Colors for Slide 9 (Deep Blue)
        if (currentSlide === 8) {
            document.body.classList.add('slide-9-active');
            initSlide9Canvas(); // Trigger particle canvas on entering Slide 9
        } else {
            document.body.classList.remove('slide-9-active');
            stopSlide9Canvas();
        }

        // Reset transition lock
        setTimeout(() => {
            isTransitioning = false;
        }, transitionDuration);
    }

    // Prev/Next handlers
    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        } else if (autoplayActive) {
            goToSlide(0); // Autoplay loops back to start
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }

    // Button controls
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Dot indicators clicks
    dotBtns.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.getAttribute('data-go-to')) - 1;
            goToSlide(slideIndex);
            
            // Deactivate autoplay on manual click
            if (autoplayActive) {
                toggleAutoplay();
            }
        });
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (['Space', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.code)) {
            e.preventDefault();
        }

        switch (e.code) {
            case 'ArrowRight':
            case 'ArrowDown':
            case 'PageDown':
            case 'Space':
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                prevSlide();
                break;
            case 'Home':
                goToSlide(0);
                break;
            case 'End':
                goToSlide(totalSlides - 1);
                break;
        }
    });

    // Mouse Wheel scroll (Debounced fullpage scroll)
    let lastScrollTime = 0;
    const scrollCooldown = 800;

    window.addEventListener('wheel', (e) => {
        const currentTime = new Date().getTime();
        if (currentTime - lastScrollTime < scrollCooldown) return;

        if (e.deltaY > 20) {
            nextSlide();
            lastScrollTime = currentTime;
        } else if (e.deltaY < -20) {
            prevSlide();
            lastScrollTime = currentTime;
        }
    }, { passive: true });

    // Touch Swipe Controls (Mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 50;

    window.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
            if (diffX < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }, { passive: true });

    // 6. Autoplay Slideshow
    function toggleAutoplay() {
        autoplayActive = !autoplayActive;
        
        if (autoplayActive) {
            playBtn.classList.add('autoplay-active');
            playIcon.setAttribute('data-lucide', 'pause');
            autoplayInterval = setInterval(nextSlide, autoplayDelay);
        } else {
            playBtn.classList.remove('autoplay-active');
            playIcon.setAttribute('data-lucide', 'play');
            clearInterval(autoplayInterval);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    if (playBtn) {
        playBtn.addEventListener('click', toggleAutoplay);
    }

    // 7. Fullscreen API Integration
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                fullscreenIcon.setAttribute('data-lucide', 'minimize');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }).catch(err => {
                console.error(`Error entering fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                fullscreenIcon.setAttribute('data-lucide', 'maximize');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        }
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenIcon.setAttribute('data-lucide', 'maximize');
            if (typeof lucide !== 'undefined') lucide.createIcons();
            document.body.classList.remove('fullscreen-hide-cursor');
        }
    });

    // 8. Auto-Hiding HUD Overlay on Mouse Idle
    let hudTimeout;
    const idleTime = 3000;

    function showHUD() {
        hudHeader.classList.remove('hud-fade-out');
        hudControls.classList.remove('hud-fade-out');
        navDots.classList.remove('hud-fade-out');
        document.body.classList.remove('fullscreen-hide-cursor');

        clearTimeout(hudTimeout);
        hudTimeout = setTimeout(hideHUD, idleTime);
    }

    function hideHUD() {
        // Do not hide HUD if hover over UI items
        if (document.querySelector('.hud-controls-panel:hover') || document.querySelector('.nav-dots:hover')) {
            return;
        }
        
        hudHeader.classList.add('hud-fade-out');
        hudControls.classList.add('hud-fade-out');
        navDots.classList.add('hud-fade-out');

        if (document.fullscreenElement) {
            document.body.classList.add('fullscreen-hide-cursor');
        }
    }

    window.addEventListener('mousemove', showHUD);
    window.addEventListener('mousedown', showHUD);
    window.addEventListener('keydown', showHUD);
    window.addEventListener('touchstart', showHUD);
    showHUD();

    // 9. Slide 9: Canvas Sci-Fi Particle Network Effect
    const canvas = document.getElementById('slide9Canvas');
    let ctx = null;
    let canvasAnimationId = null;
    let particles = [];
    const maxParticles = 45;

    function initSlide9Canvas() {
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        
        // Match canvas to slide stage actual dimensions
        const stage = canvas.closest('.slide-stage');
        canvas.width = stage.clientWidth;
        canvas.height = stage.clientHeight;
        
        particles = [];
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1
            });
        }
        
        if (canvasAnimationId) cancelAnimationFrame(canvasAnimationId);
        animateParticles();
    }

    function stopSlide9Canvas() {
        if (canvasAnimationId) {
            cancelAnimationFrame(canvasAnimationId);
            canvasAnimationId = null;
        }
    }

    function animateParticles() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw particle nodes
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off edges
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();
        });
        
        // Draw connection lines
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    const alpha = (1 - (dist / 120)) * 0.15;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        
        canvasAnimationId = requestAnimationFrame(animateParticles);
    }
});
