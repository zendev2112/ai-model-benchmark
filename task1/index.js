const express = require('express')
const app = express()
app.use(express.json())

app.post('/webhook', async (req, res) => {
  if (req.headers['x-secret'] !== process.env.SECRET) return res.sendStatus(401)
  try {
    const r = await fetch(`https://jsonplaceholder.typicode.com/posts/${req.body.id}`)
    if (!r.ok) return res.sendStatus(502)
    const { title, body } = await r.json()
    res.json({ title, body })
  } catch { res.sendStatus(502) }
})

app.listen(3000, () => console.log('running'))
