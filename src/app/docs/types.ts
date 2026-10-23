export interface ManualItem {
	id: string;
	title: string;
	subtitle?: string | undefined;
	tags?: string[] | undefined;
	badge?: string | undefined;
	summary?: string | undefined;
	content: string;
	order?: number | undefined;
}

export interface ManualCategory {
	id: string;
	name: string;
	iconName: string;
	description?: string | undefined;
	order?: number | undefined;
	items: ManualItem[];
}
