<script>
	import EmbeddingGrid2D from "./EmbeddingGrid2D.svelte";
	import {
		globalLeafNodesObject,
		incorrectColor,
	} from "../../stores/globalDataStore";
	import { currentClassFilter } from "../../stores/sidebarStore";

	/**
	 * Takes in the data and filters by class
	 * @param {any[]} data
	 */
	function filterData(data, className) {
		if (className === null) {
			// className not specified
			return data;
		} else {
			const filtered = data.filter((item) => {
				const shouldKeep = item.true_class === className;
				return shouldKeep;
			});
			return filtered;
		}
	}

	$: data = filterData($globalLeafNodesObject.array, $currentClassFilter);
</script>

{#if $globalLeafNodesObject.array.length > 0}
	<div>
		<EmbeddingGrid2D {data} borderColor={incorrectColor} />
	</div>
{/if}
