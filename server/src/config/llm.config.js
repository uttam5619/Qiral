import { ChatOpenAI } from "@langchain/openai";


const chatModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
});

export default chatModel

