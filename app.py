# Importamos las librerías de Flask
from flask import Flask, jsonify, render_template, request
import sqlite3
# Importamos la librería para usar CORS
from flask_cors import CORS
# Importamos la librería para la base de datos
from Conexion import conexion_bd


# Creamos la aplicación Flask
app = Flask(__name__)

# Habilitar CORS en toda la aplicación (incluyendo Live Server de VS Code)
CORS(app, resources={r"/api/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5000"]}})

# Lista de categorías válidas
CATEGORIAS_VALIDAS = {"nieve", "otros", "paletas", "bolis"}


#RUTA para cargar la página principal
@app.route("/")
def index():
    return render_template("index.html")


# RUTA para cargar el menu
@app.route("/menu")
def menu():
    return render_template("menu.html")


# RUTA para cargar el inventario
@app.route("/inventario")
def inventario():
    return render_template("inventario.html")


# RUTA para obtener los productos de la base de datos
@app.route("/menu/<categoria>", methods=['GET'])
def obtener_productos(categoria):

    # Verifica si la categoría solicitada está en la lista de categorías válidas.
    if categoria not in CATEGORIAS_VALIDAS:
        # Si la categoría no es válida, retorna un mensaje de error con el código 400.
        return jsonify({"mensaje": "Categoria no valida"}), 400

    print(f"Se llamó a la ruta de {categoria}")  # Depuración

    #Todas las rutas llaman a la conexion_bd para obtener conn y cursor.
    # para establecer la conexión. Si la conexión o el cursor no son válidos, se devuelve
    # un mensaje de error 500. por lo cual no sera necesario documentar todas la lineas con la misma funcion.

    # Conecta a la base de datos y obtiene el cursor.
    conn, cursor = conexion_bd()

    # Verifica si la conexión o el cursor no se establecieron correctamente.
    if conn is None or cursor is None:

        # Si falla la conexión, retorna un mensaje de error en formato JSON con el código 500.
        return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

    try:
        # Si la categoría es 'nieve', se incluye el campo 'tamano' en la consulta.
        if categoria == "nieve":
            query = """
                SELECT id, nombre, tipo_id, precio_bruto, precio_neto, stock_actual, tamano, sabor_id, marca_id, ? AS categoria
                FROM nieve;
            """
        else:
            # Para otras categorías, se asigna NULL al campo 'tamano' y se selecciona la tabla según la categoría.
            query = """
                SELECT id, nombre, tipo_id, precio_bruto, precio_neto, stock_actual, NULL AS tamano, sabor_id, marca_id, ? AS categoria
                FROM {};
            """.format(categoria)

        # Ejecuta la consulta pasando la categoría como parámetro para el campo 'categoria'.
        cursor.execute(query, (categoria,))

        # Obtiene todos los registros resultantes de la consulta.
        resultado = cursor.fetchall()

        # Extrae los nombres de las columnas usando la descripción del cursor.
        columnas = [desc[0] for desc in cursor.description]
        
        # Combina cada fila con los nombres de columna para formar una lista de diccionarios.
        datos = [dict(zip(columnas, fila)) for fila in resultado]

        # En todas las rutas se hara lo mismo
        # Cierra la conexión a la base de datos para liberar recursos.
        conn.close()

        # Retorna los datos obtenidos en formato JSON con el código de estado 200.
        return jsonify(datos), 200

    # en todas las rutas se usa except para despues de haber intenatado conectar a la base de datos
    # y ejecutar la consulta SQL, si no fue exitosa se imprimen los errores en la consola 
    # y se retorna un mensaje de error en formato JSON con el código 500
    except sqlite3.Error as e:
        # Si ocurre un error en la ejecución de la consulta SQL, imprime el error en la consola.
        print(f"Error al ejecutar la sentencia SQL: {e}")
        # Retorna un mensaje de error en formato JSON con el código de estado 500.
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500



# RUTA para obtener las marcas de la tabla marcas
@app.route("/menu/marcas", methods=['GET'])
def obtener_marcas():
    try:
        conn, cursor = conexion_bd()
        
        if conn is None or cursor is None:
            return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

        # Define la consulta SQL para seleccionar el 'id' y 'nombre' de la tabla 'marcas'
        query = "SELECT id, nombre FROM marcas;"
        # Ejecuta la consulta SQL 
        cursor.execute(query)
        # Recupera todos los registros devueltos por la consulta
        resultado = cursor.fetchall()

        # Extrae los nombres de las columnas a partir de la descripción del cursor.
        columnas = [desc[0] for desc in cursor.description]
        # Combina cada fila de resultados con los nombres de columna para formar una lista de diccionarios.
        datos = [dict(zip(columnas, fila)) for fila in resultado]

        # Cierra el cursor para liberar recursos.
        cursor.close()
        conn.close()

        # Retorna los datos obtenidos en formato JSON junto con el código de estado 200.
        return jsonify(datos), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500


