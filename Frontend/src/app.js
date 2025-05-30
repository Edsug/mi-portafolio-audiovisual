// app.js - Portafolio profesional con Tailwind CSS

// Elementos del DOM
const fileList = document.getElementById('fileList');
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const cerrarLightbox = document.getElementById('cerrarLightbox');
const header = document.querySelector('header');

// Configuración de la API
const API_BASE = 'http://localhost:3000/api';

// Control de reacciones por usuario (usando localStorage para persistencia)
const USER_REACTIONS_KEY = 'user_reactions_portafolio';

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Iniciando aplicación...');
});

// Efecto de scroll para la barra de navegación
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.classList.add('shadow-lg', 'backdrop-blur-sm', 'bg-white/95');
    header.classList.remove('bg-white');
  } else {
    header.classList.remove('shadow-lg', 'backdrop-blur-sm', 'bg-white/95');
    header.classList.add('bg-white');
  }
});

// Obtener y mostrar sesiones profesionales
async function obtenerSesiones() {
  try {
    console.log('🔄 Cargando álbumes...');
    
    const res = await fetch(`${API_BASE}/sesiones`);
    const sesiones = await res.json();

    console.log('📊 Sesiones recibidas:', sesiones);

    // Limpiar contenedor
    fileList.innerHTML = '';
    
    // Ocultar estado de carga si existe
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.style.display = 'none';
    }

    if (!sesiones || sesiones.length === 0) {
      console.log('⚠️ No hay sesiones disponibles');
      fileList.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-3">No hay álbumes disponibles</h2>
          <p class="text-gray-600 mb-8 max-w-md">Crea tu primer álbum desde la sección de configuración para comenzar a mostrar tu trabajo.</p>
          <a href="configuracion.html" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Crear primer álbum
          </a>
        </div>
      `;
      return;
    }

    console.log(`✅ Procesando ${sesiones.length} sesiones...`);

    // Crear cada sesión con diseño profesional
    for (const sesion of sesiones) {
      await crearAlbumProfesional(sesion);
    }

    console.log('✅ Álbumes cargados correctamente');

  } catch (error) {
    console.error('❌ Error al obtener sesiones:', error);
    
    // Mostrar contenido de ejemplo para pruebas
    console.log('🔧 Mostrando contenido de ejemplo...');
    mostrarContenidoEjemplo();
  }
}

// Función para mostrar contenido de ejemplo cuando el servidor no está disponible
function mostrarContenidoEjemplo() {
  fileList.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-blue-800"><strong>Modo de prueba:</strong> El servidor no está disponible. Mostrando interfaz de ejemplo.</p>
      </div>
    </div>
    
    <!-- Álbum de ejemplo -->
    <section class="mb-16 animate-fade-in" data-sesion-id="ejemplo">
      <div class="text-center mb-10">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">Álbum de Ejemplo</h2>
        <p class="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">Este es un ejemplo de cómo se verían tus álbumes una vez que conectes el servidor.</p>
        
        <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-6">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            6 elementos
          </div>
        </div>

        <div class="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md border border-gray-100">
          <button class="like-btn text-2xl hover:scale-110 transition-transform duration-200 focus:outline-none">
            ❤️
          </button>
          <div class="text-center">
            <div class="text-lg font-bold text-red-600">24</div>
            <div class="text-xs text-gray-500 uppercase tracking-wide">likes</div>
          </div>
        </div>
      </div>

      <!-- Grid de imágenes de ejemplo -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <!-- Imagen 1 -->
        <div class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div class="relative aspect-square overflow-hidden cursor-pointer">
            <img 
              src="https://picsum.photos/id/1015/400/400" 
              alt="Ejemplo 1"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <svg class="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium text-gray-900 truncate mb-1">Paisaje montañoso</h3>
            <p class="text-sm text-gray-500">${new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        <!-- Imagen 2 -->
        <div class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div class="relative aspect-square overflow-hidden cursor-pointer">
            <img 
              src="https://picsum.photos/id/1025/400/400" 
              alt="Ejemplo 2"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <svg class="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium text-gray-900 truncate mb-1">Naturaleza urbana</h3>
            <p class="text-sm text-gray-500">${new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        <!-- Imagen 3 -->
        <div class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div class="relative aspect-square overflow-hidden cursor-pointer">
            <img 
              src="https://picsum.photos/id/1035/400/400" 
              alt="Ejemplo 3"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <svg class="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium text-gray-900 truncate mb-1">Arquitectura moderna</h3>
            <p class="text-sm text-gray-500">${new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        <!-- Video de ejemplo -->
        <div class="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div class="relative aspect-square overflow-hidden cursor-pointer bg-gray-100 flex items-center justify-center">
            <div class="text-center">
              <div class="bg-blue-600 rounded-full p-4 mx-auto mb-2">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p class="text-sm text-gray-600 font-medium">Video de ejemplo</p>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-medium text-gray-900 truncate mb-1">Timelapse urbano</h3>
            <p class="text-sm text-gray-500">${new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Instrucciones -->
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">¿Cómo conectar tu contenido?</h3>
      <p class="text-gray-600 mb-4">Para ver tus álbumes reales, asegúrate de que:</p>
      <ul class="text-left text-sm text-gray-600 max-w-md mx-auto space-y-2">
        <li class="flex items-center">
          <svg class="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          El servidor backend esté ejecutándose en puerto 3000
        </li>
        <li class="flex items-center">
          <svg class="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Hayas creado álbumes desde la configuración
        </li>
        <li class="flex items-center">
          <svg class="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Los archivos de imagen/video estén subidos
        </li>
      </ul>
    </div>
  `;
  
  // Ocultar estado de carga si existe
  const loadingState = document.getElementById('loadingState');
  if (loadingState) {
    loadingState.style.display = 'none';
  }
}

// Crear álbum con diseño profesional y limpio
async function crearAlbumProfesional(sesion) {
  try {
    // Obtener archivos específicos de esta sesión
    const resArchivos = await fetch(`${API_BASE}/sesiones/${sesion.id}`);
    const datosCompletos = await resArchivos.json();
    const archivos = datosCompletos.archivos || [];

    console.log(`📁 Archivos para álbum "${sesion.nombre}":`, archivos);

    // Contenedor principal del álbum - CENTRADO
    const albumSection = document.createElement('section');
    albumSection.className = 'mb-16 animate-fade-in max-w-6xl mx-auto';
    albumSection.setAttribute('data-sesion-id', sesion.id);

    // Verificar si el usuario ya reaccionó a este álbum
    const userReactions = getUserReactions();
    const hasReacted = userReactions.includes(sesion.id.toString());

    // Header del álbum - profesional y limpio (SIN contador de likes)
    const headerHTML = `
      <div class="text-center mb-10">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">${sesion.nombre}</h2>
        ${sesion.descripcion ? `<p class="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">${sesion.descripcion}</p>` : ''}
        
        <!-- Información del álbum -->
        <div class="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-6">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            ${new Date(sesion.fecha_creacion).toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            ${archivos.length} ${archivos.length === 1 ? 'elemento' : 'elementos'}
          </div>
        </div>

        <!-- Sistema de reacciones (SIN mostrar contador) -->
        <div class="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-md border border-gray-100">
          <button 
            data-like="${sesion.id}" 
            class="like-btn flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${hasReacted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'}"
            title="${hasReacted ? 'Quitar reacción' : 'Me gusta este álbum'}"
          >
            ${hasReacted ? '❤️' : '🤍'}
            <span class="text-sm font-medium">${hasReacted ? 'Te gusta' : 'Me gusta'}</span>
          </button>
        </div>
      </div>
    `;

    albumSection.innerHTML = headerHTML;

    if (archivos.length === 0) {
      // Estado vacío elegante
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center py-12';
      emptyState.innerHTML = `
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Álbum vacío</h3>
        <p class="text-gray-500">Agrega fotos o videos desde la configuración</p>
      `;
      albumSection.appendChild(emptyState);
    } else {
      // Grid de archivos profesional - CENTRADO
      const gridContainer = document.createElement('div');
      gridContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto';

      archivos.forEach((archivo, index) => {
        const card = crearTarjetaArchivo(archivo, index);
        gridContainer.appendChild(card);
      });

      albumSection.appendChild(gridContainer);
    }

    fileList.appendChild(albumSection);

  } catch (error) {
    console.error(`❌ Error al crear álbum ${sesion.nombre}:`, error);
  }
}

// Funciones para manejar reacciones de usuario
function getUserReactions() {
  try {
    const reactions = localStorage.getItem(USER_REACTIONS_KEY);
    return reactions ? JSON.parse(reactions) : [];
  } catch (error) {
    console.error('Error al obtener reacciones del usuario:', error);
    return [];
  }
}

function saveUserReaction(sesionId, hasReacted) {
  try {
    let reactions = getUserReactions();
    const sesionIdStr = sesionId.toString();
    
    if (hasReacted) {
      // Agregar reacción si no existe
      if (!reactions.includes(sesionIdStr)) {
        reactions.push(sesionIdStr);
      }
    } else {
      // Quitar reacción si existe
      reactions = reactions.filter(id => id !== sesionIdStr);
    }
    
    localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(reactions));
  } catch (error) {
    console.error('Error al guardar reacción del usuario:', error);
  }
}


