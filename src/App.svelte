<script>
	import Treemap from "./components/Treemap.svelte";
	import Dendrogram from "./components/Dendrogram.svelte";
	import Sidebar from "./components/Sidebar.svelte";
	import Baseline from "./components/baseline/Baseline.svelte";

	import * as d3 from "d3-hierarchy";
	import { onMount } from "svelte";
	import { clustersEndPoint, imagesEndpoint } from "./stores/endPoints";
	import {
		globalClasses,
		globalLeafNodesObject,
		globalRootNode,
	} from "./stores/globalDataStore";
	import {
		assignImageClusterToEachNode,
		givenInstanceIdGetLeafNodeMap as IdToLeafNodeMap,
	} from "./util";
	import {
		currentClassFilter,
		hideLabelAccuracy,
		hideLabelCoverage,
		hideMisclassifiedImages,
		hidePredictions,
		highlightIncorrectImages,
		showMisclassifications,
	} from "./stores/sidebarStore";

	function parseInstanceIndexFromFilename(filename) {
		const indexNumberStarts = filename.indexOf("-") + 1;
		const instanceIndex = filename.slice(
			indexNumberStarts,
			filename.length
		);
		return parseInt(instanceIndex);
	}

	/**
	 * Formats the data through d3.hierarchy and creates cluster arrays with the given
	 * Cluster for each node. This is used heavily in the OurTreemap.svelte.
	 * @param {object} rootNode
	 * @param {object[]} treeNodes
	 */
	function formatForOurTreemap(rootNode, treeNodes, treeClasses) {
		let hierarchicalData = d3.hierarchy(rootNode).sum((d) => d.value);
		let leafNodes = treeNodes.filter((node) => node.is_leaf);

		// for some reason on some of the result files nodes they don't have instance_index
		// this is due to them not using the most up to date clustering file
		if (!("instance_index" in leafNodes[0])) {
			leafNodes.forEach((node) => {
				node.instance_index = parseInstanceIndexFromFilename(
					node.filename
				);
			});
			console.error(
				Error(`instance_index not present on the nodes result files, please precompute this in python first
						things will still work, but it is an inconsistent behavior`)
			);
		}
		if (!("topk_instance_index_list" in leafNodes[0])) {
			console.error(
				Error(
					"must have topk_instance_index_list in the nodes of the tree_results_and_nodes.json\nuse the most updated clustering.py file"
				)
			);
		}

		const leafIdMap = IdToLeafNodeMap(leafNodes);
		assignImageClusterToEachNode(hierarchicalData, ({ data }) => {
			let leafNode = leafIdMap.get(data.instance_index);
			if ("true_class_no" in data && "predicted_class_no" in data) {
				leafNode.true_class = treeClasses[data.true_class_no];
				leafNode.predicted_class = treeClasses[data.predicted_class_no];
			} else {
				leafNode.predicted_class = data.predicted_class;
				leafNode.true_class = data.true_class;
			}
			leafNode.correct = leafNode.predicted_class === leafNode.true_class;
			// console.log("leafNode", leafNode);

			// remove the things that don't make sense on leaves
			delete leafNode["confusion"];
			delete leafNode["ongoing"];
			delete leafNode["descendents_parents"];
			delete leafNode["node_count"];

			return leafNode;
		});
		return [hierarchicalData, leafNodes, leafIdMap];
	}
	// check (stores/globalDataStore.js for more info.)
	function storeDataGlobally({ classes, leafNodes, leafIdMap, rootNode }) {
		globalLeafNodesObject.set({ idMap: leafIdMap, array: leafNodes });
		globalClasses.set(classes);
		globalRootNode.set(rootNode);
	}

	/**
	 * Takes tree results datafile and formats + stores it to be used for our visualizations
	 * @param {JSON} treeResults
	 */
	function formatAndStoreData(treeResults) {
		const treeKey = "tree",
			nodesKey = "nodes",
			classesKey = "classes";
		if (
			!(
				treeKey in treeResults &&
				nodesKey in treeResults &&
				classesKey in treeResults
			)
		) {
			throw Error(
				`One of these keys are missing: ${treeKey}, ${nodesKey}, ${classesKey} from the json.`
			);
		}
		treeData = treeResults.tree;
		treeNodes = treeResults.nodes;
		treeClasses = treeResults.classes;

		// format the data for use in our treemap
		let givenIdReturnsLeafNodeMap, leafNodes;
		[root, leafNodes, givenIdReturnsLeafNodeMap] = formatForOurTreemap(
			treeData,
			treeNodes,
			treeClasses
		);

		// then expose those globally so no need to pass as props anywhere
		// instead just import each global variable (check stores/globalDataStore.js)
		let output = {
			classes: treeClasses,
			rootNode: root,
			leafNodes,
			leafIdMap: givenIdReturnsLeafNodeMap,
		};
		storeDataGlobally(output);
		return output;
	}

	/**
	 * Takes in an object with keys that are the URL param name and the value is a callback that contains the url value
	 * @param {paramName: (value) => void} requestedParamsObj
	 */
	function getURLParameters(requestedParamsObj) {
		const requestedEntries = Object.entries(requestedParamsObj);
		const urlParameters = new URLSearchParams(window.location.search);
		requestedEntries.forEach(([parameter, callback], i) => {
			if (urlParameters.has(parameter)) {
				const value = urlParameters.get(parameter);
				callback(value);
			} else {
				callback(undefined);
			}
		});
	}

	let selectedVisualization;

	const treeMapDims = {
		width: 1600,
		height: 900,
		imageWidth: 40,
		imageHeight: 40,
		imagePadding: 6,
	};

	let validDatasets = [
		"cifar10",
		"cats_vs_dogs",
		"oxford_flowers102",
		"cifar100",
		"imagenet",
	];
	let validVisualizations = [
		"treemap",
		"grid",
		"binary",
		"d3-default",
		"dendrogram",
	];

	let selectedDataset, sampleCount, modelName, fileFormatVersion, setName;
	// experiment = 1
	(selectedDataset = "cifar10"),
		(sampleCount = 0),
		(modelName = "resnet50"),
		(fileFormatVersion = 81);

	// Two other datasets not checked thoroughly yet
	// selectedDataset = "cats_vs_dogs", sampleCount = 1000, modelName = "inceptionv3", fileFormatVersion = 5;
	// selectedDataset = "oxford_flowers102", sampleCount = 1000, modelName = "inceptionv3", fileFormatVersion = 5;

	let root;
	let HACDataFilename = "";
	let datafile;
	let treeData;
	let treeNodes;
	let treeClasses;
	let valueSet, valueInterface, valueTask;
	onMount(async () => {
		selectedDataset = "cifar10";
		sampleCount = 0;
		modelName = "resnet50";
		fileFormatVersion = 82;
		selectedVisualization = "treemap";
		await loadAllClustering();
		if ($currentClassFilter !== null) {
			let classIndex = treeClasses.indexOf($currentClassFilter);
			if (classIndex !== -1) {
				await loadPrecomputedClassClustering(classIndex);
			} else {
				const errorMessage = `cannot read class=${$currentClassFilter}, please ask for help from the facilitators`;
				alert(errorMessage);
				throw Error(errorMessage);
			}
		}
	});

	function buildNewTree(filters = null, precompute = true) {
		root = undefined;
		console.log("filters", filters);
		fetch("/data/clustering_tree", {
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify({
				dataset: selectedDataset,
				filters: filters,
				model_name: modelName,
				file_format_version: fileFormatVersion,
			}),
		})
			.then((response) => response.json())
			.then((treeResults) => {
				formatAndStoreData(treeResults); // check the contents to see what data is stored
			});
	}

	function handleSelectClassName(event) {
		buildNewTree([
			{ attribute: "true_class", value: event.detail.className },
		]);
	}
	let classClusteringsPresent;
	let useGCPImages = true; 
	async function loadPrecomputedClassClustering(classIndex) {
		root = undefined;
		classClusteringsPresent = false;
		// changes from loadAllClustering here
		HACDataFilename = `${$clustersEndPoint}/${classIndex}_result_tree_and_nodes_${modelName}_${sampleCount}_${fileFormatVersion}.json`;
		if (setName !== undefined) {
			HACDataFilename = `${$clustersEndPoint}/${classIndex}_result_tree_and_nodes_${modelName}_${sampleCount}_${fileFormatVersion}_${setName}.json`;
		}
		// changes from loadAllClustering ^

		console.log(HACDataFilename);
		const res = await fetch(HACDataFilename);
		datafile = await res.json();
		formatAndStoreData(datafile); // check the contents to see what data is stored
		classClusteringsPresent = true;
	}
	async function loadAllClustering() {
		root = undefined;
		clustersEndPoint.set(`data`);
		imagesEndpoint.set(useGCPImages ? `https://storage.googleapis.com/div-lab-error-summary-image-storage/${selectedDataset}`: `images`);
		HACDataFilename = `${$clustersEndPoint}/result_tree_and_nodes_${modelName}_${sampleCount}_${fileFormatVersion}.json`;
		if (setName !== undefined) {
			HACDataFilename = `${$clustersEndPoint}/result_tree_and_nodes_${modelName}_${sampleCount}_${fileFormatVersion}_${setName}.json`;
		}
		console.log(HACDataFilename);
		const res = await fetch(HACDataFilename);
		datafile = await res.json();
		formatAndStoreData(datafile); // check the contents to see what data is stored
	}

	let k = 1;
