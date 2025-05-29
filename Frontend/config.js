document.addEventListener('DOMContentLoaded', () => {
  // —— Elementos del DOM ——  
  const loginSection       = document.getElementById('loginSection');
  const configSection      = document.getElementById('configSection');
  const loginBtn           = document.getElementById('loginBtn');
  const usernameInput      = document.getElementById('usernameInput');
  const passwordInput      = document.getElementById('passwordInput');
  const loginError         = document.getElementById('loginError');
  const statusBadge        = document.getElementById('statusBadge');
  const userDisplay        = document.getElementById('userDisplay');

  const navTabs            = document.querySelectorAll('.nav-tab');
  const configTabs         = document.querySelectorAll('.config-tab');

  const uploadForm         = document.getElementById('uploadForm');
  const fileInput          = document.getElementById('fileInput');
  const selectedFiles      = document.getElementById('selectedFiles');

  const sortableAlbums     = document.getElementById('sortableAlbums');
  const noAlbumSelected    = document.getElementById('noAlbumSelected');
  const albumContent       = document.getElementById('albumContent');
  const addMoreFiles       = document.getElementById('addMoreFiles');

  const usersList          = document.getElementById('usersList');
  const changePasswordBtn  = document.getElementById('changePasswordBtn');
  const addUserBtn         = document.getElementById('addUserBtn');

  const confirmModal       = document.getElementById('confirmModal');
  const modalTitle         = document.getElementById('modalTitle');
  const modalMessage       = document.getElementById('modalMessage');
  const cancelAction       = document.getElementById('cancelAction');
  const confirmAction      = document.getElementById('confirmAction');

  // Elementos del modal de cambio de contraseña
  const changeUserPasswordModal = document.getElementById('changeUserPasswordModal');
  const targetUserName     = document.getElementById('targetUserName');
  const adminNewPassword   = document.getElementById('adminNewPassword');
  const adminConfirmPassword = document.getElementById('adminConfirmPassword');
  const cancelChangePassword = document.getElementById('cancelChangePassword');
  const confirmChangePassword = document.getElementById('confirmChangePassword');

  // —— Estado global con permisos ——  
  let currentUser = null;
  let currentSelectedAlbum = null;
  let isEditingAlbum = false;
  let sortableInstance = null;
  let targetUserId = null; // Para el cambio de contraseña de otros usuarios

  // —— Funciones de permisos ——
  function isAdmin() {
    return currentUser && currentUser.role === 'admin';
  }

  function isEditor() {
    return currentUser && currentUser.role === 'editor';
  }

  function canEditAlbums() {
    return isAdmin();
  }

  function canDeleteAlbums() {
    return isAdmin();
  }

  function canManageUsers() {
    return isAdmin();
  }

  function getAuthHeaders() {
    if (!currentUser) return {};
    return {
      'user-role': currentUser.role,
      'user-id': currentUser.id.toString()
    };
  }

  // —— Utilerías mejoradas ——
  function showModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmModal.classList.remove('hidden');
    cancelAction.onclick = () => confirmModal.classList.add('hidden');
    confirmAction.onclick = () => { confirmModal.classList.add('hidden'); onConfirm && onConfirm(); };
  }

  function showNotification(msg, type = 'success') {
    const nt = document.createElement('div');
    nt.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl z-50 transition-all transform translate-y-0 ${type==='success'?'bg-gradient-to-r from-green-500 to-green-600':'bg-gradient-to-r from-red-500 to-red-600'} text-white`;
    nt.innerHTML = `
      <div class="flex items-center gap-3">
        <i class="fas ${type==='success'?'fa-check-circle':'fa-exclamation-triangle'} text-lg"></i>
        <span class="font-medium">${msg}</span>
      </div>
    `;
    document.body.appendChild(nt);
    setTimeout(() => {
      nt.style.opacity = '0';
      nt.style.transform = 'translateY(-100%)';
      setTimeout(() => nt.remove(), 300);
    }, 4000);
  }

  function showLoadingSpinner(element) {
    element.innerHTML = `
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600 font-medium">Cargando...</span>
      </div>
    `;
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'});
  }

  function isImageFile(tipoArchivo) {
    return tipoArchivo && tipoArchivo.startsWith('image/');
  }

  function isVideoFile(tipoArchivo) {
    return tipoArchivo && tipoArchivo.startsWith('video/');
  }

  function getFileUrl(ruta) {
    if (!ruta) return '';
    let cleanPath = ruta.replace(/\\/g, '/');
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    if (!cleanPath.startsWith('uploads/')) {
      cleanPath = 'uploads/' + cleanPath.replace(/^.*uploads\//, '');
    }
    return `http://localhost:3000/${cleanPath}`;
  }

  // —— Login mejorado ——
  loginBtn.addEventListener('click', async () => {
    const usuario = usernameInput.value.trim();
    const contrasena = passwordInput.value;
    
    if (!usuario || !contrasena) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando sesión...';
    
    try {
      const res = await fetch('http://localhost:3000/api/usuarios/login', {
        method: 'POST', 
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ usuario, contrasena })
      });
      
      const data = await res.json();
      
      if (data.acceso) {
        currentUser = data;
        loginSection.classList.add('hidden');
        configSection.classList.remove('hidden');
        statusBadge.classList.remove('hidden');
        
        // Mostrar información del usuario con su rol
        userDisplay.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="font-medium">${data.usuario}</span>
            <span class="px-2 py-1 text-xs rounded-full ${isAdmin() ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
              ${isAdmin() ? 'Admin' : 'Editor'}
            </span>
          </div>
        `;
        userDisplay.classList.remove('hidden');
        
        showNotification(`¡Bienvenido, ${data.usuario}!`);
        
        // Configurar permisos en la interfaz
        setupPermissions();
        
        // Cargar datos iniciales
        navTabs[0].querySelector('button').click();
        loadUsers();
        loadSessions();
      } else {
        loginError.classList.remove('hidden');
        setTimeout(()=>loginError.classList.add('hidden'),3000);
      }
    } catch (err) {
      console.error(err);
      showNotification('Error conectando con el servidor','error');
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión';
    }
  });

  // —— Configurar permisos en la interfaz ——
  function setupPermissions() {
    // Mostrar/ocultar pestaña de usuarios según permisos
    const usersTab = document.querySelector('[data-target="users-section"]');
    if (usersTab) {
      if (!canManageUsers()) {
        usersTab.style.display = 'none';
      }
    }
    
    // Agregar badge de rol al status
    statusBadge.innerHTML = `
      <i class="fas fa-circle text-xs mr-1"></i>
      ${isAdmin() ? 'Administrador' : 'Editor'}
    `;
    statusBadge.className = `px-3 py-1 text-xs font-semibold rounded-full text-white ${
      isAdmin() ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
    }`;
  }

  // —— Navegación de pestañas ——
  navTabs.forEach(tab => tab.addEventListener('click', () => {
    navTabs.forEach(t => {
      const btn = t.querySelector('button');
      btn.classList.remove('text-blue-600', 'border-blue-600', 'bg-blue-50');
      btn.classList.add('text-gray-600', 'border-transparent');
    });
    const btn = tab.querySelector('button');
    btn.classList.remove('text-gray-600', 'border-transparent');
    btn.classList.add('text-blue-600', 'border-blue-600', 'bg-blue-50');
    
    configTabs.forEach(c=>c.classList.add('hidden'));
    const target = tab.dataset.target;
    document.getElementById(target).classList.remove('hidden');
    
    if (target==='albums-section') {
      loadSessions();
      currentSelectedAlbum = null;
      noAlbumSelected.classList.remove('hidden');
      albumContent.classList.add('hidden');
    }
  }));

  // —— Vista previa archivos mejorada ——
  fileInput.addEventListener('change', () => {
    selectedFiles.innerHTML = '';
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) return;
    
    files.forEach(f => {
      const div = document.createElement('div');
      div.className = 'flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200';
      div.innerHTML = `
        <div class="flex-shrink-0">
          <i class="${f.type.startsWith('image/') ? 'fas fa-image text-blue-600' : 'fas fa-video text-purple-600'} text-lg"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-800 truncate">${f.name}</p>
          <p class="text-xs text-gray-500">${(f.size / 1024 / 1024).toFixed(1)} MB • ${f.type.startsWith('image/') ? 'Imagen' : 'Video'}</p>
        </div>
        <div class="flex-shrink-0">
          <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            ✓ Listo
          </span>
        </div>
      `;
      selectedFiles.appendChild(div);
    });
  });

  // —— Crear Álbum con mejor UX ——
  uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    console.log('🚀 === INICIO CREACIÓN DE ÁLBUM ===');
    
    const files = fileInput.files;
    const nombre = e.target.sesion.value.trim();
    const descripcion = e.target.descripcion.value.trim();
    
    if (files.length === 0) {
      showNotification('Selecciona al menos un archivo','error');
      return;
    }
    if (!nombre) {
      showNotification('El nombre del álbum es requerido','error');
      return;
    }
    
    // Mostrar progreso
    const submitBtn = uploadForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando álbum...';
    
    try {
      // 1. Crear sesión
      const res1 = await fetch('http://localhost:3000/api/sesiones', {
        method:'POST', 
        headers: {
          'Content-Type':'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ nombre, descripcion })
      });
      
      if (!res1.ok) {
        throw new Error(`Error creando sesión: ${res1.status} ${res1.statusText}`);
      }
      
      const sesion = await res1.json();
      console.log('✅ Sesión creada:', sesion);
      
      // 2. Subir archivos con progreso
      submitBtn.innerHTML = '<i class="fas fa-upload fa-spin mr-2"></i>Subiendo archivos...';
      
      let uploadedCount = 0;
      let duplicatedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const fd = new FormData();
          fd.append('archivo', file);
          fd.append('sesion_id', sesion.id);
          
          const uploadRes = await fetch('http://localhost:3000/api/files/subir', { 
            method: 'POST', 
            body: fd 
          });
          
          if (!uploadRes.ok) {
            errorCount++;
            continue;
          }
          
          const uploadData = await uploadRes.json();
          
          if (uploadData.duplicated) {
            duplicatedCount++;
          } else {
            uploadedCount++;
          }
          
          // Actualizar progreso
          submitBtn.innerHTML = `<i class="fas fa-upload fa-spin mr-2"></i>Subiendo ${i + 1}/${files.length}...`;
          
        } catch (fileError) {
          console.error(`❌ Error procesando archivo ${file.name}:`, fileError);
          errorCount++;
        }
      }
      
      // Mostrar resultado
      let message = `Álbum "${nombre}" creado`;
      if (uploadedCount > 0) message += ` con ${uploadedCount} archivo(s)`;
      if (duplicatedCount > 0) message += ` (${duplicatedCount} duplicado(s) omitido(s))`;
      
      showNotification(message, errorCount > 0 ? 'error' : 'success');
      
      uploadForm.reset(); 
      selectedFiles.innerHTML='';
      
      // Cambiar a pestaña de gestión
      navTabs[1].querySelector('button').click();
      
    } catch(err) {
      console.error('❌ Error general:', err);
      showNotification('Error creando álbum: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  // —— Cargar sesiones ——
  async function loadSessions() {
    try {
      if (sortableInstance) {
        sortableInstance.destroy();
      }
      
      const res = await fetch('http://localhost:3000/api/sesiones', {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
      }
      
      const sessions = await res.json();
      sortableAlbums.innerHTML='';
      
      if (!sessions || sessions.length === 0) {
        sortableAlbums.innerHTML = `
          <div class="text-center p-12 text-gray-500">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-images text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-700 mb-2">No hay álbumes</h3>
            <p class="text-sm text-gray-500">Crea tu primer álbum en la pestaña "Subir Álbum"</p>
          </div>
        `;
        return;
      }
      
      sessions.forEach(s => {
        const li = document.createElement('li');
        li.className = 'album-item p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer';
        li.dataset.id = s.id;
        
        li.innerHTML = `
          <div class="flex justify-between items-center">
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-gray-800 mb-1 truncate">${s.nombre}</h4>
              <p class="text-sm text-gray-500 mb-3 line-clamp-2">${s.descripcion || 'Sin descripción'}</p>
              <div class="flex items-center gap-4 text-xs text-gray-400">
                <span class="flex items-center">
                  <i class="fas fa-calendar mr-1"></i>${formatDate(s.fecha_creacion)}
                </span>
                <span class="flex items-center">
                  <i class="fas fa-images mr-1"></i>${s.archivo_count || 0} archivo(s)
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3 ml-4">
              <span class="flex items-center text-red-500 font-medium">
                <i class="fas fa-heart mr-1"></i>${s.likes || 0}
              </span>
              <div class="drag-handle w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-move flex items-center justify-center transition-colors" title="Arrastra para reordenar">
                <i class="fas fa-grip-vertical text-gray-500 text-sm"></i>
              </div>
            </div>
          </div>
        `;
        
        li.addEventListener('click', (e) => {
          if (!e.target.closest('.drag-handle')) {
            selectAlbum(s.id, li);
          }
        });
        
        sortableAlbums.appendChild(li);
      });
      
      // Crear sortable
      sortableInstance = Sortable.create(sortableAlbums, { 
        handle: '.drag-handle',
        animation: 150,
        onEnd: async () => {
          const order = Array.from(sortableAlbums.children).map(li => li.dataset.id);
          try {
            await fetch('http://localhost:3000/api/sesiones/reordenar', {
              method: 'POST', 
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify({ orden: order })
            });
            showNotification('Orden actualizado');
          } catch(err) {
            console.error(err);
            showNotification('Error reordenando álbumes', 'error');
          }
        }
      });
      
    } catch(err) {
      console.error('❌ Error en loadSessions:', err);
      showNotification('Error cargando sesiones: ' + err.message, 'error');
    }
  }

  // —— Seleccionar álbum ——
  async function selectAlbum(albumId, albumElement = null) {
    try {
      sortableAlbums.querySelectorAll('.album-item').forEach(li => {
        li.classList.remove('selected-album', 'ring-2', 'ring-blue-500');
      });
      
      if (albumElement) {
        albumElement.classList.add('selected-album', 'ring-2', 'ring-blue-500');
      }

      noAlbumSelected.classList.add('hidden');
      albumContent.classList.remove('hidden');
      showLoadingSpinner(albumContent);

      const res = await fetch(`http://localhost:3000/api/sesiones/${albumId}`, {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) throw new Error('Error al cargar álbum');
      
      const album = await res.json();
      currentSelectedAlbum = album;
      renderAlbumDetails(album);
      
    } catch(err) {
      console.error(err);
      showNotification('Error cargando álbum', 'error');
      noAlbumSelected.classList.remove('hidden');
      albumContent.classList.add('hidden');
    }
  }

  // —— Renderizar detalles del álbum con permisos ——
  function renderAlbumDetails(album) {
    const albumGrid = createAlbumGrid(album.archivos);
    
    // Botones de acción según permisos
    let actionButtons = '';
    if (canEditAlbums()) {
      actionButtons = isEditingAlbum ? `
        <button onclick="saveAlbumChanges()" class="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors" title="Guardar cambios">
          <i class="fas fa-save text-lg"></i>
        </button>
        <button onclick="cancelEditAlbum()" class="text-gray-600 hover:bg-gray-50 p-2 rounded-full transition-colors" title="Cancelar">
          <i class="fas fa-times text-lg"></i>
        </button>
      ` : `
        <button onclick="editAlbum()" class="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors" title="Editar álbum">
          <i class="fas fa-edit text-lg"></i>
        </button>
      `;
      
      if (canDeleteAlbums()) {
        actionButtons += `
          <button onclick="deleteAlbum()" class="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors" title="Eliminar álbum">
            <i class="fas fa-trash text-lg"></i>
          </button>
        `;
      }
    }
    
    albumContent.innerHTML = `
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1 min-w-0">
          ${isEditingAlbum && canEditAlbums() ? `
            <input type="text" id="editAlbumTitle" 
                   value="${album.nombre}" 
                   class="text-2xl font-bold bg-white border-2 border-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-700 mb-3 w-full">
            <textarea id="editAlbumDescription" 
                      placeholder="Descripción del álbum" 
                      class="text-gray-600 bg-white border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 w-full resize-none"
                      rows="3">${album.descripcion || ''}</textarea>
          ` : `
            <h3 class="text-2xl font-bold text-gray-800 mb-2">${album.nombre}</h3>
            <p class="text-gray-600 mb-3">${album.descripcion || 'Sin descripción'}</p>
          `}
          
          <div class="flex flex-wrap gap-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <i class="fas fa-calendar-alt mr-1"></i>
              ${formatDate(album.fecha_creacion)}
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <i class="fas fa-images mr-1"></i>
              ${album.archivos.length} archivo(s)
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <i class="fas fa-heart mr-1"></i>
              ${album.likes} like(s)
            </span>
          </div>
        </div>
        
        <div class="flex items-center gap-2 ml-4">
          ${actionButtons}
        </div>
      </div>

      <div class="border-t border-gray-200 pt-6">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-lg font-semibold text-gray-800">
            <i class="fas fa-images mr-2 text-blue-600"></i>
            Archivos del álbum
          </h4>
          <label for="addMoreFiles" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105">
            <i class="fas fa-plus text-sm"></i>
            Añadir archivos
          </label>
          <input type="file" id="addMoreFiles" multiple accept="image/*,video/*" class="hidden" />
        </div>
        
        ${album.archivos.length > 0 ? albumGrid : `
          <div class="text-center p-12 border-2 border-dashed border-gray-300 rounded-xl">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-images text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-700 mb-2">No hay archivos</h3>
            <p class="text-sm text-gray-500">Añade archivos usando el botón de arriba</p>
          </div>
        `}
      </div>
    `;
    
    attachFileUploadListener();
  }

  // —— Crear grid simplificado ——
  function createAlbumGrid(archivos) {
    if (!archivos || archivos.length === 0) return '';
    
    let gridHTML = '<div id="albumGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">';
    
    archivos.forEach(archivo => {
      const fileUrl = getFileUrl(archivo.ruta);
      const fileName = archivo.nombre_archivo || 'Archivo';
      
      // Botones de acción según permisos
      let fileActions = `
        <button onclick="event.stopPropagation(); viewFile('${fileUrl}', '${archivo.tipo_archivo}', '${fileName}')" 
                class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors transform hover:scale-110" 
                title="Ver archivo">
          <i class="fas ${isVideoFile(archivo.tipo_archivo) ? 'fa-play' : 'fa-eye'}"></i>
        </button>
      `;
      
      if (canDeleteAlbums()) {
        fileActions += `
          <button onclick="event.stopPropagation(); deleteFile(${archivo.id})" 
                  class="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors transform hover:scale-110" 
                  title="Eliminar archivo">
            <i class="fas fa-trash"></i>
          </button>
        `;
      }
      
      let content = '';
      if (isImageFile(archivo.tipo_archivo)) {
        content = `
          <div class="aspect-square bg-gray-200 rounded-lg overflow-hidden">
            <img src="${fileUrl}" 
                 alt="${fileName}" 
                 class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                 onclick="viewFile('${fileUrl}', '${archivo.tipo_archivo}', '${fileName}')"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo='; this.parentElement.classList.add('bg-gray-300'); this.parentElement.innerHTML='<div class=&quot;w-full h-full flex items-center justify-center text-gray-500&quot;><i class=&quot;fas fa-image text-2xl&quot;></i></div>'">
          </div>
        `;
      } else if (isVideoFile(archivo.tipo_archivo)) {
        content = `
          <div class="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:from-gray-700 hover:to-gray-800 transition-colors"
               onclick="viewFile('${fileUrl}', '${archivo.tipo_archivo}', '${fileName}')">
            <i class="fas fa-play-circle text-5xl text-white opacity-90"></i>
          </div>
        `;
      } else {
        content = `
          <div class="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-file text-2xl text-gray-400"></i>
          </div>
        `;
      }
      
      gridHTML += `
        <div class="file-item group relative" data-file-id="${archivo.id}">
          ${content}
          
          <!-- Overlay de acciones -->
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
            <div class="flex gap-2">
              ${fileActions}
            </div>
          </div>
          
          <!-- Info del archivo -->
          <div class="mt-2">
            <p class="text-xs text-gray-600 truncate font-medium" title="${fileName}">${fileName}</p>
          </div>
        </div>
      `;
    });
    
    gridHTML += '</div>';
    return gridHTML;
  }

  // —— Visor de archivos ——
  window.viewFile = function(fileUrl, fileType, fileName = '') {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4';
    modal.id = 'mediaViewer';
    
    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = 'auto';
    };
    
    document.body.style.overflow = 'hidden';
    
    let content = '';
    if (isImageFile(fileType)) {
      content = `
        <div class="relative max-w-full max-h-full">
          <img src="${fileUrl}" 
               alt="${fileName}" 
               class="max-w-full max-h-full object-contain rounded-lg shadow-2xl">
        </div>
      `;
    } else if (isVideoFile(fileType)) {
      content = `
        <div class="relative max-w-full max-h-full">
          <video controls 
                 class="max-w-full max-h-full rounded-lg shadow-2xl"
                 style="max-height: 80vh;">
            <source src="${fileUrl}" type="${fileType}">
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      `;
    } else {
      content = `
        <div class="text-center text-white">
          <i class="fas fa-file text-6xl mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">Archivo no soportado</h3>
          <p class="text-gray-300">${fileName}</p>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div class="relative w-full h-full flex items-center justify-center">
        ${content}
        <button onclick="closeMediaViewer()" 
                class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75 transition-colors">
          <i class="fas fa-times text-xl"></i>
        </button>
        <div class="absolute bottom-4 left-4 right-4 text-center">
          <div class="bg-black bg-opacity-60 text-white p-4 rounded-lg inline-block">
            <h3 class="font-semibold">${fileName}</h3>
            <p class="text-sm text-gray-300">Haz clic fuera para cerrar • Esc para salir</p>
          </div>
        </div>
      </div>
    `;
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    document.body.appendChild(modal);
  };

  window.closeMediaViewer = function() {
    const modal = document.getElementById('mediaViewer');
    if (modal) {
      modal.remove();
      document.body.style.overflow = 'auto';
    }
  };

  // —— Funciones de álbum con permisos ——
  window.editAlbum = function() {
    if (!canEditAlbums()) {
      showNotification('No tienes permisos para editar álbumes', 'error');
      return;
    }
    isEditingAlbum = true;
    renderAlbumDetails(currentSelectedAlbum);
  };

  window.cancelEditAlbum = function() {
    isEditingAlbum = false;
    renderAlbumDetails(currentSelectedAlbum);
  };

  window.saveAlbumChanges = async function() {
    if (!canEditAlbums()) {
      showNotification('No tienes permisos para editar álbumes', 'error');
      return;
    }
    
    const newTitle = document.getElementById('editAlbumTitle').value.trim();
    const newDescription = document.getElementById('editAlbumDescription').value.trim();
    
    if (!newTitle) {
      showNotification('El título no puede estar vacío', 'error');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/sesiones/${currentSelectedAlbum.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ nombre: newTitle, descripcion: newDescription })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error del servidor');
      }
      
      currentSelectedAlbum.nombre = newTitle;
      currentSelectedAlbum.descripcion = newDescription;
      isEditingAlbum = false;
      
      showNotification('Álbum actualizado correctamente');
      renderAlbumDetails(currentSelectedAlbum);
      loadSessions();
    } catch(err) {
      console.error(err);
      showNotification(err.message, 'error');
    }
  };

  window.deleteAlbum = function() {
    if (!canDeleteAlbums()) {
      showNotification('No tienes permisos para eliminar álbumes', 'error');
      return;
    }
    
    showModal('Eliminar álbum', 
      `¿Estás seguro de que deseas eliminar el álbum "${currentSelectedAlbum.nombre}"?`, 
      async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/sesiones/${currentSelectedAlbum.id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          
          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Error del servidor');
          }
          
          showNotification('Álbum eliminado correctamente');
          loadSessions();
          noAlbumSelected.classList.remove('hidden');
          albumContent.classList.add('hidden');
          currentSelectedAlbum = null;
        } catch(err) {
          console.error(err);
          showNotification(err.message, 'error');
        }
      }
    );
  };

  window.deleteFile = async function(fileId) {
    if (!canDeleteAlbums()) {
      showNotification('No tienes permisos para eliminar archivos', 'error');
      return;
    }
    
    showModal('Eliminar archivo', '¿Estás seguro de que deseas eliminar este archivo?', async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/sesiones/archivo/${fileId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Error del servidor');
        }
        
        showNotification('Archivo eliminado correctamente');
        selectAlbum(currentSelectedAlbum.id);
      } catch(err) {
        console.error(err);
        showNotification(err.message, 'error');
      }
    });
  };

  function attachFileUploadListener() {
    const addMoreFilesInput = document.getElementById('addMoreFiles');
    if (addMoreFilesInput) {
      addMoreFilesInput.addEventListener('change', async (e) => {
        if (!currentSelectedAlbum) return;
        
        const files = e.target.files;
        if (files.length === 0) return;
        
        try {
          let uploadedCount = 0;
          let duplicatedCount = 0;
          let errorCount = 0;
          
          for (const file of files) {
            const fd = new FormData();
            fd.append('archivo', file);
            fd.append('sesion_id', currentSelectedAlbum.id);
            
            const uploadRes = await fetch('http://localhost:3000/api/files/subir', { 
              method: 'POST', 
              body: fd 
            });
            
            if (!uploadRes.ok) {
              errorCount++;
              continue;
            }
            
            const uploadData = await uploadRes.json();
            
            if (uploadData.duplicated) {
              duplicatedCount++;
            } else {
              uploadedCount++;
            }
          }
          
          let message = '';
          if (uploadedCount > 0) message += `${uploadedCount} archivo(s) añadido(s)`;
          if (duplicatedCount > 0) {
            if (message) message += ', ';
            message += `${duplicatedCount} duplicado(s) omitido(s)`;
          }
          
          showNotification(message || 'Archivos procesados', errorCount > 0 ? 'error' : 'success');
          selectAlbum(currentSelectedAlbum.id);
          e.target.value = '';
        } catch(err) {
          console.error(err);
          showNotification('Error subiendo archivos: ' + err.message, 'error');
        }
      });
    }
  }

  // —— Gestión de usuarios con permisos mejorada ——
  async function loadUsers() {
    if (!canManageUsers() && !isEditor()) return; // Los editores pueden ver su propio perfil
    
    try {
      const res = await fetch('http://localhost:3000/api/usuarios', {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        throw new Error('Error cargando usuarios');
      }
      
      const users = await res.json();
      
      // Limpiar la tabla completamente antes de añadir usuarios
      usersList.innerHTML = '';
      
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        
        // Determinar acciones disponibles
        let actions = '';
        const canDelete = canManageUsers() && u.id !== 1 && u.usuario !== 'admin'; // No eliminar admin principal
        const canChangePassword = canManageUsers() && u.id !== currentUser.id; // Admin puede cambiar contraseñas de otros
        
        if (canDelete || canChangePassword) {
          actions = '<div class="flex gap-2">';
          
          if (canChangePassword) {
            actions += `
              <button onclick="openChangePasswordModal(${u.id}, '${u.usuario}')" 
                      class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                <i class="fas fa-key text-xs"></i>
                <span class="text-sm">Cambiar contraseña</span>
              </button>
            `;
          }
          
          if (canDelete) {
            actions += `
              <button data-id="${u.id}" class="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors flex items-center gap-1">
                <i class="fas fa-trash text-xs"></i>
                <span class="text-sm">Eliminar</span>
              </button>
            `;
          }
          
          actions += '</div>';
        } else if (u.id === 1 || u.usuario === 'admin') {
          actions = `
            <span class="text-gray-400 flex items-center text-sm">
              <i class="fas fa-shield-alt mr-2"></i>Protegido
            </span>
          `;
        } else {
          actions = `
            <span class="text-gray-500 text-sm flex items-center">
              <i class="fas fa-user mr-1"></i>Tu cuenta
            </span>
          `;
        }
        
        tr.innerHTML = `
          <td class="py-4 px-4 font-medium text-gray-800">${u.usuario}</td>
          <td class="py-4 px-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }">
              <i class="fas ${u.role === 'admin' ? 'fa-crown' : 'fa-user'} mr-1"></i>
              ${u.role === 'admin' ? 'Administrador' : 'Editor'}
            </span>
          </td>
          <td class="py-4 px-4">${actions}</td>
        `;
        
        const deleteBtn = tr.querySelector('button[data-id]');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async e => {
            const id = e.currentTarget.dataset.id;
            showModal('Eliminar usuario',`¿Eliminar usuario ${u.usuario}?`, async ()=>{
              try {
                const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
                  method: 'DELETE',
                  headers: getAuthHeaders()
                });
                
                if (!res.ok) {
                  const error = await res.json();
                  throw new Error(error.error || 'Error del servidor');
                }
                
                loadUsers();
                showNotification('Usuario eliminado');
              } catch(err) {
                showNotification(err.message, 'error');
              }
            });
          });
        }
        
        usersList.appendChild(tr);
      });
    } catch(err) { 
      console.error(err); 
      showNotification('Error cargando usuarios','error');
    }
  }

  // —— Funciones para cambio de contraseña de otros usuarios ——
  window.openChangePasswordModal = function(userId, username) {
    if (!canManageUsers()) {
      showNotification('No tienes permisos para cambiar contraseñas de otros usuarios', 'error');
      return;
    }
    
    targetUserId = userId;
    targetUserName.textContent = username;
    adminNewPassword.value = '';
    adminConfirmPassword.value = '';
    changeUserPasswordModal.classList.remove('hidden');
  };

  cancelChangePassword.addEventListener('click', () => {
    changeUserPasswordModal.classList.add('hidden');
    targetUserId = null;
  });

  confirmChangePassword.addEventListener('click', async () => {
    if (!canManageUsers() || !targetUserId) {
      showNotification('No tienes permisos para cambiar contraseñas de otros usuarios', 'error');
      return;
    }
    
    const newPassword = adminNewPassword.value.trim();
    const confirmPassword = adminConfirmPassword.value.trim();
    
    if (!newPassword || !confirmPassword) {
      showNotification('Complete ambos campos de contraseña', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    
    if (newPassword.length < 4) {
      showNotification('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${targetUserId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ nueva: newPassword })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error del servidor');
      }
      
      showNotification(`Contraseña de ${targetUserName.textContent} actualizada exitosamente`);
      changeUserPasswordModal.classList.add('hidden');
      targetUserId = null;
    } catch(err) {
      console.error(err);
      showNotification(err.message, 'error');
    }
  });

  addUserBtn.addEventListener('click', async () => {
    if (!canManageUsers()) {
      showNotification('No tienes permisos para crear usuarios', 'error');
      return;
    }
    
    const usr = document.getElementById('newUsername').value.trim();
    const pwd = document.getElementById('userPassword').value;
    const rol = document.getElementById('userRole').value;
    
    if(!usr||!pwd) {
      showNotification('Complete todos los campos','error');
      return;
    }
    
    if(pwd.length < 4) {
      showNotification('La contraseña debe tener al menos 4 caracteres','error');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/api/usuarios/register',{ 
        method:'POST', 
        headers: {
          'Content-Type':'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ usuario:usr, contrasena:pwd, role:rol })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error del servidor');
      }
      
      showNotification(`Usuario ${usr} creado exitosamente`);
      document.getElementById('newUsername').value = '';
      document.getElementById('userPassword').value = '';
      loadUsers();
    } catch(err) { 
      console.error(err); 
      showNotification(err.message,'error'); 
    }
  });

  changePasswordBtn.addEventListener('click', async () => {
    const oldP = document.getElementById('oldPassword').value;
    const newP = document.getElementById('newPassword').value;
    const conf = document.getElementById('confirmPassword').value;
    
    if(!newP||!conf) {
      showNotification('Complete los campos de nueva contraseña','error');
      return;
    }
    
    if(newP !== conf) {
      showNotification('Las contraseñas no coinciden','error');
      return;
    }
    
    if(newP.length < 4) {
      showNotification('La contraseña debe tener al menos 4 caracteres','error');
      return;
    }
    
    // Para no-admins, la contraseña actual es requerida
    if (!isAdmin() && !oldP) {
      showNotification('Ingresa tu contraseña actual','error');
      return;
    }
    
    try {
      const body = { nueva: newP };
      if (oldP) body.actual = oldP;
      
      const res = await fetch(`http://localhost:3000/api/usuarios/${currentUser.id}/password`, {
        method:'PUT', 
        headers: {
          'Content-Type':'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error del servidor');
      }
      
      showNotification('Tu contraseña ha sido actualizada exitosamente');
      document.getElementById('oldPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } catch(err) { 
      console.error(err); 
      showNotification(err.message,'error'); 
    }
  });

  cancelAction.addEventListener('click', ()=> confirmModal.classList.add('hidden'));
});