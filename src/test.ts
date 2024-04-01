import main from './agentCsv'
import 'dotenv/config'

async function execute(inputObj: any) {
    const inputJson = JSON.stringify(inputObj)
    console.log('INPUT:', inputJson)
    return await main(inputJson)
}

async function test() {
    let getResult = await execute({
        method: 'GET',
        queries: { chatQuery: ["Hi"] },
        secret: { openaiApiKey: process.env.OPENAI_API_KEY },
        headers: {},
    })
    console.log('GET RESULT:', JSON.parse(getResult))

    getResult = await execute({
        method: 'GET',
        queries: { chatQuery: ["Which token should I buy"] },
        secret: { openaiApiKey: process.env.OPENAI_API_KEY },
        headers: {},
    })
    console.log('GET RESULT:', JSON.parse(getResult))

    const postResult = await execute({
        method: 'POST',
        queries: { chatQuery: ["Who are you?"] },
        secret: { openaiApiKey: process.env.OPENAI_API_KEY },
        headers: {},
    })
    console.log('POST RESULT:', JSON.parse(postResult))
}

test().then(() => { }).catch(err => console.error(err)).finally(() => process.exit())
