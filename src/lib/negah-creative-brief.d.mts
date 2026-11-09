export type CreativeBriefInput = { project:string; format:string; audience:string; message:string; style:string; brandColors?:string; requiredElements?:string; avoid?:string };
export function validateCreativeBrief(input: unknown): { valid:boolean; error?:string };
export function buildCreativeBrief(input: CreativeBriefInput): string;
