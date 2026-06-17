const URL_API = "https://script.google.com/macros/s/AKfycbxIiT-QkVL5tS72zp4M3YiVzRkFtjc2Zcpjh-Im-uK_XMWbceQ5BNFLYHxKmI8g5gYi/exec";

let listaGlobalProductos = [];
let categoriaSeleccionada = "todas";

function showSection(sectionId) {
    if (window.location.pathname.includes('micuenta.html')) {
        window.location.href = 'index.html';
        return;
    }
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(sectionId);
    if(targetPage) {
        targetPage.classList.add('active');
    }
}

function checkAuthNav() {
    const userSession = localStorage.getItem('user_session');
    if(userSession) {
        window.location.href = 'micuenta.html';
    } else {
        showSection('login');
    }
}

// --- FLUJO: CONSULTA Y FILTRADO ---
async function fetchProductosGlobales() {
    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: 'getProducts' })
        });
        const result = await response.json();
        
        if(result.status === 'success') {
            listaGlobalProductos = result.data;
            filtrarProductos(); 
        }
    } catch(err) {
        console.error("Error cargando productos: ", err);
    }
}

function filtrarCategoria(categoria, elemento) {
    document.querySelectorAll('.category-tags .tag').forEach(t => t.classList.remove('active'));
    elemento.classList.add('active');
    categoriaSeleccionada = categoria;
    filtrarProductos();
}

function filtrarProductos() {
    const textoBusqueda = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase().trim() : "";
    let productosFiltrados = listaGlobalProductos;

    if (document.getElementById('product-grid')) {
        productosFiltrados = productosFiltrados.filter(p => String(p.estatus).toLowerCase() !== "agotado");
    }

    if (categoriaSeleccionada !== "todas") {
        productosFiltrados = productosFiltrados.filter(p => p.categoria === categoriaSeleccionada);
    }

    if (textoBusqueda !== "") {
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(textoBusqueda) || 
            p.desc.toLowerCase().includes(textoBusqueda)
        );
    }

    renderCatalogo(productosFiltrados);
    
    if (document.getElementById('my-products-list')) {
        renderDashboard();
    }
}

