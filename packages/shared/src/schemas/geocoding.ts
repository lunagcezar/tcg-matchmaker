import { z } from 'zod';

export const GeocodeQuerySchema = z.object({
  q: z.string().min(1),
});

export const GeocodeResultSchema = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  type: z.string().optional(),
  importance: z.number().optional(),
});

export const GeocodeResponseSchema = z.array(GeocodeResultSchema);

export type GeocodeQuery = z.infer<typeof GeocodeQuerySchema>;
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