// Crear tarjeta individual para cada archivo
function crearTarjetaArchivo(archivo, index) {
  const card = document.createElement('div');
  card.className = 'group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1';
  card.setAttribute('data-url', `${API_BASE.replace('/api', '')}/${archivo.ruta}`);
  card.setAttribute('data-nombre', archivo.nombre_archivo || archivo.nombre);
  card.style.animationDelay = `${index * 0.1}s`;

  const esImagen = archivo.tipo_archivo && archivo.tipo_archivo.startsWith('image/');
  const esVideo = archivo.tipo_archivo && archivo.tipo_archivo.startsWith('video/');

  let mediaContent = '';

  if (esImagen) {
    mediaContent = `
      <div class="relative aspect-square overflow-hidden cursor-pointer">
        <img 
          src="${API_BASE.replace('/api', '')}/${archivo.ruta}" 
          alt="${archivo.nombre_archivo || archivo.nombre}"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div class="bg-white/90 backdrop-blur-sm rounded-full p-3">
              <svg class="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (esVideo) {
    mediaContent = `
      <div class="relative aspect-square overflow-hidden cursor-pointer video-container">
        <video 
          class="w-full h-full object-cover"
          muted 
          preload="metadata"
          data-src="${API_BASE.replace('/api', '')}/${archivo.ruta}"
        >
          <source src="${API_BASE.replace('/api', '')}/${archivo.ruta}" type="${archivo.tipo_archivo}">
        </video>
        <div class="absolute inset-0 bg-black/30 flex items-center justify-center video-overlay">
          <div class="bg-white/90 backdrop-blur-sm rounded-full p-4 hover:bg-white transition-colors duration-200">
            <svg class="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
  } else {
    mediaContent = `
      <div class="aspect-square bg-gray-100 flex items-center justify-center">
        <div class="text-center">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-sm text-gray-500">Archivo</p>
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    ${mediaContent}
    <!-- Información del archivo -->
    <div class="p-4">
      <h3 class="font-medium text-gray-900 truncate mb-1">${archivo.nombre_archivo || archivo.nombre}</h3>
      <p class="text-sm text-gray-500">
        ${new Date(archivo.fecha_subida).toLocaleDateString('es-ES')}
      </p>
    </div>
  `;

  // Agregar event listener para videos
  if (esVideo) {
    const videoElement = card.querySelector('video');
    const overlay = card.querySelector('.video-overlay');
    
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (videoElement.paused) {
        videoElement.play();
        overlay.style.display = 'none';
      } else {
        videoElement.pause();
        overlay.style.display = 'flex';
      }
    });

    videoElement.addEventListener('ended', () => {
      overlay.style.display = 'flex';
    });
  }

  return card;
}

