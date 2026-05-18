module.exports = async (req, res) => {
  const { nisn } = req.query

  const client = new MongoClient(process.env.MONGO_URI)

  await client.connect()
  const db = client.db("db_kelulusan")

  const data = await db.collection("students").findOne({ nisn })

  res.json(data)
}