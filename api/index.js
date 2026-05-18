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

    let body = ''

await new Promise(resolve => {

  req.on('data', chunk => {
    body += chunk
  })

  req.on('end', resolve)
})

req.body = body
  ? JSON.parse(body)
  : {}

  // ======================
// ADD STUDENT
// ======================

if(
  req.method === 'POST' &&
  (
    req.url === '/students' ||
    req.url === '/api/students'
  )
){

  const student = new Student({
    nisn:req.body.nisn,
    nama:req.body.nama,
    kelas:req.body.kelas,
    status:req.body.status
  })

  await student.save()

  return res.status(200).json({
    message:'Data berhasil ditambahkan'
  })
}

// ======================
// UPDATE STUDENT
// ======================

if(
  req.method === 'PUT' &&
  req.url.startsWith('/api/students/')
){

  const id = req.url.split('/').pop()

  await Student.findByIdAndUpdate(
    id,
    {
      nisn:req.body.nisn,
      nama:req.body.nama,
      kelas:req.body.kelas,
      status:req.body.status
    }
  )

  return res.status(200).json({
    message:'Data berhasil diupdate'
  })
}

// ======================
// DELETE STUDENT
// ======================

if(
  req.method === 'DELETE' &&
  req.url.startsWith('/api/students/')
){

  const id = req.url.split('/').pop()

  await Student.findByIdAndDelete(id)

  return res.status(200).json({
    message:'Data berhasil dihapus'
  })
}
// ======================
// LOGIN ADMIN
// ======================

if(
  req.method === 'POST' &&
  (
    req.url === '/login' ||
    req.url === '/api/login'
  )
){

  let body = ''

  await new Promise(resolve => {

    req.on('data', chunk => {
      body += chunk
    })

    req.on('end', resolve)
  })

  const data = JSON.parse(body)

  // USERNAME & PASSWORD
  if(
    data.username === 'admin' &&
    data.password === '123456'
  ){

    return res.status(200).json({
      message:'Login berhasil'
    })
  }

  return res.status(401).json({
    message:'Username atau password salah'
  })
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