import { Request, Response, route } from './httpSupport'
import { renderHtml } from './uiSupport'

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate, FewShotPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

import * as csv from "csvtojson";

async function readTweetsFromCsv(filepath: string) {
    const contents = await csv.default().fromFile(filepath);

    for (let i = 0; i < contents.length; i++) {
        if (contents[i].Content === undefined) {
            console.log(`Broken record in ${contents[i].Date}`)
        }
    }

    return contents;
}

async function langChainPipe(openaiApiKey: string, query: string): Promise<string> {
    const examples = await readTweetsFromCsv("res/justinsuntron.csv");
    const examplePrompt = new PromptTemplate({
        inputVariables: ["Content"],
        template: `<tweet>: {Content}`
    });

    const prefixTemplate = `
From now on you will act as an impersonator. You will role-play {identity} based on the tweets from him/her. Never leak the fact that you are an AI assistant.
Perform the following actions:
1 - Learn who you are and your personality from the provided tweets.
2 - Learn the other facts from the provided tweets, and remember your attitudes and comments on them.
3 - Infer the tone of voice from the given tweets.
4 - If you have commented the topic, use your historical response, otherwise answer user using the same tone of voice inferred before, and ensure they are consistent with your personality. Shorter answers are preferred.`;
    const suffixTemplate = `User: {query}
    Answer:`;

    const prefixPrompt = new PromptTemplate({
        inputVariables: ["identity"],
        template: prefixTemplate
    });

    const fewShotPromptTemplate = new FewShotPromptTemplate({
        examples: examples.slice(0, 100),
        examplePrompt: examplePrompt,
        prefix: await prefixPrompt.format({ identity: "Justin Sun" }),
        suffix: suffixTemplate,
        inputVariables: ["query"]
    });

    console.log(await fewShotPromptTemplate.format({ query: query }));

    const model = new ChatOpenAI({ temperature: 0.8, openAIApiKey: openaiApiKey });
    const outputParser = new StringOutputParser();

    const chain = fewShotPromptTemplate.pipe(model).pipe(outputParser);

    return chain.invoke({
        query: query
    });
}

async function GET(req: Request): Promise<Response> {
    const openaiApiKey = req.secret?.openaiApiKey as string;
    const query = req.queries.chatQuery[0] as string;

    const content = await langChainPipe(openaiApiKey, query);
    return new Response(renderHtml(content));
}

async function POST(req: Request): Promise<Response> {
    const openaiApiKey = req.secret?.openaiApiKey as string;
    const query = req.queries.chatQuery[0] as string;

    const content = await langChainPipe(openaiApiKey, query);
    return new Response(renderHtml(content));
}

export default async function main(request: string) {
    return await route({ GET, POST }, request);
}
