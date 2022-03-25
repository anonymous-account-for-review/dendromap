<script>
	import LayoutTreeMap from "./LayoutTreeMap.svelte";
	import { hacTreeMap } from "../treemap";

	export let svgWidth;
	export let svgHeight;
	export let parent;
	export let kLookAhead = 2;
	export let imageHeight = 30;
	export let imageWidth = 30;
	export let imagePadding = 10;

	let currentParentNode = parent;
	$: currentKLookAhead = kLookAhead;

	$: {
		hacTreeMap(
			currentParentNode,
			0,
			0,
			svgWidth,
			svgHeight,
			currentKLookAhead
		);
		currentParentNode = currentParentNode; // reassignment needed for svelte to update objects
	}
</script>

<!-- treemap -->
<g transform="translate(0, 20)">
	<LayoutTreeMap
		on:click={({ detail }) => {
			if (detail.cluster.length > 1) {
				currentParentNode = detail;
			}
		}}
		node={currentParentNode}
		{imageHeight}
		{imageWidth}
		{imagePadding}
		startingDepth={currentParentNode.depth}
		depth={currentKLookAhead}
	/>
</g>

<!-- back button -->
<rect
	class="clickableArea"
	width={svgWidth}
	height={15}
	fill="orange"
	on:click={() => {
		while (currentParentNode.parent !== null) {
			for (let i = 0; i < currentKLookAhead; i++) {
				currentParentNode = currentParentNode.parent;
			}
		}
	}}
/>
