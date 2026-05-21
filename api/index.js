const mongoose = require('mongoose')
const XLSX = require('xlsx')
const jwt = require('jsonwebtoken')

// ======================
// ENV
// ======================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'super-rahasia-123'

const ADMIN_USER =
  process.env.ADMIN_USER ||
  'smk'

const ADMIN_PASS =
  process.env.ADMIN_PASS ||
  '123456'

// ======================
// CONNECT MONGODB
// ======================

let isConnected = false

async function connectDB(){

  if(isConnected){
    return
  }

  await mongoose.connect(
    process.env.MONGO_URI,
    {
      dbName:'CBT'
    }
  )

  isConnected = true

  console.log('MongoDB Connected')
}

// ======================
// SCHEMA
// ======================

const StudentSchema =
  new mongoose.Schema({

    nisn:{
      type:String,
      required:true,
      unique:true
    },

    nama:{
      type:String,
      required:true
    },

    kelas:{
      type:String,
      required:true
    },

    status:{
      type:String,
      required:true
    }

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
    return false
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

    return false
  }
}

// ======================
// PARSE JSON BODY
// ======================

async function parseBody(req){

  return new Promise((resolve,reject)=>{

    let body = ''

    req.on('data', chunk => {
      body += chunk
    })

    req.on('end', ()=>{

      try{

        resolve(
          body
            ? JSON.parse(body)
            : {}
        )

      }catch(err){

        reject(err)
      }
    })
  })
}

// ======================
// API HANDLER
// ======================

module.exports = async (req,res)=>{

  try{

    // ======================
    // CORS
    // ======================

    res.setHeader(
      'Access-Control-Allow-Origin',
      '*'
    )

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    )

    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )

    if(req.method === 'OPTIONS'){
      return res.status(200).end()
    }

    // ======================
    // CONNECT DB
    // ======================

    await connectDB()

    // ======================
    // URL
    // ======================

    const url = new URL(
      req.url,
      `http://${req.headers.host}`
    )

    const path = url.pathname

    // ======================
    // TEST API
    // ======================

    if(path === '/api'){

      return res.status(200).json({
        message:'API hidup'
      })
    }

    // ======================
    // LOGIN ADMIN
    // ======================

    if(
      req.method === 'POST' &&
      path === '/api/login'
    ){

      const body =
        await parseBody(req)

      if(
        body.username === ADMIN_USER &&
        body.password === ADMIN_PASS
      ){

        const token =
          jwt.sign(
            {
              role:'admin'
            },
            JWT_SECRET,
            {
              expiresIn:'1d'
            }
          )

        return res.status(200).json({
          token,
          message:'Login berhasil'
        })
      }

      return res.status(401).json({
        message:'Username atau password salah'
      })
    }

    // ======================
    // GET ALL STUDENTS
    // ADMIN ONLY
    // ======================

    if(
      req.method === 'GET' &&
      path === '/api/students'
    ){

      const auth =
        verifyToken(req)

      if(!auth){

        return res.status(401).json({
          message:'Unauthorized'
        })
      }

      const students =
        await Student.find()

      return res.status(200).json(
        students
      )
    }

    // ======================
    // GET STUDENT BY NISN
    // PUBLIC
    // ======================

    if(
      req.method === 'GET' &&
      path.startsWith('/api/students/')
    ){

      const nisn =
        path.split('/').pop()

      const student =
        await Student.findOne({
          nisn
        })

      if(!student){

        return res.status(404).json({
          message:'Data tidak ditemukan'
        })
      }

      return res.status(200).json(
        student
      )
    }

    // ======================
    // ADD STUDENT
    // ADMIN ONLY
    // ======================

    if(
      req.method === 'POST' &&
      path === '/api/students'
    ){

      const auth =
        verifyToken(req)

      if(!auth){

        return res.status(401).json({
          message:'Unauthorized'
        })
      }

      const body =
        await parseBody(req)

      const exists =
        await Student.findOne({
          nisn:body.nisn
        })

      if(exists){

        return res.status(400).json({
          message:'NISN sudah ada'
        })
      }

      const student =
        new Student({

          nisn:body.nisn,
          nama:body.nama,
          kelas:body.kelas,
          status:body.status

        })

      await student.save()

      return res.status(200).json({
        message:'Data berhasil ditambahkan'
      })
    }

    // ======================
    // UPDATE STUDENT
    // ADMIN ONLY
    // ======================

    if(
      req.method === 'PUT' &&
      path.startsWith('/api/students/')
    ){

      const auth =
        verifyToken(req)

      if(!auth){

        return res.status(401).json({
          message:'Unauthorized'
        })
      }

      const body =
        await parseBody(req)

      const nisn =
        path.split('/').pop()

      const updated =
        await Student.findOneAndUpdate(

          {
            nisn
          },

          {
            nisn:body.nisn,
            nama:body.nama,
            kelas:body.kelas,
            status:body.status
          },

          {
            new:true
          }
        )

      if(!updated){

        return res.status(404).json({
          message:'Data tidak ditemukan'
        })
      }

      return res.status(200).json({
        message:'Data berhasil diupdate'
      })
    }

    // ======================
    // DELETE STUDENT
    // ADMIN ONLY
    // ======================

    if(
      req.method === 'DELETE' &&
      path.startsWith('/api/students/')
    ){

      const auth =
        verifyToken(req)

      if(!auth){

        return res.status(401).json({
          message:'Unauthorized'
        })
      }

      const nisn =
        path.split('/').pop()

      const deleted =
        await Student.findOneAndDelete({
          nisn
        })

      if(!deleted){

        return res.status(404).json({
          message:'Data tidak ditemukan'
        })
      }

      return res.status(200).json({
        message:'Data berhasil dihapus'
      })
    }

    // ======================
    // DELETE ALL STUDENTS
    // ADMIN ONLY
    // ======================

    if(
      req.method === 'DELETE' &&
      path === '/api/students/all'
    ){

      const auth =
        verifyToken(req)

      if(!auth){

        return res.status(401).json({
          message:'Unauthorized'
        })
      }

      await Student.deleteMany({})

      return res.status(200).json({
        message:'Semua data berhasil dihapus'
      })
    }

    // ======================
    // UPLOAD EXCEL
    // ADMIN ONLY
    // ======================

    if(
      req.method === 'POST' &&
      path === '/api/upload-excel'
    ){

      const auth =
        verifyToken(req)

      if(!auth){

        return res.status(401).json({
          message:'Unauthorized'
        })
      }

      const chunks = []

      await new Promise(resolve=>{

        req.on('data', chunk=>{
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
          message:'File excel tidak valid'
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
        XLSX.utils.sheet_to_json(sheet)

      const students =
        data.map(item=>({

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
          ).trim()

        }))

      const filtered =
        students.filter(
          s => s.nisn && s.nama
        )

      for(const student of filtered){

        await Student.updateOne(

          {
            nisn:student.nisn
          },

          {
            $set:student
          },

          {
            upsert:true
          }
        )
      }

      return res.status(200).json({
        message:'Upload excel berhasil'
      })
    }

    // ======================
    // ROUTE NOT FOUND
    // ======================

    return res.status(404).json({
      message:'Route tidak ditemukan'
    })

  }catch(err){

    console.error(err)

    return res.status(500).json({
      error:err.message
    })
  }
}