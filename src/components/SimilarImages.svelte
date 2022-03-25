<script>
	import {
		hidePredictions,
		showMisclassifications,
	} from "../stores/sidebarStore";
	import {
		globalLeafNodesObject,
		incorrectColor,
	} from "../stores/globalDataStore";
	import { imagesEndpoint } from "../stores/endPoints";
	import Label from "./sidebarComponents/Label.svelte";

	export let image;
	export let imageWidth = 50;
	export let imageHeight = 50;
	export let selectedImageHeight = 150;
	export let selectedImageWidth = 150;
	export let showSimilarImages = true;
	const labelWidth = 150;

	function imageIsEmpty() {
		return image === null || image === undefined;
	}
	function handleNull(value, _default = "...") {
		return !imageIsEmpty() ? value : _default;
	}
</script>

<div id="overall-container">
	<div id="selected-image">
		<div id="big-image">
			<div class="image-desc">
				<div class="row">
					<Label
						label="Image ID"
						outerDivStyle="width: {labelWidth}px;"
					>
						{handleNull(image?.instance_index)}
					</Label>
					<Label
						label="True Class"
						outerDivStyle="width: {labelWidth}px; "
					>
						{handleNull(image?.true_class)}
					</Label>
				</div>
				{#if !$hidePredictions}
					<div class="row" style="justify-content: end;">
						<Label
							label="Predicted Class"
							outerDivStyle="width: {labelWidth}px; margin-left: 15px;"
						>
							{handleNull(image?.predicted_class)}
						</Label>
					</div>
				{/if}
			</div>
			<div
				id="current-image-selection"
				style="width:{selectedImageWidth}px; height: {selectedImageHeight}px; border: 1px {!imageIsEmpty() &&
				$showMisclassifications &&
				!image.correct
					? incorrectColor
					: 'lightgrey'} solid;"
			>
				{#if image}
					<img
						src="{$imagesEndpoint}/{image.filename}"
						width={selectedImageWidth}
						height={selectedImageHeight}
						alt="magnified"
					/>
				{/if}
			</div>
		</div>
	</div>

	{#if showSimilarImages}
		<Label label="Similar Images" outerDivStyle=" margin-top: 5px;">
			<div id="big-image-info">
				<div id="container">
					{#if image}
						{#each image.topk_instance_index_list as simInstanceId}
							<img
								src={!imageIsEmpty()
									? `${$imagesEndpoint}/${
											$globalLeafNodesObject.idMap.get(
												simInstanceId
											).filename
									  }`
									: ""}
								alt="similar"
								width={imageWidth}
								height={imageHeight}
								style="border: 2px {$showMisclassifications &&
								!$globalLeafNodesObject.idMap.get(simInstanceId)
									.correct
									? incorrectColor
									: 'transparent'} solid; margin-top: 1px; margin-left: 1px;"
							/>
						{/each}
					{/if}
				</div>
			</div></Label
		>
	{/if}
</div>

<style>
	#overall-container {
		/* padding: 5px; */
	}
	#container {
		height: 100px;
		overflow-y: overlay;
		display: flex;
		flex-flow: row;
		flex-wrap: wrap;
		justify-content: start;
		border: 1px lightgrey solid;
	}
	#selected-image {
		display: flex;
	}
	#big-image {
		display: flex;
		align-items: center;
	}

	/* width */
	::-webkit-scrollbar {
		width: 5px;
	}

	/* Track */
	::-webkit-scrollbar-track {
		background: #f1f1f1;
	}

	/* Handle */
	::-webkit-scrollbar-thumb {
		background: #888;
	}

	/* Handle on hover */
	::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
	.row {
		display: flex;
		margin-left: 20px;
		margin-bottom: 20px;
		text-overflow: ellipsis;
	}
	.row > * {
		/* margin-left: 20px; */
	}
	#current-image-selection {
		border: 1px solid lightgrey;
	}
	#image-desc {
	}
</style>
