<script>
	import { beforeUpdate } from "svelte";
	import { imagesEndpoint } from "../stores/endPoints";

    export let treeData;
    export let treeNodes;

    let nodeListData = [];
	beforeUpdate(async () => {
        treeLeavesOrderedIndexes = [];
		traverse(treeData);
		let treeLeavesOrderedIndexMap = {};
		treeLeavesOrderedIndexes.forEach((leaf, i) => {
			treeLeavesOrderedIndexMap[leaf] = i;
		})

		let nodeListDataTemp = treeNodes;

		nodeListDataTemp.forEach(node => {
			if (node.is_leaf == true) {
				node.xPosition = treeLeavesOrderedIndexMap[node.node_index];
			} else {
				node.xPosition = (
                    nodeListDataTemp[node.children_node_indexes[0]].xPosition + 
                    nodeListDataTemp[node.children_node_indexes[1]].xPosition) * 0.5;
			}
		});
		nodeListData = nodeListDataTemp;
        console.log(nodeListData, treeNodes, treeLeavesOrderedIndexes);

        xScale = Math.max(4, 2000 / nodeListData.length);
	});
    

	let treeLeavesOrderedIndexes = [];
	function traverse(n) {
		if (n.leaf != true) {
			traverse(n.children[0])
		}
		if (n.leaf == true) {
			treeLeavesOrderedIndexes.push(n.node_index);
		}
		if (n.leaf != true) {
			traverse(n.children[1])
		}
	}
	let xScale;
	let yScale = (value) => Math.log(1.0 + value) * 50.0;
	let highlightedIndex = null;
</script>


<div>This is mainly for verfication and exploration.</div>

{#if nodeListData.length > 0}
    <svg style="width: {nodeListData.filter(node => node.is_leaf==true).length * xScale + 30}; height: 3500px">
        {#if highlightedIndex !== null}
            <image href={`${$imagesEndpoint}/${nodeListData[highlightedIndex].filename}`} 
                x="{nodeListData[highlightedIndex].xPosition * xScale}" y="15" width="40" height="40" />
        {/if}
        {#each nodeListData as node}
            <g transform="translate(10, 70)">
            {#if node.is_leaf == true}
                <rect x={node.xPosition * xScale - 1} y="-10" width="2" height="10"
                    class="dendrogramLeaf"
                    on:mouseenter={() => highlightedIndex = node.node_index}>
                    <title>{node.node_index}</title>
                </rect>
            {/if}
            </g>
            <g transform="translate(10, 70)">
            {#if node.is_leaf != true}
                <line 
                    x1="{xScale * nodeListData[node.children_node_indexes[0]].xPosition}"
                    x2="{xScale * nodeListData[node.children_node_indexes[1]].xPosition}"
                    y1="{yScale(node.merging_distance)}" 
                    y2="{yScale(node.merging_distance)}" 
                    class="dendrogramLink" />
                <line 
                    x1="{xScale * nodeListData[node.children_node_indexes[0]].xPosition}"
                    x2="{xScale * nodeListData[node.children_node_indexes[0]].xPosition}"
                    y1="{yScale(node.merging_distance)}" 
                    y2="{nodeListData[node.children_node_indexes[0]].is_leaf == true ? 0 : yScale(nodeListData[node.children_node_indexes[0]].merging_distance)}" 
                    class="dendrogramLink" />
                <line 
                    x1="{xScale * nodeListData[node.children_node_indexes[1]].xPosition}"
                    x2="{xScale * nodeListData[node.children_node_indexes[1]].xPosition}"
                    y1="{yScale(node.merging_distance)}" 
                    y2="{nodeListData[node.children_node_indexes[1]].is_leaf == true ? 0 : yScale(nodeListData[node.children_node_indexes[1]].merging_distance)}" 
                    class="dendrogramLink" />
                <text class="nonleafLabel" 
                    transform="translate({xScale * node.xPosition}, {yScale(node.merging_distance) - 2})">
                    {node.node_index}: {node.node_count}
                    <title>#{node.node_index}: {node.accuracy * 100}%</title>
                </text>
            {/if}
            </g>
        {/each}
    </svg>
{/if}


<style>
    .dendrogramLeaf {
        fill: darkblue;
        stroke-width: 0;
    }
    .dendrogramLink {
        fill: none;
        stroke-width: 2;
        stroke: rgb(113, 160, 199);
    }
    .nonleafLabel {
        font-size: 11px;
        fill: rgb(90, 90, 90);
        text-anchor: middle;
    }
</style>