function renderCatalogo(arrProductos) {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    
    if(arrProductos.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron productos disponibles con esos filtros.</p>`;
        return;
    }
    
    grid.innerHTML = arrProductos.map(p => `
        <div class="product-card">
            <img src="${p.img || 'https://via.placeholder.com/280x220?text=Sin+Foto'}" alt="${p.nombre}">
            <div class="product-info">
                <span class="badge-categoria">${p.categoria || 'Otros'}</span>
                <h3>${p.nombre}</h3>
                <p class="price-tag">${p.precio}</p>
                <p class="vendedor-tag">📦 ${p.desc}</p>
            </div>
            <a href="https://wa.me/52${p.whatsapp}?text=Hola! Vi tu producto en CUTiendita: *${p.nombre}*. ¿Aún tienes disponible?" 
               target="_blank" class="btn-wa">Contactar por WhatsApp</a>
        </div>
    `).join('');
}

// --- FLUJO: REGISTRO E INICIO DE SESIÓN ---
async function registrarVendedorForm() {
    const datos = {
        nombre: document.getElementById('reg-nombre').value.trim(),
        carrera: document.getElementById('reg-carrera').value.trim(),
        whatsapp: document.getElementById('reg-tel').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-pass').value.trim()
    };

    if(!datos.nombre || !datos.whatsapp || !datos.email || !datos.password) {
        return alert("Por favor completa los campos principales para el registro.");
    }

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: 'register', data: datos })
        });
        const result = await response.json();
        alert(result.message);
        if(result.status === 'success') showSection('login');
    } catch(err) {
        alert("Error en el registro. Intenta de nuevo.");
    }
}

async function loginUser() {
    const datos = {
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-pass').value.trim()
    };

    if(!datos.email || !datos.password) return alert("Ingresa tus datos de acceso.");

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', data: datos })
        });
        const result = await response.json();
        
        if(result.status === 'success') {
            localStorage.setItem('user_session', JSON.stringify({
                userId: result.userId,
                nombre: result.nombre
            }));
            window.location.href = 'micuenta.html';
        } else {
            alert(result.message);
        }
    } catch(err) {
        alert("Error de conexión al iniciar sesión.");
    }
}

// --- FLUJO: PANEL DE ADMINISTRACIÓN ---
function renderDashboard() {
    const session = JSON.parse(localStorage.getItem('user_session'));
    if(!session) return;
    
    const welcomeMsg = document.getElementById('welcome-msg');
    if(welcomeMsg) welcomeMsg.innerText = `Vendedor: ${session.nombre}`;
    
    const container = document.getElementById('my-products-list');
    if(!container) return;
    
    const misProductos = listaGlobalProductos.filter(p => String(p.vendedorId) === String(session.userId));
    
    if(misProductos.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No tienes productos activos todavía.</p>`;
        return;
    }
    
    container.innerHTML = misProductos.map(p => {
        const isChecked = String(p.estatus).toLowerCase() !== "agotado" ? "checked" : "";
        return `
            <div class="product-card native-card dashboard-item">
                <img src="${p.img}" alt="" style="width: 65px; height: 65px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1; min-width: 0;">
                    <h4 class="truncate">${p.nombre}</h4>
                    <p style="color: var(--cu-verde); font-weight: 800; font-size: 0.9rem; margin: 0;">${p.precio}</p>
                    <span style="font-size: 0.75rem; color: var(--text-muted); background: var(--background); padding: 2px 6px; border-radius: 4px; font-weight:700;">${p.categoria}</span>
                </div>
                
                <div class="action-buttons-dashboard" style="display: flex; gap: 0.5rem; align-items: center;">
                    <div class="status-toggle-container">
                        <span class="toggle-label">${isChecked ? "Disponible" : "Agotado"}</span>
                        <label class="switch">
                            <input type="checkbox" ${isChecked} onchange="toggleEstatusProducto('${p.id}', this)">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    
                    <button class="btn-action-edit" onclick="abrirModalEdicion('${p.id}')">✏️</button>
                    <button class="btn-action-delete" onclick="eliminarProducto('${p.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// FUNCIÓN AUXILIAR: Transforma la foto del celular en una cadena Base64
function convertirFileABase64(fileElement) {
    return new Promise((resolve) => {
        const file = fileElement.files[0];
        if (!file) return resolve("");
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

async function publicarProductoForm() {
    const session = JSON.parse(localStorage.getItem('user_session'));
    if(!session) return window.location.href = 'index.html';

    const fileInput = document.getElementById('prod-file');
    if (fileInput.files.length === 0) {
        return alert("Por favor, selecciona una foto de tu producto desde tu galería.");
    }

    // Convertimos la imagen antes de disparar el POST
    const imagenBase64 = await convertirFileABase64(fileInput);

    const categoriaSelect = document.getElementById('prod-categoria');
    const valorCategoria = categoriaSelect ? categoriaSelect.value : "Otros";

    const datosProducto = {
        vendedorId: session.userId,
        categoria: valorCategoria,
        nombre: document.getElementById('prod-nombre').value.trim(),
        precio: document.getElementById('prod-precio').value.trim(),
        descripcion: document.getElementById('prod-desc').value.trim(),
        imagen: imagenBase64, // Enviamos el Base64 listo para Google Sheets
        estatus: "Disponible" 
    };

    if(!datosProducto.nombre || !datosProducto.precio) {
        return alert("Completa el nombre y el precio del producto.");
    }

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: 'addProduct', data: datosProducto })
        });
        const result = await response.json();
        
        alert(result.message);
        if(result.status === 'success') {
            if(categoriaSelect) categoriaSelect.value = '';
            document.getElementById('prod-nombre').value = '';
            document.getElementById('prod-precio').value = '';
            document.getElementById('prod-desc').value = '';
            fileInput.value = '';
            document.getElementById('preview-container').style.display = 'none';
            
            await fetchProductosGlobales();
        }
    } catch(err) {
        alert("Error al intentar publicar tu artículo.");
    }
}

async function toggleEstatusProducto(productoId, checkbox) {
    const nuevoEstatus = checkbox.checked ? "Disponible" : "Agotado";
    const labelSpan = checkbox.closest('.status-toggle-container').querySelector('.toggle-label');
    labelSpan.innerText = nuevoEstatus;

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'toggleStatus', 
                data: { id: productoId, estatus: nuevoEstatus } 
            })
        });
        const result = await response.json();
        if(result.status !== 'success') {
            alert("No se pudo actualizar el estatus.");
            checkbox.checked = !checkbox.checked; 
            labelSpan.innerText = checkbox.checked ? "Disponible" : "Agotado";
        } else {
            const prodIndex = listaGlobalProductos.findIndex(p => String(p.id) === String(productoId));
            if (prodIndex !== -1) listaGlobalProductos[prodIndex].estatus = nuevoEstatus;
        }
    } catch(err) {
        checkbox.checked = !checkbox.checked;
    }
}

function abrirModalEdicion(productoId) {
    const prod = listaGlobalProductos.find(p => String(p.id) === String(productoId));
    if(!prod) return;

    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('edit-prod-categoria').value = prod.categoria;
    document.getElementById('edit-prod-nombre').value = prod.nombre;
    document.getElementById('edit-prod-precio').value = prod.precio;
    document.getElementById('edit-prod-desc').value = prod.desc;
    
    // Almacenamos la foto existente por si el usuario decide no cambiarla
    document.getElementById('edit-prod-img-fallback').value = prod.img;
    document.getElementById('edit-prod-img-preview').src = prod.img || 'https://via.placeholder.com/280x220?text=Sin+Foto';

    document.getElementById('edit-modal').classList.add('open');
}

function cerrarModalEdicion() {
    document.getElementById('edit-modal').classList.remove('open');
    document.getElementById('edit-prod-file').value = '';
}

async function actualizarProductoForm() {
    const fileInput = document.getElementById('edit-prod-file');
    let imagenFinal = document.getElementById('edit-prod-img-fallback').value;

    // Si el usuario eligió una nueva foto de la galería, la procesamos, sino conservamos la anterior
    if (fileInput.files.length > 0) {
        imagenFinal = await convertirFileABase64(fileInput);
    }

    const datosModificados = {
        id: document.getElementById('edit-prod-id').value,
        categoria: document.getElementById('edit-prod-categoria').value,
        nombre: document.getElementById('edit-prod-nombre').value.trim(),
        precio: document.getElementById('edit-prod-precio').value.trim(),
        descripcion: document.getElementById('edit-prod-desc').value.trim(),
        imagen: imagenFinal
    };

    if(!datosModificados.nombre || !datosModificados.precio) {
        return alert("Por favor, llena los campos obligatorios.");
    }

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: 'updateProduct', data: datosModificados })
        });
        const result = await response.json();
        
        alert(result.message);
        if(result.status === 'success') {
            cerrarModalEdicion();
            await fetchProductosGlobales(); 
        }
    } catch(err) {
        alert("Ocurrió un error al actualizar.");
    }
}

async function eliminarProducto(productoId) {
    if(!confirm("¿Estás completamente seguro de que deseas eliminar este producto de CUTiendita? Esta acción no se puede deshacer.")) return;

    try {
        const response = await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteProduct', data: { id: productoId } })
        });
        const result = await response.json();
        
        alert(result.message);
        if(result.status === 'success') {
            await fetchProductosGlobales();
        }
    } catch(err) {
        alert("Error de conexión al eliminar el artículo.");
    }
}

function logoutUser() {
    localStorage.removeItem('user_session');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProductosGlobales();
});
