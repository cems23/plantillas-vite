exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    }
  }

  const { text, targetLang } = JSON.parse(event.body)
  const apiKey = process.env.DEEPL_API_KEY

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': 'DeepL-Auth-Key ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: [text], target_lang: targetLang }),
  })

  const data = await res.json()
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data),
  }
}