// Sistema de lightbox profesional
let currentIndex = 0;
let currentFiles = [];

// Abrir lightbox
document.addEventListener('click', function (e) {
  const target = e.target.closest('[data-url]');
  if (!target) return;

  // Si es un video, no abrir lightbox
  if (target.querySelector('video')) return;

  const url = target.getAttribute('data-url');
  const nombre = target.getAttribute('data-nombre') || 'Archivo';
  
  // Encontrar todos los elementos similares en la misma sesión
  const sesion = target.closest('[data-sesion-id]');
  const items = sesion.querySelectorAll('[data-url]');
  
  currentFiles = Array.from(items)
    .filter(item => !item.querySelector('video')) // Solo imágenes en lightbox
    .map(item => ({
      url: item.getAttribute('data-url'),
      nombre: item.getAttribute('data-nombre') || 'Archivo'
    }));
  
  // Encontrar el índice actual
  currentIndex = currentFiles.findIndex(item => item.url === url);

  if (currentIndex === -1) return;

  updateLightboxContent();
  
  // Mostrar lightbox
  lightbox.classList.remove('hidden');
  lightbox.classList.add('flex');
  setTimeout(() => {
    lightbox.classList.add('opacity-100');
  }, 10);
});

// Cerrar lightbox
cerrarLightbox.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

function closeLightbox() {
  lightbox.classList.remove('opacity-100');
  setTimeout(() => {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    lightboxContent.innerHTML = '';
  }, 300);
}