</script>

{#if selectedVisualization == "binary"}
	<div id="treemapOption">
		<label for="k">Current Look Ahead in Treemap = {k}</label>
		<input
			type="range"
			name="k"
			id="k"
			bind:value={k}
			min="1"
			max="20"
			step="1"
		/>
	</div>
{/if}

<div id="top-bar">
	<div id="title"><code>ImageTreemap</code></div>
</div>
<div id="main">
	<!-- {#if datafile && datafile.hasOwnProperty("classes")} -->
	<div id="sidebar">
		{#if selectedVisualization}
			<Sidebar
				on:filterClass={(e) => {
					if (e.detail === null) {
						loadAllClustering();
					} else {
						loadPrecomputedClassClustering(e.detail);
					}
				}}
				classes={treeClasses}
				classNames={[]}
				on:selectVis={({ detail }) => {
					selectedVisualization = detail;
				}}
				on:clickClassName={handleSelectClassName}
				visualizationOptions={validVisualizations}
				initialVisualizationChoice={selectedVisualization}
				{modelName}
				{selectedDataset}
				{classClusteringsPresent}
				task={valueTask}
				_interface={valueInterface}
				set={valueSet}
			/>
		{/if}
	</div>
	<div id="vis">
		{#if root}
			<Treemap
				{...treeMapDims}
				hierarchicalData={root}
				kLookAhead={k}
				treemapType={selectedVisualization}
			/>
		{:else}
			<p>Loading...</p>
		{/if}

		{#if selectedVisualization == "grid" && treeNodes && root}
			<div>
				<Baseline data={treeNodes} />
			</div>
		{/if}
		{#if selectedVisualization == "dendrogram"}
			<Dendrogram {treeData} {treeNodes} />
		{/if}
	</div>
	<!-- {/if} -->
</div>

<style>
	#treemapSelector {
		display: flex;
	}
	#treemapSelector label {
		margin: 3px 10px;
	}
	#treemapOption {
		display: flex;
	}

	#top-bar {
		width: 100%;
		height: 15px;
		background-color: var(--dark-grey);
		padding-top: 10px;
		padding-bottom: 10px;
		display: flex;
		align-items: center;
		border-bottom: 1.5px solid hsla(0, 0%, 0%, 0.1);
	}
	#title {
		color: white;
		font-size: 20px;
		font-weight: 600;
		margin-left: 20px;
		margin-top: -4px;
	}
	#main {
		display: flex;
	}
	#sidebar {
		--width: 550px;
		width: var(--width);
		max-width: var(--width);
		min-width: var(--width);
	}
	code {
		font-family: monospace;
	}
</style>
