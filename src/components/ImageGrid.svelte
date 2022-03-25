<script>
	import { imagesEndpoint } from "../stores/endPoints";

	export let x;
	export let y;
	export let width;
	export let height;

	export let cluster;
	export let imageWidth;
	export let imageHeight;
	export let imagePadding;

	const array1DIntoGrid = (
		cluster,
		maxNumImagesWidth,
		maxNumImagesHeight
	) => {
		let grid = [];
		let placed = 0;
		outer: for (let i = 0; i < maxNumImagesHeight; i++) {
			let subgrid = [];
			inner: for (let j = 0; j < maxNumImagesWidth; j++) {
				if (placed >= cluster.length) {
					break inner;
				}
				subgrid.push(cluster[placed]);
				placed++;
			}
			grid.push(subgrid);
		}
		return grid;
	};

	$: maxNumImagesWidth = Math.floor(width / imageWidth);
	$: maxNumImagesHeight = Math.floor(height / imageHeight);
	$: grid = array1DIntoGrid(cluster, maxNumImagesWidth, maxNumImagesHeight);
</script>

{#each grid as col, i}
	{#each col as row, j}
		<g
			id={`image-g-${row.index}`}
			transform="translate({imagePadding / 2 +
				x +
				(imageWidth + imagePadding) * j}, {imagePadding / 2 +
				y +
				(imageHeight + imagePadding) * i})"
		>
			<rect
				class="treemapBox{row.label != row.pred ? ' incorrect' : ''}"
				x="0"
				y="0"
				width={imageWidth}
				height={imageHeight}
			/>
			<image
				href={`${$imagesEndpoint}/${row.filename}`}
				x="0"
				y="0"
				width={imageWidth}
				height={imageHeight}
			>
				<title
					>index: {row.index}, label: {row.label}, pred: {row.pred}
					{row.label != row.pred ? " (incorrect)" : ""}</title
				>
			</image>
		</g>
	{/each}
{/each}

<style>
	.treemapBox {
		stroke: rgb(66, 95, 88);
		stroke-width: 4;
		fill: none;
	}
	.incorrect {
		stroke: rgb(236, 65, 59);
	}
	.imageLabel {
		font-size: 9px;
		fill: lightgray;
	}
</style>
