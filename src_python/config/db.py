import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Apunta al archivo .env del proyecto principal
dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
load_dotenv(dotenv_path)

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("CRÍTICO: No se encontró MONGO_URI en el archivo .env")

try:
    client = MongoClient(MONGO_URI)

    # Base actual de Mongo Atlas
    db = client["mapa_clientes"]

    print(">>> [PYTHON] Conexión exitosa a MongoDB Atlas")

except Exception as e:
    print(f"Error conectando a MongoDB: {e}")
    db = None