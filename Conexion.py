# se creara la funcion de conexion a la base de datos independiente de la Api

# se importa la libreria de conexion a la base de datos
import sqlite3

#funcion para conectarse a la base de datos
def conexion_bd():
    
    try:
        # se crea la conexion a la base de datos
        conn = sqlite3.connect('Productos.db') 
        # se crea un cursor para ejecutar las consultas
        cursor = conn.cursor()
        # se devuelve la conexion y el cursor
        return conn, cursor
    
    except sqlite3.Error as e:
        # se imprimira el error en caso de no lograr la conexion
        print(f"Error al conectar a la base de datos: {e}")

        #retorna los valores como None si hay un error
        return None, None 


# funcion para cerrar la conexion a la base de datos
def cerrar_conexion(conn):
    # se cierra la conexion a la base de datos
    if conn: 
        conn.close()