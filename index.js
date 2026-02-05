const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db("clientesDB");
    const clientes = db.collection("clientes");

    const total = await clientes.countDocuments();
    console.log("📊 Total de clientes:", total);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

main();
