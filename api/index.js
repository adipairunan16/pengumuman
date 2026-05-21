const mongoose = require('mongoose')
const XLSX = require('xlsx')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'super-rahasia-123'


// ======================
// CONNECT DB
// ======================

let isConnected = false

async function connectDB(){

  if(isConnected){
    return
  }

  await mongoose.connect(
    process.env.MONGO_URI
  )

  isConnected = true

  console.log('MongoDB Connected')
}


// ======================
// ADMIN SCHEMA
// ======================

const AdminSchema =
  new mongoose.Schema({

    username:{
      type:String,
      unique:true
    },

    password:String,

    school:String

  })

const Admin =
  mongoose.models.admins ||

  mongoose.model(
    'admins',
    AdminSchema
  )


// ======================
// STUDENT SCHEMA
// ======================

const StudentSchema =
  new mongoose.Schema({

    nisn:String,

    nama:String,

    kelas:String,

    status:String,

    school:String

  })

const Student =
  mongoose.models.students ||

  mongoose.model(
    'students',
    StudentSchema
  )


// ======================
// VERIFY TOKEN
// ======================

function verifyToken(req){

  const authHeader =
    req.headers.authorization

  if(!authHeader){
    return null
  }

  const token =
    authHeader.replace(
      'Bearer ',
      ''
    )

  try{

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      )

    return decoded

  }catch(err){

    return null
  }
}


// ======================
// PARSE JSON BODY
// ======================

async function parseBody(req){

  return new Promise(resolve => {

    let body = ''

    req.on('data', chunk => {
      body += chunk
    })

    req.on('end', () => {

      try{

        const parsed =
          body
            ? JSON.parse(body)
            : {}

        resolve(parsed)

      }catch(err){

        resolve({})
      }
    })
  })
}


// ======================
// API
// ======================

