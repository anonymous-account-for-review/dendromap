<script>
	import KLookAheadTreeMap from "./KLookAheadTreeMap.svelte";
	import D3TreeMap from "./D3TreeMap.svelte";
	import OurTreemap from "./treemap/OurTreemap.svelte";
	import { totalHeight } from "../stores/sidebarStore";

	export let hierarchicalData;
	export let width;
	export let height;
	export let imageWidth = 30;
	export let imageHeight = 30;
	export let imagePadding;

	export let treemapType;
	export let kLookAhead = 2;
</script>

{#if treemapType == "binary"}
	<svg {width} {height}>
		<KLookAheadTreeMap
			parent={hierarchicalData}
			svgHeight={height}
			svgWidth={width}
			{kLookAhead}
			{imageHeight}
			{imageWidth}
			{imagePadding}
		/>
	</svg>
{:else if treemapType == "d3-default"}
	<svg {width} {height}>
		<D3TreeMap
			root={hierarchicalData}
			svgHeight={height}
			svgWidth={width}
		/>
	</svg>
{:else if treemapType === "treemap"}
	<OurTreemap width={1200} height={$totalHeight} />
{/if}

<style>
	svg {
		border: 1px solid black;
	}
</style>
