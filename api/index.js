const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// ======================
// CONNECT MONGODB
// ======================

mongoose.connect(process.env.MONGO_URI, {
  dbName: 'db_kelulusan'
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err))


// ======================
// SCHEMA
// ======================

const StudentSchema = new mongoose.Schema({
  nisn:String,
  nama:String,
  kelas:String,
  status:String
})

const AdminSchema = new mongoose.Schema({
  username:String,
  password:String
})

const Student = mongoose.model(
  'students',
  StudentSchema
)

const Admin = mongoose.model(
  'admin',
  AdminSchema
)


// ======================
// TEST
// ======================

app.get('/', (req,res)=>{
  res.send('Backend hidup')
})


// ======================
// GET ALL STUDENTS
// ======================

app.get('/api/students', async(req,res)=>{

  const students = await Student.find()

  res.json(students)
})


// ======================
// GET STUDENT BY NISN
// ======================

app.get('/api/students/:nisn', async(req,res)=>{

  const student = await Student.findOne({
    nisn:req.params.nisn
  })

  if(!student){

    return res.status(404).json({
      message:'Data tidak ditemukan'
    })
  }

  res.json(student)
})


// ======================
// ADD STUDENT
// ======================

app.post('/api/students', async(req,res)=>{

  const student = new Student(req.body)

  await student.save()

  res.json({
    message:'Data berhasil ditambahkan'
  })
})


// ======================
// UPDATE STUDENT
// ======================

app.put('/api/students/:id', async(req,res)=>{

  await Student.findByIdAndUpdate(
    req.params.id,
    req.body
  )

  res.json({
    message:'Data berhasil diupdate'
  })
})


// ======================
// DELETE STUDENT
// ======================

app.delete('/api/students/:id', async(req,res)=>{

  await Student.findByIdAndDelete(
    req.params.id
  )

  res.json({
    message:'Data berhasil dihapus'
  })
})


// ======================
// LOGIN ADMIN
// ======================

app.post('/api/login', async(req,res)=>{

  const {username,password} = req.body

  const admin = await Admin.findOne({
    username,
    password
  })

  if(!admin){

    return res.status(401).json({
      message:'Username atau password salah'
    })
  }

  res.json({
    message:'Login berhasil'
  })
})


// ======================
// AI
// ======================

app.post('/api/ai', async(req,res)=>{

  res.json({
    response:'Halo, saya AI Cintaku ❤️'
  })
})

module.exports = app