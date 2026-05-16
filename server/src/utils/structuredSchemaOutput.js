import {z} from "zod"

export const queryClassificationSchema = z
  .object({
    steps: z
      .array(
        z.object({
          type: z.enum(["DDL", "DML", "DQL", "DCL", "TCL", "NONE"]),
          query: z.string().min(1),
        })
      )
      .nonempty(),
  })
  .strict();