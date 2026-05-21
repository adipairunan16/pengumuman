const mongoose = require('mongoose')
const XLSX = require('xlsx')
const jwt = require('jsonwebtoken')

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
// SCHEMA
// ======================

const StudentSchema =
  new mongoose.Schema({

    nisn:String,

    nama:String,

    kelas:String,

    status:String

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

    jwt.verify(
      token,
      JWT_SECRET
    )

    return true

  }catch(err){

    return false
  }
}

// ======================
// PARSE JSON BODY
// ======================

async function parseBody(req){

  return await new Promise(resolve=>{

    let body = ''

    req.on(
      'data',
      chunk=>{
        body += chunk
      }
    )

    req.on(
      'end',
      ()=>{

        try{

          resolve(
            body
              ? JSON.parse(body)
              : {}
          )

        }catch{

          resolve({})
        }
      }
    )
  })
}

// ======================
// API
// ======================

module.exports = async (
  req,
  res
)=>{

try{

await connectDB()

// ======================
// URL
// ======================

const url = new URL(
  req.url,
  `http://${req.headers.host}`
)

const path =
  url.pathname

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

  const ADMIN_USER =
    process.env.ADMIN_USER ||
    'smk'

  const ADMIN_PASS =
    process.env.ADMIN_PASS ||
    '123456'

  if(
    data.username === ADMIN_USER &&
    data.password === ADMIN_PASS
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

    message:
      'Username atau password salah'

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

  if(!verifyToken(req)){

    return res.status(401).json({
      message:'Unauthorized'
    })
  }

  const students =
    await Student.find()

  return res
    .status(200)
    .json(students)
}

// ======================
// GET STUDENT BY NISN
// PUBLIC
// ======================

if(
  req.method === 'GET' &&
  path.startsWith(
    '/api/students/'
  )
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

  if(!verifyToken(req)){

    return res.status(401).json({
      message:'Unauthorized'
    })
  }

  const student =
    new Student({

      nisn:req.body.nisn,

      nama:req.body.nama,

      kelas:req.body.kelas,

      status:req.body.status

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

  if(!verifyToken(req)){

    return res.status(401).json({
      message:'Unauthorized'
    })
  }

  const nisn =
    path.split('/').pop()

  const updated =
    await Student.findOneAndUpdate(

      { nisn },

      {

        nisn:req.body.nisn,

        nama:req.body.nama,

        kelas:req.body.kelas,

        status:req.body.status

      },

      { new:true }

    )

  if(!updated){

    return res.status(404).json({
      message:'Data tidak ditemukan'
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

  if(!verifyToken(req)){

    return res.status(401).json({
      message:'Unauthorized'
    })
  }

  await Student.deleteMany({})

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

  if(!verifyToken(req)){

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

  if(!verifyToken(req)){

    return res.status(401).json({
      message:'Unauthorized'
    })
  }

  const chunks = []

  await new Promise(resolve=>{

    req.on(
      'data',
      chunk=>{
        chunks.push(chunk)
      }
    )

    req.on(
      'end',
      resolve
    )
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

  const filteredStudents =
    students.filter(
      s=>s.nisn && s.nama
    )

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

}catch(err){

return res.status(500).json({

error:err.message

})
}
}