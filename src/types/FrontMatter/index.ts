import type { Config } from '../Config/index.js';

export type SchemaValue =
	| string
	| { [key: string]: SchemaValue }
	| SchemaValue[];

export interface FrontMatter {
	model: string;
	version?: string;
	snippet?: boolean;
	config?: Config;
	inputs?: Record<string, SchemaValue>;
	outputs?: Record<string, SchemaValue>;
}
