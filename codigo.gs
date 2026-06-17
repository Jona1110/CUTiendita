// --- CONFIGURACIÓN ---
const SS = SpreadsheetApp.getActiveSpreadsheet();
const sheetUsers = SS.getSheetByName('Usuarios');
const sheetProducts = SS.getSheetByName('Productos');

// Esta función carga tu archivo HTML
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CUTiendita')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Esta función maneja todas las peticiones POST desde la App
function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  
  let result = { status: 'error', message: 'Acción no válida' };

  switch(action) {
    case 'register':
      result = registerUser(params.data);
      break;
    case 'login':
      result = loginUser(params.data);
      break;
    case 'addProduct':
      result = addProduct(params.data);
      break;
    case 'getProducts':
      result = getProducts();
      break;
    case 'toggleStatus':
      result = toggleStatus(params.data);
      break;
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- LÓGICA DE USUARIOS ---
function registerUser(data) {
  // Validación básica: Verificar si el correo existe
  const dataUsers = sheetUsers.getDataRange().getValues();
  for(let i=1; i<dataUsers.length; i++) {
    if(dataUsers[i][4] === data.email) return { status: 'error', message: 'Correo ya registrado' };
  }
  
  sheetUsers.appendRow([new Date().getTime(), data.nombre, data.carrera, data.whatsapp, data.email, data.password]);
  return { status: 'success', message: 'Registro exitoso' };
}

function loginUser(data) {
  const dataUsers = sheetUsers.getDataRange().getValues();
  for(let i=1; i<dataUsers.length; i++) {
    // Columna 4 = email, Columna 5 = password
    if(dataUsers[i][4] === data.email && dataUsers[i][5] === data.password) {
      return { status: 'success', userId: dataUsers[i][0], nombre: dataUsers[i][1] };
    }
  }
  return { status: 'error', message: 'Credenciales incorrectas' };
}

// --- LÓGICA DE PRODUCTOS ---
function getProducts() {
  const data = sheetProducts.getDataRange().getValues();
  const products = [];
  
  // Si la hoja solo tiene el encabezado, regresamos arreglo vacío sin romper el flujo
  if (data.length <= 1) return { status: 'success', data: products };

  for(let i=1; i<data.length; i++) {
    products.push({
      id: data[i][0],
      vendedorId: data[i][1],
      nombre: data[i][2],
      precio: data[i][3],
      desc: data[i][4],
      img: data[i][5],
      categoria: data[i][6] || 'Otros', // Columna G (Índice 6)
      estatus: data[i][7] || 'Disponible' // Columna H (Índice 7)
    });
  }
  return { status: 'success', data: products };
}

function addProduct(data) {
  // Guarda las columnas en orden: ID, ID_Vendedor, Nombre, Precio, Descripcion, URL_Imagen, Categoría, Estatus, Fecha
  sheetProducts.appendRow([
    new Date().getTime(), 
    data.vendedorId, 
    data.nombre, 
    data.precio, 
    data.descripcion, 
    data.imagen, 
    data.categoria, 
    data.estatus || 'Disponible', 
    new Date()
  ]);
  return { status: 'success', message: 'Producto agregado con éxito' };
}

// --- NUEVA FUNCIÓN: ACTUALIZACIÓN INTERACTIVA DE INVENTARIO ---
function toggleStatus(data) {
  const dataProd = sheetProducts.getDataRange().getValues();
  
  for(let i=1; i<dataProd.length; i++) {
    // Buscamos la fila que coincida exactamente con el ID del producto (Columna A)
    if(String(dataProd[i][0]) === String(data.id)) {
      // Modificamos la Columna H (Índice 8 en el rango de Google Sheets) con el nuevo estatus enviado
      sheetProducts.getRange(i + 1, 8).setValue(data.estatus);
      return { status: 'success', message: 'Estatus de inventario actualizado' };
    }
  }
  return { status: 'error', message: 'El producto especificado no fue localizado' };
}