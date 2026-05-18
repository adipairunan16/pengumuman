const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, {
  dbName: 'db_kelulusan'
})

const StudentSchema = new mongoose.Schema({
  nisn:String,
  nama:String,
  kelas:String,
  status:String
})

const Student = mongoose.model(
  'students',
  StudentSchema
)

module.exports = async (req, res) => {

  // TEST
  if(
    req.url === '/' ||
    req.url === '/api'
  ){

    return res.status(200).send('API hidup')
  }

  // GET ALL STUDENTS
  if(
    req.url === '/students' ||
    req.url === '/api/students'
  ){

    try {

      const students = await Student.find()

      return res.status(200).json(students)

    } catch(err){

      return res.status(500).json({
        error: err.message
      })
    }
  }

  return res.status(404).json({
    message:'Route tidak ditemukan',
    url:req.url
  })
}