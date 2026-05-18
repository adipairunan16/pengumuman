const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())
app.get('/api/students', async(req,res)=>{
  const students = await Student.find()
  res.json(students)
})
// CONNECT MONGODB
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'db_kelulusan'
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err))

// SCHEMA
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

// ROOT
app.get('/api', (req,res)=>{
  res.send('Backend hidup')
})

// GET ALL STUDENTS
app.get('/api/students', async(req,res)=>{

  const students = await Student.find()

  res.json(students)
})

// GET BY NISN
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

// LOGIN
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

module.exports = app