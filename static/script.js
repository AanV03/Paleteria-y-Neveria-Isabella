// SCRIPS DE INDEX.HTML (espacio para futuras implementaciones)...



// SCRIPTS PARA MENU.HTML

$(document).ready(function () {
    // Inicializa la tabla de productos con DataTable
    var table = $('#productosTable').DataTable();

    // Carrito de compras vacío
    let carrito = [];

    // Definición de objetos para almacenar marcas, sabores y categorías
    var marcas = {};  // Almacenará las marcas de los productos
    var sabores = {}; // Almacenará los sabores de los productos
    var categorias = {}; // Almacenará las categorías de productos 

    // Solicita la lista de marcas desde el servidor
    $.getJSON("/menu/marcas", function (data) {
        // Transforma el array de marcas en un objeto donde la clave es el id de la marca
        // y el valor es el nombre de la marca
        marcas = data.reduce(function (obj, marca) {
            obj[marca.id] = marca.nombre;
            return obj;
        }, {});
    });

    // Solicita la lista de sabores desde el servidor
    $.getJSON("/menu/sabores", function (data) {
        // Transforma el array de sabores en un objeto donde la clave es el id del sabor
        // y el valor es el nombre del sabor
        sabores = data.reduce(function (obj, sabor) {
            obj[sabor.id] = sabor.nombre;
            return obj;
        }, {});
    });


    // Cargar productos según la categoría seleccionada
    function cargarProductos(categoria) {

        // Realiza una solicitud GET a la API para obtener los productos de la categoría seleccionada
        $.getJSON(`/menu/${categoria}`, function (data) {

            // Limpiar la tabla de productos antes de agregar los nuevos datos
            table.clear();

            // Determina si se debe ocultar la columna de tamaño (para ciertas categorías)
            let ocultartamano = ['paletas', 'bolis', 'otros'].includes(categoria);

            // Hacer visible o no la columna de tamaño según la categoría
            table.column(4).visible(!ocultartamano);

            // Itera sobre los productos recibidos de la API y los agrega a la tabla
            data.forEach(function (producto) {

                // Agrega una nueva fila a la tabla con los datos del producto
                table.row.add([
                    producto.id, // ID del producto
                    producto.nombre, // Nombre del producto
                    `$${producto.precio_neto.toFixed(2)}`, // Precio neto con dos decimales
                    producto.stock_actual, // Stock disponible
                    ocultartamano ? 'N/A' : producto.tamano || 1, // Tamaño (si aplica, o 'N/A')
                    sabores[producto.sabor_id] || 'Desconocido', // Nombre del sabor (si no existe, 'Desconocido')
                    marcas[producto.marca_id] || 'Desconocido', // Nombre de la marca (si no existe, 'Desconocido')

                    // Botón para agregar al carrito pasando todos los parametros
                    `<button class="btn btn-primary agregar-carrito" 
                    data-id="${producto.id}" 
                    data-nombre="${producto.nombre}" 
                    data-precio="${producto.precio_neto}"
                    data-categoria="${categoria}" 
                    data-marca="${producto.marca_id}">
                    <i class="bi bi-cart-plus"></i>
                </button>`

                ]).draw(); // Dibuja la nueva fila en la tabla
            });
        });
    }


    // Función para cargar productos de una categoría específica
    $(".categoria-btn").click(function () {
        // Eliminar la clase 'active' de todos los botones
        $(".categoria-btn").removeClass("active");

        // Agregar la clase 'active' al botón clickeado, para destacar la categoría seleccionada
        $(this).addClass("active");

        // Obtener la categoría seleccionada a partir del atributo 'data-categoria' del botón
        var categoria = $(this).data("categoria");

        // Imprimir en consola la categoría seleccionada (depuración)
        console.log("Categoría seleccionada:", categoria);

        // Llamar a la función 'cargarProductos' para cargar los productos de la categoría seleccionada
        cargarProductos(categoria);
    });

    // Cargar productos de la categoría 'nieve' como base al inicializar la página
    cargarProductos("nieve");


    // Evento para abrir el modal de agregar al carrito
    $("#productosTable tbody").on("click", ".agregar-carrito", function () {
        // Obtener los datos del producto desde los atributos 'data' del botón clickeado
        let id = $(this).data("id");
        let nombre = $(this).data("nombre");
        let precio = $(this).data("precio");
        let categoria = $(this).data("categoria");
        let marcaId = $(this).data("marca");

        // Si la categoría es "nieve", obtener el tamaño del producto desde la fila correspondiente
        let tamano = categoria === "nieve" ? $(this).closest("tr").find("td:eq(4)").text().trim() : null;

        // Establecer los valores del modal para agregar al carrito
        // Asignar el valor de la cantidad inicial a 1
        $("#cantidadProducto").val(1);

        // Guardar los datos del producto en los atributos 'data' del botón de agregar al carrito del modal
        $("#btnAgregarCarrito").data("id", id)
            .data("nombre", nombre)
            .data("precio", precio)
            .data("categoria", categoria)
            .data("marca", marcaId)
            .data("tamano", tamano);  // Si es nieve, también se guarda el tamaño

        // Mostrar el modal de agregar al carrito
        $("#modalAgregarCarrito").modal("show");
    });


    // Agregar producto al carrito
    $("#btnAgregarCarrito").click(function () {
        // Obtener los datos del producto desde los atributos 'data' del botón
        let id = $(this).data("id");
        let nombre = $(this).data("nombre");
        let precio = $(this).data("precio");
        let cantidad = parseInt($("#cantidadProducto").val()); // Obtener la cantidad seleccionada en el modal
        let categoria = $(this).data("categoria");
        let marca = $(this).data("marca");

        // Si la categoría es "nieve", obtener el tamaño del producto desde los atributos 'data'
        let tamano = categoria === "nieve" ? $(this).data("tamano") || "N/A" : null;

        // Buscar el producto en el carrito comparando todas sus características (id, categoría, marca y tamaño si es nieve)
        let index = carrito.findIndex(item =>
            item.id === id &&
            item.categoria === categoria &&
            item.marca === marca &&
            (categoria !== "nieve" || item.tamano === tamano) // Si es nieve, comparar también el tamaño
        );

        // Si el producto ya está en el carrito, aumentar su cantidad
        if (index !== -1) {
            carrito[index].cantidad += cantidad;
        } else {
            // Si el producto no está en el carrito, agregarlo
            carrito.push({ id, nombre, precio, cantidad, categoria, marca, tamano });
        }

        // Actualizar el carrito visualmente y almacenarlo en el local storage
        actualizarCarrito();

        // Cerrar el modal de agregar al carrito
        $("#modalAgregarCarrito").modal("hide");
    });

    // funcion para "pintar" los datos del modal de carrito
    function actualizarCarrito() {
        let lista = $("#listaCarrito");  // Obtener el contenedor de la lista del carrito
        lista.empty();  // Limpiar la lista antes de agregar nuevos elementos
        let total = 0;  // Inicializar la variable para el total

        // Definir las plantillas HTML para las tablas de productos
        let tablaNieves = `
            <table class="tablemodal">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Nombre</th>
                    <th>Marca</th>
                    <th>Tamaño</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
        `;

        let tablaOtros = `
            <table class="tablemodal">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Nombre</th>
                    <th>Marca</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
        `;

        let tieneNieves = false;  // Indicador para saber si hay productos de la categoría 'nieve'
        let tieneOtros = false;   // Indicador para saber si hay productos de otras categorías

        // Recorrer los productos del carrito
        carrito.forEach((producto, index) => {
            let subtotal = producto.precio * producto.cantidad;  // Calcular el subtotal del producto
            total += subtotal;  // Sumar el subtotal al total general

            // Verificar si el producto es de la categoría "nieve" o "otros"
            if (producto.categoria === "nieve") {
                tieneNieves = true;  // Marcar que hay productos de nieve
                // Agregar fila a la tabla de productos de nieve
                tablaNieves += `
                    <tr>
                        <td>${producto.categoria}</td>
                        <td>${producto.nombre}</td>
                        <td>${marcas[producto.marca] || 'Desconocida'}</td>
                        <td>${producto.tamano || 'N/A'}</td>
                        <td>${producto.cantidad}</td>
                        <td>$${producto.precio.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm eliminar-producto" data-index="${index}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            } else {
                tieneOtros = true;  // Marcar que hay productos de otras categorías
                // Agregar fila a la tabla de productos de otras categorías
                tablaOtros += `
                    <tr>
                        <td>${producto.categoria}</td>
                        <td>${producto.nombre}</td>
                        <td>${marcas[producto.marca] || 'Desconocida'}</td>
                        <td>${producto.cantidad}</td>
                        <td>$${producto.precio.toFixed(2)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm eliminar-producto" data-index="${index}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        });

        // Cerrar las tablas con la etiqueta </tbody></table>
        tablaNieves += `</tbody></table>`;
        tablaOtros += `</tbody></table>`;

        // Si hay productos de la categoría "nieve", agregar la tabla correspondiente
        if (tieneNieves) lista.append(tablaNieves);

        // Si hay productos de otras categorías, agregar la tabla correspondiente
        if (tieneOtros) lista.append(tablaOtros);

        // Agregar el total del carrito al final de la lista
        lista.append(`<li class="list-group-item"><strong>Total: $${total.toFixed(2)}</strong></li>`);
    }


    // Evento para eliminar producto del carrito
    $("#listaCarrito").on("click", ".eliminar-producto", function () {
        let index = $(this).data("index");
        carrito.splice(index, 1);
        actualizarCarrito();
    });


    // Vaciar carrito
    $("#btnVaciarCarrito").click(function () {
        carrito = [];
        actualizarCarrito();
    });
});


// SCRIPTS INVENTARIO.HTML

$(document).ready(function () {
    var table = $('#inventarioTable').DataTable();

    let carrito = [];

    // Obtener marcas y sabores
    var marcas = {};
    var sabores = {};
    var categorias = {};

    $.getJSON("/menu/marcas", function (data) {
        marcas = data.reduce(function (obj, marca) {
            obj[marca.id] = marca.nombre;
            return obj;
        }, {});
    });

    $.getJSON("/menu/sabores", function (data) {
        sabores = data.reduce(function (obj, sabor) {
            obj[sabor.id] = sabor.nombre;
            return obj;
        }, {});
    });


    // Cargar productos según la categoría seleccionada
    function cargarProductos(categoria) {
        $.getJSON(`/menu/${categoria}`, function (data) {
            table.clear();

            let ocultartamano = ['paletas', 'bolis', 'otros'].includes(categoria);
            table.column(4).visible(!ocultartamano);

            data.forEach(function (producto) {
                table.row.add([
                    producto.id,
                    producto.nombre,
                    `$${producto.precio_neto.toFixed(2)}`,
                    producto.stock_actual,
                    ocultartamano ? 'N/A' : producto.tamano || 1,
                    sabores[producto.sabor_id] || 'Desconocido',
                    marcas[producto.marca_id] || 'Desconocido',
                    `<button class="btn-add editar-producto" data-id="${producto.id}" onclick="editarProducto(${producto.id})">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn-remove eliminar-producto" data-id="${producto.id}" onclick="eliminarProducto(${producto.id})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                    `
                ]).draw();
            });
        });
    }

    // Función para cargar productos de una categoría específica
    $(".categoria-btn").click(function () {
        $(".categoria-btn").removeClass("active");  // Eliminar la clase 'active' de todos los botones
        $(this).addClass("active");  // Agregar la clase 'active' al botón clickeado

        // Cargar productos de la categoría seleccionada
        var categoria = $(this).data("categoria");
        console.log("Categoría seleccionada:", categoria); // Verificar que la categoría se obtiene correctamente
        cargarProductos(categoria); // Llamar a la función para cargar productos
    });

    cargarProductos("nieve"); // Carga la tabla de nieve como base
});


// Función para eliminar un producto
function eliminarProducto(id) {
    // Obtener la categoría activa (igual que en la función de actualizar)
    var categoria = $(".categoria-btn.active").data("categoria");

    // Depuración para ver si se obtiene la categoría correctamente
    console.log("Categoría detectada en eliminarProducto:", categoria);

    // Verificar que la categoría esté disponible
    if (!categoria) {
        alert("Por favor, selecciona una categoría antes de eliminar un producto.");
        return;
    }

    console.log("ID del producto a eliminar:", id, "Categoría:", categoria); // Depuración

    // Mostrar el modal de confirmación
    $("#modalEliminarProducto").modal("show");

    // Guardar ID y categoría en el botón de confirmación
    $("#confirmarEliminacion").data("id", id);
    $("#confirmarEliminacion").data("categoria", categoria);
}


// Función para confirmar la eliminación
$("#confirmarEliminacion").click(function () {
    const id = $(this).data("id");
    const categoria = $(this).data("categoria");

    // Depuración antes de enviar la solicitud
    console.log("Datos enviados a la API de eliminación:", { id, categoria });

    // Verificar que ambos valores existen antes de hacer la solicitud
    if (!id || !categoria) {
        alert("Error: No se pudo obtener la categoría o el ID del producto.");
        return;
    }

    // Llamar a la ruta POST para eliminar el producto
    $.ajax({
        url: "/menu/eliminar",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ id: id, categoria: categoria }),  // Enviamos ambos datos
        success: function (response) {
            alert("Producto eliminado correctamente.");
            location.reload();  // Recargar la página para reflejar los cambios
        },
        error: function () {
            alert("Hubo un error al eliminar el producto.");
        }
    });

    // Cerrar el modal después de la confirmación
    $("#modalEliminarProducto").modal("hide");
});


