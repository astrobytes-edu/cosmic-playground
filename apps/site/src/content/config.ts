import { defineCollection, z } from "astro:content";

const demos = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    status: z.enum(["stable", "beta", "draft"]),
    content_verified: z.boolean().default(false),
    levels: z.array(z.enum(["ASTR101", "ASTR201", "Both"])).min(1),
    topics: z
      .array(
        z.enum([
          "EarthSky",
          "LightSpectra",
          "Telescopes",
          "Orbits",
          "Stars",
          "Galaxies",
          "Cosmology",
          "DataInference"
        ])
      )
      .min(1),
    time_minutes: z.number().int().positive(),
    has_math_mode: z.boolean(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    readiness: z.enum(["stub", "experimental", "candidate", "launch-ready"]).optional(),
    readinessReason: z.string().min(1).optional(),
    parityAuditPath: z.string().min(1).optional(),
    lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    learning_goals: z.array(z.string().min(1)).min(1),
    misconceptions: z.array(z.string().min(1)).min(1),
    predict_prompt: z.string().min(1),
    play_steps: z.array(z.string().min(1)).min(1),
    station_params: z
      .array(
        z.object({
          parameter: z.string().min(1),
          value: z.string().min(1),
          notice: z.string().min(1)
        })
      )
      .optional(),
    explain_prompt: z.string().min(1),
    model_notes: z.array(z.string().min(1)).min(1),
    demo_path: z.string().min(1),
    station_path: z.string().min(1),
    instructor_path: z.string().min(1),
    last_updated: z.string().min(1)
  })
});

const stations = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    demo_slug: z.string().min(1),
    last_updated: z.string().min(1),
    has_math: z.boolean().optional()
  })
});

const instructor = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    bundle: z.string().min(1),
    section: z.enum(["index", "activities", "assessment", "model", "backlog"]),
    demo_slug: z.string().min(1).optional(),
    last_updated: z.string().min(1),
    has_math: z.boolean().optional()
  })
});

const hubs = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    bundle: z.string().min(1),
    last_updated: z.string().min(1),
    has_math: z.boolean().optional()
  })
});

const playlists = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    audience: z.string().min(1),
    estimated_minutes: z.number().int().positive(),
    demos: z
      .array(
        z.object({
          slug: z.string().min(1),
          required: z.boolean(),
          note: z.string().optional()
        })
      )
      .min(1),
    overview: z.string().min(1),
    instructions: z.string().min(1)
  })
});

export const collections = { demos, stations, instructor, hubs, playlists };
