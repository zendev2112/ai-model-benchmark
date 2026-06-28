# Benchmark: Three AI models on three JavaScript backend tasks

## Introduction

This is my first benchmark. I tested three AI coding models on three backend tasks using JavaScript, the language I'm most familiar with. The benchmark measures how many attempts each model requires to produce working code. Each model receives identical prompts and passes the same deterministic tests. The measurement unit is turns: iterations from prompt to passing test.

## Methodology

Three models were evaluated on three backend coding tasks. Each model received the same prompt. Each task had a deterministic pass/fail test. Turns to pass were recorded.

Models tested:
- Claude Haiku 4.5 (via Claude Code)
- DeepSeek V4 Flash Free (via OpenCode)
- Zhipu GLM-5 (via Kiro CLI)

## Tasks

**Task 1: Express POST endpoint**
- Requirement: Validate `x-secret` header against SECRET env var. Return 401 if missing or invalid. Fetch post from https://jsonplaceholder.typicode.com/posts/:id. Return { title, body } as JSON.
- Test: curl with missing header (expect 401), curl with wrong header (expect 401), curl with valid header and id=1 (expect JSON response).
- Result: PASS

**Task 2: Fix race condition**
- Requirement: Script throws `ENOENT: no such file or directory` on readFileSync. Root cause: fetchAndSave() does not return Promise. Await does not wait. Fix.
- Test: `node fetch-and-save.js` produces JSON output with userId, id, title, body.
- Result: PASS

**Task 3: Exponential backoff with jitter**
- Requirement: Add to existing withRetry function. Base delay 200ms. Delay doubles per retry. Max delay 8000ms. Jitter ±20% of calculated delay. Preserve function signature.
- Test: Run function with failures on attempts 1-3, success on 4. Measure delays. Verify: attempt 1→2 ~200ms, attempt 2→3 ~400ms, attempt 3→4 ~800ms, with ±20% variance.
- Result: PASS

## Results

| Model | Task 1 | Task 2 | Task 3 | Average |
|-------|--------|--------|--------|---------|
| Claude Haiku 4.5 | 2 | 1 | 1 | 1.3 |
| DeepSeek V4 Flash Free | 1 | 1 | 2 | 1.3 |
| Zhipu GLM-5 | 1 | 1 | 1 | 1.0 |

Turn 1 failures:
- Claude Haiku 4.5, Task 1: Used `require('node-fetch')`. Node-fetch 3.3.2 is ESM-only. Throws `TypeError: fetch is not a function`. Fixed on Turn 2 by using native fetch.
- DeepSeek V4 Flash Free, Task 3: Implementation passed test. Turn 2 refined jitter formula for mathematical precision. Both implementations passed.
- Zhipu GLM-5: All tasks passed Turn 1.

## Reproduction

### Task 1

```bash
mkdir task1 && cd task1
npm init -y && npm install express
```

Prompt:
> Build an Express POST /webhook endpoint in index.js. Validate an x-secret header against a SECRET env var — return 401 if missing or wrong. If valid, fetch the post matching the id from the request body from https://jsonplaceholder.typicode.com/posts/:id and return its title and body as JSON. Return 502 if the fetch fails.

Test:
```bash
SECRET=abc node index.js &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" -d '{"id":1}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" -H "x-secret: wrong" -d '{"id":1}'
curl -s -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" -H "x-secret: abc" -d '{"id":1}'
kill %1
```

Expected output:
```
401
401
{"title":"...","body":"..."}
```

### Task 2

```bash
mkdir task2 && cd task2
cat > fetch-and-save.js << 'EOF'
const https = require('https')
const fs = require('fs')

function fetchAndSave(url, filename) {
  https.get(url, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', async () => {
      const parsed = JSON.parse(data)
      await fs.promises.writeFile(filename, JSON.stringify(parsed, null, 2))
    })
  })
}

async function main() {
  await fetchAndSave('https://jsonplaceholder.typicode.com/posts/1', 'out.json')
  const content = fs.readFileSync('out.json', 'utf8')
  console.log(content)
}

main()
EOF
```

Prompt:
> This script throws ENOENT: no such file or directory on the readFileSync line. Fix it.

Test:
```bash
node fetch-and-save.js
```

Expected output: JSON object with userId, id, title, body fields.

### Task 3

```bash
mkdir task3 && cd task3
cat > retry.js << 'EOF'
async function withRetry(fn, maxRetries = 3) {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) throw err
    }
  }
}

module.exports = { withRetry }
EOF
```

Prompt:
> Add exponential backoff with jitter to withRetry. Base delay 200ms, doubles each retry, max delay 8000ms, jitter ±20% of the calculated delay. Keep the existing function signature.

Test:
```bash
node -e "
const { withRetry } = require('./retry')
let attempt = 0
const start = Date.now()
withRetry(async () => {
  attempt++
  console.log('attempt', attempt, 'at', Date.now() - start, 'ms')
  if (attempt < 4) throw new Error('fail')
  return 'ok'
}, 5).then(r => console.log('result:', r))
"
```

Expected: Delays approximately 200ms, 400ms, 800ms with ±20% variance. Final output: "result: ok".

## Conclusion

Claude Haiku 4.5 and DeepSeek V4 Flash Free both averaged 1.3 turns. Zhipu GLM-5 averaged 1.0 turns, with all tasks passing on first attempt.

Claude Haiku 4.5 failed Task 1 Turn 1 due to library version incompatibility (ESM-only import). DeepSeek V4 Flash Free produced working code on Task 3 Turn 1; Turn 2 refined the implementation for mathematical precision.

All three models produced passing code across all tasks. The difference in turns to pass reflects how each model handles initial failures, not fundamental pass/fail capability.

## Data

Raw results: `benchmark-results.csv`

All task code and test scripts are version-controlled and reproducible.
