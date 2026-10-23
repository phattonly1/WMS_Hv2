import DocsClientView from "./components/DocsClientView";
import { getAllManualCategories } from "./utils/markdownLoader";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
	const categories = getAllManualCategories();
	return <DocsClientView initialCategories={categories} />;
}
