const mongoose = require('mongoose')

// ======================
// CONNECT DB
// ======================

let isConnected = false

async function connectDB(){

  if(isConnected){
    return
  }

  await mongoose.connect(process.env.MONGO_URI)

  isConnected = true

  console.log('MongoDB Connected')
}


// ======================
// SCHEMA
// ======================

const StudentSchema = new mongoose.Schema({
  nisn:String,
  nama:String,
  kelas:String,
  status:String
})

const Student =
  mongoose.models.students ||
  mongoose.model('students', StudentSchema)


// ======================
// API
// ======================

module.exports = async (req, res) => {

  try {

    await connectDB()

    // TEST API
    if(req.url === '/api'){

      return res.status(200).send('API hidup')
    }

    // GET ALL STUDENTS
    if(
      req.url === '/students' ||
      req.url === '/api/students'
    ){

      const students = await Student.find()

      return res.status(200).json(students)
    }

    // GET BY NISN
    if(req.url.startsWith('/api/students/')){

      const nisn = req.url.split('/').pop()

      const student = await Student.findOne({ nisn })

      if(!student){

        return res.status(404).json({
          message:'Data tidak ditemukan'
        })
      }

      return res.json(student)
    }

    return res.status(404).json({
      message:'Route tidak ditemukan'
    })

  } catch(err){

    return res.status(500).json({
      error: err.message
    })
  }
}