// Función para editar un producto
function editarProducto(id) {
    // Obtener la categoría seleccionada (esto ya lo tenemos)
    var categoria = $(".categoria-btn.active").data("categoria");

    // Verificar que la categoría esté disponible
    if (!categoria) {
        alert("Por favor, selecciona una categoría primero.");
        return; // Si no hay categoría seleccionada, detener la ejecución de la función
    }

    console.log("Categoría seleccionada para editar:", categoria); // Línea de depuración

    // Obtener los datos del producto a través de la API
    $.get(`/menu/${categoria}`, function (data) {
        const producto = data.find(p => p.id === id);

        if (producto) {
            // Llenar el modal con los datos del producto
            $("#editarNombre").val(producto.nombre);
            $("#editarPrecio").val(producto.precio_neto);
            $("#editarStock").val(producto.stock_actual);
            $("#editarTamano").val(producto.tamano);
            $("#editarSabor").val(producto.sabor_id);
            $("#editarMarca").val(producto.marca_id);
            $("#editarCategoria").val(producto.categoria);

            // Mostrar el modal
            $("#modalEditarProducto").modal("show");

            // Establecer el ID del producto en el botón de guardar
            $("#guardarEdicion").data("id", producto.id);
        }
    });
}

$("#guardarEdicion").click(function () {
    const id = $(this).data("id");
    const nombre = $("#editarNombre").val();
    const precio = $("#editarPrecio").val();
    const stock = $("#editarStock").val();
    const tamano = $("#editarTamano").val();
    const sabor_id = $("#editarSabor").val();
    const marca_id = $("#editarMarca").val();
    const categoria = $("#editarCategoria").val();  // Aquí obtenemos la categoría directamente del formulario

    console.log("Datos del producto para actualizar:", {
        id,
        nombre,
        precio,
        stock,
        tamano,
        sabor_id,
        marca_id,
        categoria
    });

    // Realizamos el envío de la actualización a la ruta correspondiente
    $.ajax({
        url: "/menu/actualizar",  // Solo necesitas la ruta para actualizar
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            id: id,
            nombre: nombre,
            precio: precio,
            stock: stock,
            tamano: tamano,
            sabor_id: sabor_id,
            marca_id: marca_id,
            categoria: categoria
        }),
        success: function (response) {
            alert("Producto actualizado correctamente.");
            location.reload();  // Recargar la página para reflejar los cambios
        },
        error: function () {
            alert("Hubo un error al actualizar el producto.");
        }
    });
});