# RUTA para obtener los sabores de la tabla sabores
@app.route("/menu/sabores", methods=['GET'])
def obtener_sabores():
    try:
        conn, cursor = conexion_bd()

        if conn is None or cursor is None:
            return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

        # Define la consulta SQL para seleccionar 'id' y 'nombre' de la tabla 'sabores'
        query = "SELECT id, nombre FROM sabores;"
        # Se ejecuta la consulta SQL usando el cursor
        cursor.execute(query)
        # Se recuperan todos los registros resultantes de la consulta
        resultado = cursor.fetchall()

        # Se extraen los nombres de las columnas a partir de la descripción del cursor
        columnas = [desc[0] for desc in cursor.description]
        # Se crean diccionarios combinando cada fila de resultados con sus correspondientes nombres de columna
        datos = [dict(zip(columnas, fila)) for fila in resultado]

        # Se cierra el cursor para liberar recursos
        cursor.close()  
        conn.close()    

        # Se retorna la lista de sabores en formato JSON junto con el código de estado 200 (OK)
        return jsonify(datos), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500


#Ruta para eliminar un prodcuto de la base de datos
@app.route("/menu/eliminar", methods=["POST"])
def eliminar_menu():

    # Se obtiene la categoría y el ID del producto desde el JSON
    data = request.json  # Esto nos permite ver todo el cuerpo de la solicitud
    print(f"Datos recibidos: {data}")  # Depuración
    
    categoria = data.get('categoria')
    producto_id = data.get('id')
    
    # Verifica que la categoría sea válida y esté en la lista permitida
    if not categoria or categoria not in CATEGORIAS_VALIDAS:
        return jsonify({"mensaje": "Categoría no válida o no proporcionada"}), 400

    # Verifica que se haya proporcionado un ID de producto válido
    if not producto_id:
        return jsonify({"mensaje": "ID de producto no proporcionado", "success": False}), 400

    # Mensaje de depuración para confirmar los datos recibidos
    print(f"Producto a eliminar: ID = {producto_id} de la tabla {categoria}")

    conn, cursor = conexion_bd()
    if conn is None or cursor is None:
        return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

    try:
        # Consulta SQL para eliminar el producto según la categoría especificada
        # la categoria se relaciona con el nombre de la tabla
        # asi se eliminar á el producto (id) de la tabla correspondiente a la categoria (nombre de la tabla)
        query = "DELETE FROM {} WHERE id = ?;".format(categoria)
        cursor.execute(query, (producto_id,))
        conn.commit()

        conn.close()

        return jsonify({"mensaje": "Producto eliminado correctamente", "success": True}), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500


# RUTA para actualizar (UPDATE) los datos de un producto
@app.route("/menu/actualizar", methods=["POST"])
def actualizar_menu():
    
    # Obtener los datos del request JSON
    data = request.json
    print(f"Datos recibidos: {data}")  # Depuración

    producto_id = data.get('id')
    nombre = data.get('nombre')
    precio = data.get('precio')
    stock = data.get('stock')
    tamano = data.get('tamano')  # Solo aplicable a la categoría "nieve"
    sabor_id = data.get('sabor_id')
    marca_id = data.get('marca_id')
    categoria = data.get('categoria')

    # Validación de datos
    if not producto_id:
        return jsonify({"mensaje": "ID de producto no proporcionado", "success": False}), 400

    if categoria not in CATEGORIAS_VALIDAS:
        return jsonify({"mensaje": "Categoría no válida", "success": False}), 400

    conn, cursor = conexion_bd()
    if conn is None or cursor is None:
        return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

    try:
        # Construcción de la consulta SQL

        #en caso de que la categoria sea nieve, se crea una consulta especiifica para actualizar el tamaño
        if categoria == "nieve":
            query = """
                UPDATE {} 
                SET nombre = ?, precio_bruto = ?, precio_neto = ?, stock_actual = ?, tamano = ?, sabor_id = ?, marca_id = ?
                WHERE id = ?
            """.format(categoria)
            cursor.execute(query, (nombre, precio, precio, stock, tamano, sabor_id, marca_id, producto_id))
        else:
        # se genera la consulta en base a la categoria seleccionada que no son nieve
            query = """
                UPDATE {} 
                SET nombre = ?, precio_bruto = ?, precio_neto = ?, stock_actual = ?, sabor_id = ?, marca_id = ?
                WHERE id = ?
            """.format(categoria)
            cursor.execute(query, (nombre, precio, precio, stock, sabor_id, marca_id, producto_id))

        # Confirmar cambios en la base de datos
        conn.commit()
        conn.close()

        return jsonify({"mensaje": "Producto actualizado correctamente", "success": True}), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta", "success": False}), 500


if __name__ == '__main__':
    app.run(debug=True)