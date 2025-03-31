# Importamos las librerías de Flask
from flask import Flask, jsonify, render_template
import sqlite3

# Importamos la librería para usar CORS
from flask_cors import CORS

# Importamos la librería para la base de datos
from Conexion import conexion_bd

# Creamos la aplicación Flask
app = Flask(__name__)

# Habilitar CORS en toda la aplicación
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5000"}})

# Lista de categorías válidas para evitar consultas a tablas inexistentes
CATEGORIAS_VALIDAS = {"nieve", "otros", "paletas", "bolis"}

# RUTA para cargar la pagina principal
@app.route("/Menu")
def index():
    return render_template("Menu.html")


# RUTA para obtener los productos de la base de datos
@app.route("/Menu/<categoria>", methods=['GET'])
def obtener_productos(categoria):
    if categoria not in CATEGORIAS_VALIDAS:
        return jsonify({"mensaje": "Categoría no válida"}), 400

    print(f"Se llamó a la ruta de {categoria}")  # Depuración

    # Conectamos a la base de datos
    conn, cursor = conexion_bd()
    if conn is None or cursor is None:
        return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

    try:
        # Si la categoría es 'nieve', incluir el campo 'cantidad'
        if categoria == "nieve":
            query = """
                SELECT id, nombre, tipo_id, precio_bruto, precio_neto, stock_actual, cantidad, sabor_id, marca_id, ? AS categoria 
                FROM nieve;
            """
        else:
            query = """
                SELECT id, nombre, tipo_id, precio_bruto, precio_neto, stock_actual, NULL AS cantidad, sabor_id, marca_id, ? AS categoria 
                FROM {};
            """.format(categoria)

        cursor.execute(query, (categoria,))
        resultado = cursor.fetchall()

        # Convertimos el resultado a una lista de diccionarios
        columnas = [desc[0] for desc in cursor.description]
        datos = [dict(zip(columnas, fila)) for fila in resultado]

        # Cerramos la conexión
        conn.close()

        return jsonify(datos), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500


# RUTA para obtener las marcas de la tabla marcas
@app.route("/Menu/marcas", methods=['GET'])
def obtener_marcas():
    try:
        # Conectamos a la base de datos
        conn, cursor = conexion_bd()
        if conn is None or cursor is None:
            return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

        query = "SELECT id, nombre FROM marcas;"
        cursor.execute(query)
        resultado = cursor.fetchall()

        # Convertimos el resultado a una lista de diccionarios
        columnas = [desc[0] for desc in cursor.description]
        datos = [dict(zip(columnas, fila)) for fila in resultado]

        conn.close()
        return jsonify(datos), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500


#RUTA para obtener los sabores de la tabla sabores
@app.route("/Menu/sabores", methods=['GET'])
def obtener_sabores():
    try:
        # Conectamos a la base de datos
        conn, cursor = conexion_bd()
        if conn is None or cursor is None:
            return jsonify({"mensaje": "Error al conectar a la base de datos"}), 500

        query = "SELECT id, nombre FROM sabores;"
        cursor.execute(query)
        resultado = cursor.fetchall()

        # Convertimos el resultado a una lista de diccionarios
        columnas = [desc[0] for desc in cursor.description]
        datos = [dict(zip(columnas, fila)) for fila in resultado]

        conn.close()
        return jsonify(datos), 200

    except sqlite3.Error as e:
        print(f"Error al ejecutar la sentencia SQL: {e}")
        return jsonify({"mensaje": "Error al ejecutar la consulta"}), 500


if __name__ == '__main__':
    app.run(debug=True)
