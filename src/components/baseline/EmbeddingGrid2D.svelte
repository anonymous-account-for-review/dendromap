<script>
	import { imagesEndpoint } from "../../stores/endPoints";
	import { gridLapJV } from "./wrapper";
	import { computeScales, create_grids, findKClosest } from "./util";
	import {
		zoomedOutGridDimensions,
		zoomedInGridDimensions,
		showMisclassifications,
		showAsGrid,
		currentNodesShowing,
		selectedImage,
		highlightSimilarImages,
		maxGrids,
		isZoomedIn as globalIsZoomedIn,
		totalHeight,
		updateZoomDimensions,
		highlightIncorrectImages,
	} from "../../stores/sidebarStore";
	import { highlightImages, resetOpacity } from "../treemap/highlightImages";
	import { group } from "d3";

	export let space = 20;
	export let width = $totalHeight - space;
	export let height = width;
	export let data = [];
	export let borderColor;

	function computeGrids(
		data,
		width,
		height,
		dim,
		embeddingsGetter = (d) => d.features2D
	) {
		const actEmbeddings = data.map((d) => embeddingsGetter(d));
		let [grids, flattened] = create_grids(width, height, dim, dim);
		const gridPoints = flattened.map((grid) => scale2D(grid.point));
		const assignments = gridLapJV(gridPoints, actEmbeddings);
		flattened.forEach((grid, i) => {
			grid["assigned"] = data[assignments[i]];
		});
		return [grids, flattened];
	}
	// on click events
	function setOriginalDataState() {
		grids = originalGrids;
		flattened = originalFlattened;
		xScale = zoomedOutXScale;
		yScale = zoomedOutYScale;
		currentNodesShowing.set(data);
	}
	function computeZoomedGrid() {
		const topK = findKClosest(
			data,
			[xScale(mousePosition[0]), yScale(mousePosition[1])],
			$zoomedInGridDimensions ** 2
		);
		let subset = topK.map((item) => data[item.index]);
		[xScale, yScale] = computeScales(
			subset,
			width,
			height,
			$zoomedInGridDimensions
		);
		[grids, flattened] = computeGrids(
			subset,
			width,
			height,
			$zoomedInGridDimensions
		);
	}

	// compute scaling from the width to the actual min max of the data in both dimensions
	const scale2D = (point) => [xScale(point[0]), yScale(point[1])]; // easy converting array to scaled version
	function setGlobalNodesShowing(flattened) {
		const nodesShowing = flattened.map(({ assigned }) => assigned);
		currentNodesShowing.set(nodesShowing);
	}
	let xScale, yScale;
	// variables that can change
	let grids, flattened, mousePosition, isZoomedIn;
	// make a copy of the original one to revert back to
	let originalGrids, originalFlattened, zoomedOutXScale, zoomedOutYScale;
	function init() {
		[xScale, yScale] = computeScales(
			data,
			width,
			height,
			$zoomedOutGridDimensions
		);
		[grids, flattened] = computeGrids(
			data,
			width,
			height,
			$zoomedOutGridDimensions
		);
		mousePosition = [0, 0];
		isZoomedIn = false;
		originalGrids = grids;
		originalFlattened = flattened; // this is grids but flattened
		zoomedOutXScale = xScale.copy();
		zoomedOutYScale = yScale.copy();
		setOriginalDataState(); // to pass data globally and reset anything from previous
	}
	$: {
		// error check we have enough images
		const gridThatDoesFit = Math.floor(Math.sqrt(data.length));
		maxGrids.set(gridThatDoesFit);
		if (data.length < $zoomedOutGridDimensions ** 2) {
			updateZoomDimensions(gridThatDoesFit);
		}
	}
	// on change recompute the zoomed out
	$: {
		if ($zoomedOutGridDimensions && data.length > 0) {
			init();
		}
	}
	$: globalIsZoomedIn.set(isZoomedIn);
	$: if (isZoomedIn) {
		setGlobalNodesShowing(flattened);
	}

	// in order to zoom, this must be true
	const SHIFT = 16; // ascii keycode
	let holdingDownShift = false;

	/**
	 * Takes the wrong items and puts at the end of the array. This is to render the border on top
	 * @param {any[]} array
	 */
	function renderWrongAtTop(array) {
		const grouped = group(array, (value) => value.assigned.correct);
		const correct = grouped.get(true);
		const incorrect = grouped.get(false);
		let newOrder = [];
		if (correct) {
			newOrder = [...correct];
		}
		if (incorrect) {
			newOrder = [...newOrder, ...incorrect];
		}
		return newOrder;
	}
</script>

<!-- listener to see if the user is holding down shift -->
<svelte:window
	on:keyup={(e) => {
		if (e.keyCode === SHIFT) {
			holdingDownShift = false;
		}
	}}
	on:keydown={(e) => {
		if (e.keyCode === SHIFT) {
			holdingDownShift = true;
		}
	}}
/>
<svg
	{width}
	{height}
	on:click={(e) => {
		mousePosition = [e.offsetX, e.offsetY];
		if (holdingDownShift) {
			isZoomedIn = !isZoomedIn;
			if (isZoomedIn) {
				computeZoomedGrid();
			} else {
				setOriginalDataState();
			}
		}
	}}
	style={`cursor: ${
		holdingDownShift ? (isZoomedIn ? "zoom-out" : "zoom-in") : "pointer"
	}`}
>
	{#if $showAsGrid}
		{#each renderWrongAtTop(flattened) as grid}
			<image
				id={`image-${grid.assigned.instance_index}`}
				href={`${$imagesEndpoint}/${grid.assigned.filename}`}
				x={grid.point[0]}
				y={grid.point[1]}
				width={grid.width}
				height={grid.height}
				style={$showMisclassifications && !grid.assigned.correct
					? `outline: ${borderColor} 1px solid`
					: ""}
				opacity={$showMisclassifications &&
				grid.assigned.correct &&
				$highlightIncorrectImages
					? 0.25
					: 1.0}
				on:click={() => {
					if (!holdingDownShift) {
						selectedImage.set(grid.assigned);
					}
				}}
				on:mouseenter={() => {
					if ($highlightSimilarImages) {
						highlightImages({
							instancesToHighlight: [
								grid.assigned.instance_index,
								...grid.assigned.topk_instance_index_list,
							],
						});
					}
				}}
				on:mouseleave={() => {
					if ($highlightSimilarImages) {
						resetOpacity();
					}
				}}
			>
				<title>
					{holdingDownShift
						? isZoomedIn
							? `Click to zoom out`
							: `Click to zoom into this area`
						: `Click to select image ${grid.assigned.instance_index}`}
				</title>
			</image>
		{/each}
	{:else}
		{#each flattened as d}
			<image
				id={`image-${d.assigned.instance_index}`}
				href={`${$imagesEndpoint}/${d.assigned.filename}`}
				x={xScale.invert(d.assigned.features2D[0])}
				y={yScale.invert(d.assigned.features2D[1])}
				width={25}
				height={25}
				style={$showMisclassifications && !d.assigned.correct
					? `border: ${borderColor} 1px solid`
					: ""}
				on:click={() => {
					if (!holdingDownShift) {
						selectedImage.set(d.assigned);
					}
				}}
				on:mouseenter={() => {
					if ($highlightSimilarImages) {
						highlightImages({
							instancesToHighlight: [
								d.assigned.instance_index,
								...d.assigned.topk_instance_index_list,
							],
						});
					}
				}}
				on:mouseleave={() => {
					if ($highlightSimilarImages) {
						resetOpacity();
					}
				}}
			/>
		{/each}
	{/if}
</svg>

<style>
</style>
