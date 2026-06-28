const https = require('https')
const fs = require('fs')
const path = require('path')

function fetchAndSave(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', async () => {
        try {
          const parsed = JSON.parse(data)
          await fs.promises.writeFile(filename, JSON.stringify(parsed, null, 2))
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    }).on('error', reject)
  })
}

async function main() {
  const filePath = path.join(__dirname, 'out.json')
  await fetchAndSave('https://jsonplaceholder.typicode.com/posts/1', filePath)
  const content = fs.readFileSync(filePath, 'utf8')
  console.log(content)
}

main().catch(console.error)