// Actualizar contenido del lightbox
function updateLightboxContent() {
  const item = currentFiles[currentIndex];
  if (!item) return;
  
  lightboxContent.innerHTML = `
    <div class="relative max-w-7xl max-h-full flex flex-col">
      <!-- Imagen principal -->
      <div class="flex-1 flex items-center justify-center p-4">
        <img 
          src="${item.url}" 
          alt="${item.nombre}"
          class="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
      
      <!-- Información y controles -->
      <div class="bg-black/80 backdrop-blur-sm text-white p-4 rounded-b-lg">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium">${item.nombre}</h3>
            <p class="text-sm text-gray-300">${currentIndex + 1} de ${currentFiles.length}</p>
          </div>
          
          <!-- Controles de navegación -->
          <div class="flex items-center gap-2">
            <button 
              id="prev-btn" 
              class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              ${currentIndex === 0 ? 'disabled' : ''}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            
            <button 
              id="next-btn" 
              class="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              ${currentIndex === currentFiles.length - 1 ? 'disabled' : ''}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Agregar eventos de navegación
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn && currentIndex > 0) {
    prevBtn.addEventListener('click', showPreviousItem);
  }
  
  if (nextBtn && currentIndex < currentFiles.length - 1) {
    nextBtn.addEventListener('click', showNextItem);
  }
}

// Navegación del lightbox
function showPreviousItem() {
  if (currentIndex > 0) {
    currentIndex--;
    updateLightboxContent();
  }
}

function showNextItem() {
  if (currentIndex < currentFiles.length - 1) {
    currentIndex++;
    updateLightboxContent();  
  }
}

// Navegación con teclado
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('hidden')) return;
  
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    showPreviousItem();
  } else if (e.key === 'ArrowRight') {
    showNextItem();
  }
});

// Sistema de reacciones de usuario (una vez por álbum)
document.addEventListener('click', async (e) => {
  if (e.target.matches('[data-like]') || e.target.closest('[data-like]')) {
    const boton = e.target.matches('[data-like]') ? e.target : e.target.closest('[data-like]');
    const sesionId = boton.getAttribute('data-like');
    
    if (boton.disabled) return;
    boton.disabled = true;
    
    try {
      // Verificar estado actual de la reacción
      const userReactions = getUserReactions();
      const hasReacted = userReactions.includes(sesionId.toString());
      const newReactionState = !hasReacted;
      
      // Hacer petición al servidor
      const endpoint = newReactionState ? 
        `${API_BASE}/like/${sesionId}` : 
        `${API_BASE}/likes/${sesionId}`;
      
      const method = newReactionState ? 'POST' : 'DELETE';
      
      const response = await fetch(endpoint, { 
        method: method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Guardar nueva reacción en localStorage
        saveUserReaction(sesionId, newReactionState);
        
        // Actualizar UI del botón
        updateReactionButton(boton, newReactionState);
        
        // Mostrar notificación
        const message = newReactionState ? '❤️ ¡Te gusta este álbum!' : '💔 Reacción eliminada';
        showNotification(message, 'success');
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error al procesar reacción:', error);
      showNotification('Error al procesar reacción', 'error');
    } finally {
      setTimeout(() => {
        boton.disabled = false;
      }, 1000);
    }
  }
});

// Actualizar la apariencia del botón de reacción
function updateReactionButton(boton, hasReacted) {
  const icon = boton.querySelector('span') ? boton.childNodes[0] : boton;
  const text = boton.querySelector('span');
  
  if (hasReacted) {
    boton.className = 'like-btn flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-red-100 text-red-600';
    if (typeof icon === 'string') {
      boton.textContent = '❤️';
    } else {
      icon.textContent = '❤️';
    }
    if (text) text.textContent = 'Te gusta';
    boton.title = 'Quitar reacción';
  } else {
    boton.className = 'like-btn flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500';
    if (typeof icon === 'string') {
      boton.textContent = '🤍';
    } else {
      icon.textContent = '🤍';
    }
    if (text) text.textContent = 'Me gusta';
    boton.title = 'Me gusta este álbum';
  }
  
  // Animación
  boton.classList.add('animate-pulse');
  setTimeout(() => boton.classList.remove('animate-pulse'), 500);
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-transform duration-300 ${colors[type]}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);
  
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Filtros
function filtrarContenido(tipo) {
  const sesiones = document.querySelectorAll('[data-sesion-id]');
  
  sesiones.forEach(sesion => {
    let mostrar = false;
    
    switch(tipo) {
      case 'todos':
        mostrar = true;
        break;
      case 'imagen':
        mostrar = sesion.querySelector('img') !== null;
        break;
      case 'video':
        mostrar = sesion.querySelector('video') !== null;
        break;
      case 'recientes':
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        const fechaCreacion = new Date(sesion.querySelector('h2').nextElementSibling?.textContent || '');
        mostrar = fechaCreacion >= fechaLimite;
        break;
    }
    
    sesion.style.display = mostrar ? 'block' : 'none';
  });
  
  // Actualizar botones activos
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-700');
  });
  
  document.querySelector(`[data-filter="${tipo}"]`)?.classList.remove('bg-gray-200', 'text-gray-700');
  document.querySelector(`[data-filter="${tipo}"]`)?.classList.add('bg-blue-600', 'text-white');
}

// Event listeners para filtros
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar la aplicación
  obtenerSesiones();
  
  // Configurar filtros
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tipo = e.target.getAttribute('data-filter');
      filtrarContenido(tipo);
    });
  });
});