module.exports = async (req, res) => {

  try {

    await connectDB()

    const url = new URL(
      req.url,
      `http://${req.headers.host}`
    )

    const path = url.pathname


    // ======================
    // PARSE BODY
    // ======================

    if(
      req.method !== 'GET' &&
      path !== '/api/upload-excel'
    ){

      req.body =
        await parseBody(req)

    }else{

      req.body = {}
    }


    // ======================
    // TEST API
    // ======================

    if(path === '/api'){

      return res
        .status(200)
        .send('API hidup')
    }


    // ======================
    // REGISTER ADMIN
    // ======================

    if(
      req.method === 'POST' &&
      path === '/api/register'
    ){

      const {

        username,

        password,

        school

      } = req.body

      if(
        !username ||
        !password ||
        !school
      ){

        return res.status(400).json({

          message:
            'Semua field wajib diisi'

        })
      }

      const existingAdmin =
        await Admin.findOne({
          username
        })

      if(existingAdmin){

        return res.status(400).json({

          message:
            'Username sudah digunakan'

        })
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        )

      const admin =
        new Admin({

          username,

          password:hashedPassword,

          school

        })

      await admin.save()

      return res.status(200).json({

        message:
          'Admin berhasil dibuat'

      })
    }


    // ======================
    // LOGIN ADMIN
    // ======================

    if(
      req.method === 'POST' &&
      (
        path === '/login' ||
        path === '/api/login'
      )
    ){

      const data = req.body

      const admin =
        await Admin.findOne({
          username:data.username
        })

      if(!admin){

        return res.status(401).json({

          message:
            'Username atau password salah'

        })
      }

      const validPassword =
        await bcrypt.compare(
          data.password,
          admin.password
        )

      if(!validPassword){

        return res.status(401).json({

          message:
            'Username atau password salah'

        })
      }

      const token =
        jwt.sign(

          {

            adminId:admin._id,

            school:admin.school

          },

          JWT_SECRET,

          {
            expiresIn:'1d'
          }

        )

      return res.status(200).json({

        token,

        school:admin.school,

        username:admin.username,

        message:'Login berhasil'

      })
    }


    // ======================
    // GET ALL STUDENTS
    // ======================

    if(
      req.method === 'GET' &&
      (
        path === '/students' ||
        path === '/api/students'
      )
    ){

      const user =
        verifyToken(req)

      if(!user){

        return res.status(401).json({

          message:'Unauthorized'

        })
      }

      const students =
        await Student.find({

          school:user.school

        })

      return res
        .status(200)
        .json(students)
    }


    // ======================
    // GET STUDENT BY NISN
    // ======================

    if(
      req.method === 'GET' &&
      path.startsWith(
        '/api/students/'
      )
    ){

      const nisn =
        path.split('/').pop()

      const school =
        url.searchParams.get(
          'school'
        )

      const student =
        await Student.findOne({

          nisn,

          school

        })

      if(!student){

        return res.status(404).json({

          message:
            'Data tidak ditemukan'

        })
      }

      return res
        .status(200)
        .json(student)
    }


    // ======================
    // ADD STUDENT
    // ======================

    if(
      req.method === 'POST' &&
      (
        path === '/students' ||
        path === '/api/students'
      )
    ){

      const user =
        verifyToken(req)

      if(!user){

        return res.status(401).json({

          message:'Unauthorized'

        })
      }

      const existingStudent =
        await Student.findOne({

          nisn:req.body.nisn,

          school:user.school

        })

      if(existingStudent){

        return res.status(400).json({

          message:
            'NISN sudah ada'

        })
      }

      const student =
        new Student({

          nisn:req.body.nisn,

          nama:req.body.nama,

          kelas:req.body.kelas,

          status:req.body.status,

          school:user.school

        })

      await student.save()

      return res.status(200).json({

        message:
          'Data berhasil ditambahkan'

      })
    }


    // ======================
    // UPDATE STUDENT
    // ======================

    if(
      req.method === 'PUT' &&
      path.startsWith(
        '/api/students/'
      )
    ){

      const user =
        verifyToken(req)

      if(!user){

        return res.status(401).json({

          message:'Unauthorized'

        })
      }

      const nisn =
        path.split('/').pop()

      const updated =
        await Student.findOneAndUpdate(

          {

            nisn,

            school:user.school

          },

          {

            nisn:req.body.nisn,

            nama:req.body.nama,

            kelas:req.body.kelas,

            status:req.body.status

          },

          {
            new:true
          }

        )

      if(!updated){

        return res.status(404).json({

          message:
            'Data tidak ditemukan'

        })
      }

      return res.status(200).json({

        message:
          'Data berhasil diupdate'

      })
    }


    // ======================
    // DELETE ALL STUDENTS
    // ======================

    if(
      req.method === 'DELETE' &&
      path === '/api/students/all'
    ){

      const user =
        verifyToken(req)

      if(!user){

        return res.status(401).json({

          message:'Unauthorized'

        })
      }

      await Student.deleteMany({

        school:user.school

      })

      return res.status(200).json({

        message:
          'Semua data berhasil dihapus'

      })
    }


    // ======================
    // DELETE STUDENT
    // ======================

    if(
      req.method === 'DELETE' &&
      path.startsWith(
        '/api/students/'
      )
    ){

      const user =
        verifyToken(req)

      if(!user){

        return res.status(401).json({

          message:'Unauthorized'

        })
      }

      const nisn =
        path.split('/').pop()

      const deleted =
        await Student.findOneAndDelete({

          nisn,

          school:user.school

        })

      if(!deleted){

        return res.status(404).json({

          message:
            'Data tidak ditemukan'

        })
      }

      return res.status(200).json({

        message:
          'Data berhasil dihapus'

      })
    }


    // ======================
    // UPLOAD EXCEL
    // ======================

    if(
      req.method === 'POST' &&
      path === '/api/upload-excel'
    ){

      const user =
        verifyToken(req)

      if(!user){

        return res.status(401).json({

          message:'Unauthorized'

        })
      }

      const chunks = []

      await new Promise(resolve => {

        req.on('data', chunk => {

          chunks.push(chunk)

        })

        req.on('end', resolve)
      })

      const buffer =
        Buffer.concat(chunks)

      const start =
        buffer.indexOf(
          Buffer.from('PK')
        )

      if(start === -1){

        return res.status(400).json({

          message:
            'File excel tidak valid'

        })
      }

      const excelBuffer =
        buffer.slice(start)

      const workbook =
        XLSX.read(
          excelBuffer,
          {
            type:'buffer'
          }
        )

      const sheetName =
        workbook.SheetNames[0]

      const sheet =
        workbook.Sheets[sheetName]

      const data =
        XLSX.utils.sheet_to_json(
          sheet
        )

      const students =
        data.map(item => ({

          nisn:String(
            item.nisn ||
            item.NISN ||
            ''
          ).trim(),

          nama:String(
            item.nama ||
            item.Nama ||
            ''
          ).trim(),

          kelas:String(
            item.kelas ||
            item.Kelas ||
            ''
          ).trim(),

          status:String(
            item.status ||
            item.Status ||
            ''
          ).trim(),

          school:user.school

        }))

      const filteredStudents =
        students.filter(

          s => s.nisn && s.nama

        )

      if(
        filteredStudents.length === 0
      ){

        return res.status(400).json({

          message:
            'Data excel kosong'

        })
      }

      await Student.insertMany(
        filteredStudents
      )

      return res.status(200).json({

        message:
          'Data excel berhasil diupload'

      })
    }


    // ======================
    // NOT FOUND
    // ======================

    return res.status(404).json({

      message:'Route tidak ditemukan'

    })

  } catch(err){

    console.log(err)

    return res.status(500).json({

      error:err.message

    })
  }
}