import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import userRoutes from './routes/users.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)

app.get('/', (req, res) => res.send('secarikkertas API jalan ✅ (PostgreSQL)'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`))
