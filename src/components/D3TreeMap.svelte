<script>
	import { imagesEndpoint } from "../stores/endPoints";
	import * as d3 from "d3-hierarchy";

	export let svgWidth;
	export let svgHeight;

	export let root;
	let treeLeaves;
	$: {
		d3.treemap().size([svgWidth, svgHeight]).padding(1)(root);
		treeLeaves = root.leaves();
	}
</script>

<svg id="tree" width={svgWidth} height={svgHeight}>
	{#if treeLeaves !== undefined}
		{#each treeLeaves as leaf}
			<g transform="translate({leaf.x0}, {leaf.y0})">
				<rect
					class="treemapBox{leaf.data.true_class !=
					leaf.data.predicted_class
						? ' incorrect'
						: ''}"
					x="0"
					y="0"
					width={leaf.x1 - leaf.x0}
					height={leaf.y1 - leaf.y0}
				/>
				<image
					href={`${$imagesEndpoint}/${leaf.data.filename}`}
					x="3"
					y="10"
					width={32}
					height={32}
				>
					<title
						>index: {leaf.data.instance_index}, true class: {leaf
							.data.true_class}, predicted class: {leaf.data
							.predicted_class}</title
					>
				</image>
				<text class="imageLabel" x="3" y="8">
					{leaf.data.true_class}{leaf.data.true_class !=
					leaf.data.predicted_class
						? `,${leaf.data.predicted_class}`
						: ""}
				</text>
			</g>
		{/each}
	{/if}
</svg>

<style>
	.treemapBox {
		stroke: darkgray;
		stroke-width: 0;
		fill: rgb(134, 153, 168);
	}
	.incorrect {
		fill: rgb(177, 70, 43);
	}
	.imageLabel {
		font-size: 9px;
		fill: lightgray;
	}
</style>
