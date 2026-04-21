// ====== CONSTANTES PARA CLOUDINARY ======
const CLOUD_NAME = 'dz6lay5a6';
const TAG_NAME = 'JavierTania'; // <--- Cambia "galeria" por la etiqueta (tag) real que hayas asignado a los archivos en Cloudinary

// Función para cargar imágenes y videos desde Cloudinary
async function loadGalleryFromCloudinary() {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '<p class="text-center w-full text-slate-500 py-10 animate-pulse">Cargando momentos mágicos desde Cloudinary...</p>';

    // ============================================
    // 1. Obtener listado de Imágenes para la Galería (SOLO FOTOS)
    // Usamos el endpoint público List de Cloudinary para el tag.
    // IMPORTANTE: Requiere que en "Settings > Security > Restricted Media Types" la opción "Resource list" esté ACTIVADA.
    // ============================================
    try {
        const imgUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${TAG_NAME}.json`;
        const imgRes = await fetch(imgUrl);

        let images = [];
        if (imgRes.ok) {
            const imgData = await imgRes.json();
            images = imgData.resources || [];
        }

        galleryContainer.innerHTML = ''; // Limpiar contenedor temporal
        window.galleryImages = []; // Guardaremos las URLs para el lightbox swipable

        if (images.length === 0) {
            galleryContainer.innerHTML = `<p class="text-center w-full text-slate-500 py-10 px-4">No se encontraron fotos con el tag <strong>"${TAG_NAME}"</strong> o falta activar "Resource List" en la configuración de seguridad de Cloudinary.</p>`;
        } else {
            images.forEach((file, index) => {
                // Generar nombre amigable basado en public_id
                let displayName = file.public_id.split('/').pop() || 'Momento mágico';
                displayName = displayName.replace(/_/g, ' ');

                // Miniatura con recortes inteligentes usando h_400,c_fill para cargar súper rápido
                const thumbUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,h_400/${file.public_id}.${file.format}`;
                // Fullscreen
                const fullUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${file.public_id}.${file.format}`;

                window.galleryImages.push(fullUrl);

                const mediaElement = `
                    <div class="cursor-pointer" onclick="openLightbox(${index})">
                        <img class="w-full h-64 object-cover mb-4" src="${thumbUrl}" alt="Foto boda" loading="lazy" />
                    </div>`;

                const elementHTML = `
                    <div class="polaroid flex-none w-64 snap-center">
                        ${mediaElement}
                        <p class="hidden font-handwritten text-center text-slate-600 text-xl overflow-hidden text-ellipsis whitespace-nowrap px-2">${displayName}</p>
                    </div>
                `;

                galleryContainer.innerHTML += elementHTML;
            });

            // Inicializar el cajetín de foto aleatoria si se encontraron fotos
            initRandomPhotoBox();
        }
    } catch (error) {
        console.error('Error fetching images from Cloudinary:', error);
        galleryContainer.innerHTML = '<p class="text-center w-full text-red-500 py-10">Hubo un problema de conexión para descargar las fotos desde Cloudinary.</p>';
    }

    // ============================================
    // 2. Obtener listado de Videos para el Hero Video (LOOP)
    // ============================================
    try {
        const vidUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${TAG_NAME}.json`;
        const vidRes = await fetch(vidUrl);

        if (vidRes.ok) {
            const vidData = await vidRes.json();
            const videos = vidData.resources || [];

            if (videos.length > 0) {
                const heroVideoElement = document.getElementById('hero-video-bg');
                const fallbackElement = document.getElementById('hero-fallback-bg');

                if (heroVideoElement) {
                    // Usamos el primer video devuelto para el fondo
                    const heroVideo = videos[0];
                    // Formato .mp4 explícito, y q_auto:eco para garantizar un buen loop sin peso enorme
                    const videoSrc = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_auto:eco/${heroVideo.public_id}.mp4`;

                    heroVideoElement.src = videoSrc;
                    heroVideoElement.classList.remove('hidden');

                    heroVideoElement.addEventListener('playing', () => {
                        heroVideoElement.classList.remove('opacity-0');
                        if (fallbackElement) {
                            fallbackElement.style.opacity = '0';
                        }
                    });

                    // Iniciar reproducción (loop está directamente añadido en el index.html)
                    heroVideoElement.load();
                    heroVideoElement.play().catch(e => console.error("Error al iniciar autoplay del hero video:", e));
                }
            }
        }
    } catch (e) {
        console.error("No se pudo cargar videos de Cloudinary:", e);
    }
}

// Ejecutar cargar información cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadGalleryFromCloudinary();
    initCountdown();
    setupScrollFadeIn();
});

// Lógica de Foto Aleatoria (Cajetín debajo del Hero)
function initRandomPhotoBox() {
    const photoDisplay = document.getElementById('random-photo-display');
    if (!photoDisplay || !window.galleryImages || window.galleryImages.length === 0) return;

    // Cambiar la foto inmediatamente a la primera o a una random
    let currentIndex = Math.floor(Math.random() * window.galleryImages.length);
    photoDisplay.src = window.galleryImages[currentIndex];

    // Dar un tiempo muy corto para asegurar la carga y mostrarla
    setTimeout(() => {
        photoDisplay.classList.remove('opacity-0');
    }, 100);

    // Bucle para cambiar la foto cada segundo
    setInterval(() => {
        // En lugar de ocultar completamente y esperar, podemos elegir una nueva foto y cruzar
        photoDisplay.classList.add('opacity-0');

        setTimeout(() => {
            currentIndex = Math.floor(Math.random() * window.galleryImages.length);
            photoDisplay.src = window.galleryImages[currentIndex];
            photoDisplay.classList.remove('opacity-0');
        }, 800); // Casi al final de la transición de 1s para que sea suave

    }, 2500); // Rotar foto cada 2.5 seg (dado que la animación dura aprox 1s, nos da un buen overlap)
}

// Lógica para que los elementos aparezcan con Fade-In en Scroll
function setupScrollFadeIn() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('opacity-0', 'translate-y-8');
                entry.target.classList.add('opacity-100', 'translate-y-0');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar la sección de foto aleatoria
    const photoSection = document.getElementById('random-photo-section');
    if (photoSection) {
        photoSection.classList.add('transition-all', 'duration-1000');
        observer.observe(photoSection);
    }

    // Observar las nuevas tarjetas de regalo y dress code
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach(el => observer.observe(el));
}

// Lógica de Cuenta Regresiva
function initCountdown() {
    // Fecha objetivo: Viernes 17 de Abril, 2026 a las 19:00 HRS (Hora Local)
    const targetDate = new Date('June 27, 2026 18:00:00').getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

            const daysEl = document.getElementById('countdown-days');
            const hoursEl = document.getElementById('countdown-hours');
            const minutesEl = document.getElementById('countdown-minutes');

            if (daysEl) daysEl.innerText = days;
            if (hoursEl) hoursEl.innerText = hours;
            if (minutesEl) minutesEl.innerText = minutes;
        } else {
            // La fecha ha llegado
            const daysEl = document.getElementById('countdown-days');
            const hoursEl = document.getElementById('countdown-hours');
            const minutesEl = document.getElementById('countdown-minutes');

            if (daysEl) daysEl.innerText = '0';
            if (hoursEl) hoursEl.innerText = '0';
            if (minutesEl) minutesEl.innerText = '0';
        }
    };

    // Actualizar cada minuto ya que no mostramos segundos
    updateCountdown();
    setInterval(updateCountdown, 60000);
}

// Modales RSVP
function toggleModal() {
    const modal = document.getElementById('rsvpModal');
    if (modal) {
        modal.classList.toggle('hidden');
        modal.classList.toggle('flex');
    }
}

function sendToWhatsApp() {
    const nombre = document.getElementById('nombre')?.value;
    const asistentes = document.getElementById('asistentes')?.value;
    const alergias = document.getElementById('alergias')?.value || 'Ninguna';
    const ninos = document.getElementById('ninos')?.value;

    if (!nombre) {
        alert('Por favor, indica tu nombre o grupo familiar.');
        return;
    }

    const message = `¡Hola Andrea! Confirmamos nuestra asistencia a (Boda Thania&Javier).\n\nNombre/Grupo: ${nombre}\nTotal personas: ${asistentes}\nAlergias/Med: ${alergias}\nCantidad de niños: ${ninos}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/573016413373?text=${encodedMessage}`, '_blank');
    toggleModal();
}

// Lógica de Lightbox (Visor de imágenes grande con soporte Swipe)
window.currentLightboxIndex = 0;

function openLightbox(indexOrSrc) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img) return;

    if (typeof indexOrSrc === 'number' && window.galleryImages && window.galleryImages.length > 0) {
        window.currentLightboxIndex = indexOrSrc;
        img.src = window.galleryImages[indexOrSrc];
    } else if (typeof indexOrSrc === 'string') {
        img.src = indexOrSrc;
    } else {
        return;
    }

    lb.classList.remove('hidden');
    lb.classList.add('flex');
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) {
        lb.classList.add('hidden');
        lb.classList.remove('flex');
    }
}

function showNextImage() {
    if (!window.galleryImages || window.galleryImages.length === 0) return;
    window.currentLightboxIndex = (window.currentLightboxIndex + 1) % window.galleryImages.length;
    document.getElementById('lightbox-img').src = window.galleryImages[window.currentLightboxIndex];
}

function showPrevImage() {
    if (!window.galleryImages || window.galleryImages.length === 0) return;
    window.currentLightboxIndex = (window.currentLightboxIndex - 1 + window.galleryImages.length) % window.galleryImages.length;
    document.getElementById('lightbox-img').src = window.galleryImages[window.currentLightboxIndex];
}

// Configurar los eventos de clic, cerrar y deslizar (swipe) al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    // Cerrar si se da click fuera de la imagen
    lb.addEventListener('click', (e) => {
        if (e.target === lb) {
            closeLightbox();
        }
    });

    // Variables para el control del swipe táctil
    let touchStartX = 0;
    let touchEndX = 0;

    lb.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    lb.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50; // Mínimo de píxeles a desplazar para considerarlo un swipe
        if (touchEndX < touchStartX - swipeThreshold) {
            // Deslizamiento a la izquierda -> Siguiente imagen
            showNextImage();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Deslizamiento a la derecha -> Imagen anterior
            showPrevImage();
        }
    }
});

// ====== LÓGICA DE MÚSICA ======
document.addEventListener('DOMContentLoaded', () => {
    const musicBtn = document.getElementById('music-control');
    const audio = document.getElementById('wedding-music');
    const musicIcon = document.getElementById('music-icon');
    const musicText = document.getElementById('music-text');

    if (musicBtn && audio) {
        musicBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                musicText.innerText = "PAUSAR MÚSICA";
                musicIcon.innerText = "pause";
                musicIcon.classList.add('animate-pulse'); // Efecto visual opcional
            } else {
                audio.pause();
                musicText.innerText = "REPRODUCIR MÚSICA";
                musicIcon.innerText = "music_note";
                musicIcon.classList.remove('animate-pulse');
            }
        });
    }
});

// ====== LÓGICA DE DECORACIONES ======
async function loadSingleDecoration() {
    const CLOUD_NAME = 'dz6lay5a6';
    const DECOR_TAG = 'decora';
    const leafBg = document.querySelector('.leaf-bg');

    if (!leafBg) return;

    try {
        const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${DECOR_TAG}.json`);
        const data = await response.json();

        if (data.resources.length > 0) {
            // Tomamos la primera imagen que encuentre con esa etiqueta
            const asset = data.resources[0];
            const url = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/v${asset.version}/${asset.public_id}.${asset.format}`;

            const isMobile = window.innerWidth < 768;

            // Aplicamos los estilos de centrado total
            leafBg.style.backgroundImage = `url('${url}')`;
            leafBg.style.backgroundPosition = 'center';
            leafBg.style.backgroundRepeat = 'no-repeat';

            // En móvil ocupa el 90% del ancho, en escritorio un tamaño fijo elegante
            leafBg.style.backgroundSize = isMobile ? '90% auto' : '600px auto';
        }
    } catch (error) {
        console.error("Error cargando la decoración central:", error);
    }
}

// Asegúrate de llamarla
document.addEventListener('DOMContentLoaded', loadSingleDecoration);
