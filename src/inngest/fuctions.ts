
import { createAgent, gemini } from '@inngest/agent-kit';

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event }) => {
        const codeAgent = createAgent({
            name: 'code-agent',
            system: 'You are an expert next.js developer. You write readable and maintainable next.js code. You write simple next.js and react snippets.',
            model: gemini({ model: 'gemini-1.5-flash-8b' }),
        });

        const { output } = await codeAgent.run(
            `Write the following snippet: ${event.data.value}`,
        );

        return { output };
    },
);


