document.addEventListener('DOMContentLoaded', () => {
    const audioTrack = document.getElementById('app-audio');
    const canvas = document.getElementById('effectsCanvas');
    const ctx = canvas.getContext('2d');
    
    function fitCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    fitCanvas();
    window.addEventListener('resize', fitCanvas);

    let arrayParticles = [];
    let currentEffect = 'none';

    class VisualParticle {
        constructor(mode) {
            this.mode = mode;
            this.x = Math.random() * canvas.width;
            if (mode === 'hearts') {
                this.y = canvas.height + Math.random() * 80;
                this.speedY = -(Math.random() * 1.2 + 0.5);
                this.size = Math.random() * 10 + 6;
                this.wobbleSpeed = Math.random() * 0.02 + 0.01;
            } else if (mode === 'confetti') {
                this.y = -20 - Math.random() * 80;
                this.speedY = Math.random() * 3 + 2;
                this.speedX = Math.random() * 2 - 1;
                this.size = Math.random() * 6 + 4;
                this.color = `hsl(${Math.random() * 360}, 90%, 65%)`;
                this.rotation = Math.random() * 360;
                this.rotSpeed = Math.random() * 4 - 2;
            }
        }

        update() {
            if (this.mode === 'hearts') {
                this.y += this.speedY;
                this.x += Math.sin(this.y * this.wobbleSpeed) * 0.3;
                if (this.y < -20) this.regenerate();
            } else if (this.mode === 'confetti') {
                this.y += this.speedY;
                this.x += this.speedX;
                this.rotation += this.rotSpeed;
                if (this.y > canvas.height + 20) this.regenerate();
            }
        }

        regenerate() {
            this.x = Math.random() * canvas.width;
            this.y = (this.mode === 'hearts') ? canvas.height + 20 : -20;
        }

        draw() {
            if (this.mode === 'hearts') {
                ctx.fillStyle = 'rgba(255, 59, 112, 0.4)';
                ctx.beginPath();
                const topY = this.y - this.size / 2;
                ctx.moveTo(this.x, this.y);
                ctx.bezierCurveTo(this.x - this.size, topY, this.x - this.size, this.y + this.size / 2, this.x, this.y + this.size);
                ctx.bezierCurveTo(this.x + this.size, this.y + this.size / 2, this.x + this.size, topY, this.x, this.y);
                ctx.closePath();
                ctx.fill();
            } else if (this.mode === 'confetti') {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                ctx.restore();
            }
        }
    }

    function deployParticles(mode, quantity) {
        arrayParticles = [];
        currentEffect = mode;
        for (let i = 0; i < quantity; i++) {
            arrayParticles.push(new VisualParticle(mode));
        }
    }

    function loopGraphics() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (currentEffect !== 'none') {
            arrayParticles.forEach(p => { p.update(); p.draw(); });
        }
        requestAnimationFrame(loopGraphics);
    }
    loopGraphics();

    function transitionToScreen(originId, targetId, executionCallback = null) {
        const originElem = document.getElementById(originId);
        const targetElem = document.getElementById(targetId);
        originElem.classList.add('exit-animation');
        setTimeout(() => {
            originElem.classList.remove('active', 'exit-animation');
            targetElem.classList.add('active');
            if (executionCallback) executionCallback();
        }, 600);
    }

    // PANTALLA 1: Desbloqueo
    const gestureArea = document.getElementById('swipe-area');
    let touchBaseY = 0;

    gestureArea.addEventListener('touchstart', (e) => { touchBaseY = e.touches[0].clientY; }, {passive: true});
    gestureArea.addEventListener('touchend', (e) => {
        let touchReleaseY = e.changedTouches[0].clientY;
        if (touchBaseY - touchReleaseY > 50) { triggerUnlock(); }
    }, {passive: true});
    gestureArea.addEventListener('click', () => { triggerUnlock(); });

    function triggerUnlock() {
        audioTrack.play().catch(err => console.log("Audio en espera:", err));
        transitionToScreen('screen-1', 'screen-2', () => {
            animateScreen2Text();
        });
    }

    // PANTALLA 2: Animación narrativa inicial
    function animateScreen2Text() {
        const phrases = document.querySelectorAll('#screen-2 .story-phrase');
        const transitionButton = document.getElementById('btn-to-screen3');
        
        phrases.forEach((phrase, order) => {
            setTimeout(() => {
                phrase.style.opacity = '1';
                phrase.style.transform = 'translateY(0)';
                phrase.style.transition = 'all 800ms var(--md-easing-standard)';
            }, order * 1800);
        });

        setTimeout(() => {
            deployParticles('hearts', 15);
            transitionButton.classList.remove('hidden');
            transitionButton.style.opacity = '1';
        }, phrases.length * 1800 + 200);
    }

    document.getElementById('btn-to-screen3').addEventListener('click', () => {
        currentEffect = 'none';
        transitionToScreen('screen-2', 'screen-3', () => {
            launchAppCarousel();
        });
    });

    // PANTALLA 3: Lógica de Carrusel con Autotransición de Flujo Continuo
    let timelineInterval;
    let trackIndex = 0;
    const items = document.querySelectorAll('.carousel-slide');
    const timelines = document.querySelectorAll('.m3-stories-progress .bar');
    const transitionPeriod = 4200; 

    function launchAppCarousel() {
        trackIndex = 0;
        renderActiveTrack(0);
        
        timelineInterval = setInterval(() => {
            if (trackIndex < items.length - 1) {
                trackIndex++;
                renderActiveTrack(trackIndex);
                
                // Si llegamos al último paso (Foto 7)
                if (trackIndex === items.length - 1) {
                    clearInterval(timelineInterval); // Frenamos el bucle repetitivo
                    
                    // Esperamos exactamente a que se acabe el tiempo de lectura de la última foto y saltamos solos
                    setTimeout(() => {
                        autoTransitionToLetter();
                    }, transitionPeriod); 
                }
            }
        }, transitionPeriod);
    }

    function renderActiveTrack(targetIndex) {
        items.forEach((item, pointer) => {
            if (pointer === targetIndex) {
                item.classList.add('active');
                if (timelines[pointer]) {
                    timelines[pointer].style.transition = 'none';
                    timelines[pointer].style.width = '0%';
                    void timelines[pointer].offsetWidth; // Forzar lectura de reflow nativo para animar barra limpia
                    timelines[pointer].style.transition = `width ${transitionPeriod}ms linear`;
                    timelines[pointer].style.width = '100%';
                }
            } else {
                item.classList.remove('active');
                if (timelines[pointer]) {
                    timelines[pointer].style.transition = 'none';
                    timelines[pointer].style.width = pointer < targetIndex ? '100%' : '0%';
                }
            }
        });
    }

    function autoTransitionToLetter() {
        transitionToScreen('screen-3', 'screen-4', () => {
            // Le damos 4 segundos de lectura inicial a la carta antes de dejarla avanzar a la propuesta
            setTimeout(() => {
                const letterBtn = document.getElementById('btn-to-screen5');
                letterBtn.classList.remove('hidden');
                letterBtn.style.opacity = '1';
            }, 4000);
        });
    }

    // PANTALLA 4: Transición a la Propuesta
    document.getElementById('btn-to-screen5').addEventListener('click', () => {
        transitionToScreen('screen-4', 'screen-5', () => {
            deployParticles('hearts', 25);
        });
    });

    // PANTALLA 5: Lógica del Botón Esquivo y FormSubmit
    const noActionBtn = document.getElementById('btn-no');
    const yesActionBtn = document.getElementById('btn-yes');
    const labelYes = document.getElementById('label-yes');
    const proposalWrapper = document.getElementById('proposal-container');
    const successWrapper = document.getElementById('success-container');
    
    let counterRejections = 0;
    const arrayMessages = ["¿Segura?", "Piénsalo bien.", "Dale otra leída.", "Por favor.", "Última opción."];

    function evadePointer() {
        if (counterRejections < 5) {
            noActionBtn.style.position = 'absolute';
            const safetyMargin = 60;
            const limitX = window.innerWidth - noActionBtn.offsetWidth - safetyMargin;
            const limitY = window.innerHeight - noActionBtn.offsetHeight - safetyMargin;
            
            const coordinatesX = Math.max(safetyMargin, Math.floor(Math.random() * limitX));
            const coordinatesY = Math.max(safetyMargin, Math.floor(Math.random() * limitY));
            
            noActionBtn.style.left = `${coordinatesX}px`;
            noActionBtn.style.top = `${coordinatesY}px`;
            noActionBtn.querySelector('.m3-btn-label').innerText = arrayMessages[counterRejections];
            counterRejections++;
        }
    }

    noActionBtn.addEventListener('pointerdown', (event) => {
        if (counterRejections < 5) { event.preventDefault(); evadePointer(); }
    });

    yesActionBtn.addEventListener('click', () => {
        yesActionBtn.setAttribute('disabled', 'true');
        labelYes.innerText = "Enviando...";

        const formElement = document.getElementById('email-form');
        const formData = new FormData(formElement);

        // Envío asíncrono con AJAX directo a tu correo electrónico
        fetch("https://formsubmit.co/ajax/mejiamapura@gmail.com", {
            method: "POST",
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            deployParticles('confetti', 120);
            proposalWrapper.style.opacity = '0';
            proposalWrapper.style.transform = 'scale(0.96)';
            
            setTimeout(() => {
                proposalWrapper.classList.add('hidden');
                successWrapper.classList.remove('hidden');
                setTimeout(() => {
                    successWrapper.style.opacity = '1';
                    successWrapper.style.transform = 'scale(1)';
                }, 50);
            }, 350);
        })
        .catch(error => {
            console.error("Error de envío:", error);
            // Fallback de seguridad por si hay microcortes de red, ella avanza igual
            proposalWrapper.classList.add('hidden');
            successWrapper.classList.remove('hidden');
            successWrapper.style.opacity = '1';
        });
    });
});