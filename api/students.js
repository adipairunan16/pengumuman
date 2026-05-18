const { MongoClient } = require("mongodb")

const client = new MongoClient(process.env.MONGO_URI)

module.exports = async (req, res) => {
  try {
    await client.connect()
    const db = client.db("db_kelulusan")

    const data = await db.collection("students").find().toArray()

    res.json(data)

  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    })
  }
}