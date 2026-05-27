from fastapi import FastAPI, HTTPException
from config.db import db
import uvicorn

app = FastAPI(title="Microservicio Canario - Zona Valle")

# Endpoint 1 - Estado del servicio
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "python-fastapi-microservice",
        "message": "Convivencia técnica inicial exitosa"
    }

# Endpoint 2 - Verificar conexión MongoDB
@app.get("/test-mongo")
def test_mongo_connection():

    if db is None:
        raise HTTPException(
            status_code=500,
            detail="La base de datos no está inicializada."
        )

    try:
        colecciones = db.list_collection_names()

        return {
            "database_status": "connected",
            "collections_found": colecciones
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al listar colecciones: {str(e)}"
        )

# Endpoint 3 - Lectura segura colección clientes
@app.get("/test-clientes")
def test_clientes_collection():

    if db is None:
        raise HTTPException(
            status_code=500,
            detail="La base de datos no está inicializada."
        )

    try:
        clientes_collection = db["clientes"]

        total_documentos = clientes_collection.count_documents({})

        muestra_cliente = clientes_collection.find_one(
            {},
            {
                "_id": 0,
                "Cliente": 1,
                "Nombre": 1,
                "CD": 1,
                "Barrio": 1,
                "Latitud": 1,
                "Longitud": 1
            }
        )

        return {
            "collection_targeted": "clientes",
            "total_documents_count": total_documentos,
            "sample_document": muestra_cliente
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error leyendo colección clientes: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )