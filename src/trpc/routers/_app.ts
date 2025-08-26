import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
    // Example protected procedure
    createAi: baseProcedure
        .input(
            z.object({
                text: z.string(),
            })
        )
        .query((opts) => {
            return {
                greeting: `Hello ${opts.input.text}`,
            };
        }),
});

export type AppRouter = typeof appRouter;