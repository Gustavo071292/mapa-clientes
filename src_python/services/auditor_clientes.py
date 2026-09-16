from config.db import db

def analizar_calidad_clientes():
    """
    Analiza la colección 'clientes' en modo solo lectura
    y retorna un diagnóstico de la calidad de los datos.
    """
    if db is None:
        return {"error": "Base de datos no inicializada"}

    coleccion = db["clientes"]

    # 1. Conteos básicos usando filtros de MongoDB
    total_clientes = coleccion.count_documents({})
    
    # Clientes sin coordenadas (el campo no existe o está vacío/nulo)
    sin_latitud = coleccion.count_documents({"$or": [{"Latitud": None}, {"Latitud": ""}, {"Latitud": {"$exists": False}}]})
    sin_longitud = coleccion.count_documents({"$or": [{"Longitud": None}, {"Longitud": ""}, {"Longitud": {"$exists": False}}]})
    
    # Clientes con coordenadas en cero (valores numéricos o strings "0")
    latitud_cero = coleccion.count_documents({"$or": [{"Latitud": 0}, {"Latitud": "0"}]})
    longitud_cero = coleccion.count_documents({"$or": [{"Longitud": 0}, {"Longitud": "0"}]})
    
    # Clientes sin datos de control operativo
    sin_cd = coleccion.count_documents({"$or": [{"CD": None}, {"CD": ""}, {"CD": {"$exists": False}}]})
    sin_codigo = coleccion.count_documents({"$or": [{"Cliente": None}, {"Cliente": ""}, {"Cliente": {"$exists": False}}]})
    sin_nombre = coleccion.count_documents({"$or": [{"Nombre": None}, {"Nombre": ""}, {"Nombre": {"$exists": False}}]})

    # 2. Distribución por Centro de Distribución (CD) mediante Pipeline de Agregación
    # Equivalente a un GROUP BY en SQL para contar cuántos clientes tiene cada CD
    pipeline_cd = [
        {
            "$group": {
                "_id": {"$ifNull": ["$CD", "SIN ESPECIFICAR"]}, # Agrupa por CD, si es nulo pone "SIN ESPECIFICAR"
                "cantidad": {"$sum": 1}
            }
        },
        {
            "$sort": {"cantidad": -1} # Ordena de mayor a menor cantidad
        }
    ]
    
    resultados_agregacion = list(coleccion.aggregate(pipeline_cd))
    
    # Convertimos el resultado a un diccionario más amigable para el JSON
    distribucion_por_cd = {}
    for item in resultados_agregacion:
        centro = str(item["_id"]).strip().upper()
        distribucion_por_cd[centro] = item["cantidad"]

    # 3. Consolidación del reporte de auditoría
    reporte_qa = {
        "total_clientes": total_clientes,
        "metricas_calidad": {
            "clientes_sin_latitud": sin_latitud,
            "clientes_sin_longitud": sin_longitud,
            "clientes_con_latitud_cero": latitud_cero,
            "clientes_con_longitud_cero": longitud_cero,
            "clientes_sin_cd": sin_cd,
            "clientes_sin_codigo_cliente": sin_codigo,
            "clientes_sin_nombre": sin_nombre
        },
        "distribucion_por_cd": distribucion_por_cd
    }

    return reporte_qa