import { scaleLinear } from "d3";
import { distance } from "./wrapper";
function computeMinMax(data, embeddingGetter = (d) => d.features2D) {
	let xExtent = [Infinity, -Infinity];
	let yExtent = [Infinity, -Infinity];
	data.forEach((d) => {
		const embedding = embeddingGetter(d);
		const [x, y] = embedding;
		if (x > xExtent[1]) {
			xExtent[1] = x;
		}
		if (x < xExtent[0]) {
			xExtent[0] = x;
		}
		if (y > yExtent[1]) {
			yExtent[1] = y;
		}
		if (y < yExtent[0]) {
			yExtent[0] = y;
		}
	});
	return [xExtent, yExtent];
}
export function computeScales(data, width, height, dim) {
	let [xExtent, yExtent] = computeMinMax(data);
	const gridShift = width / dim / 2;
	const xScale = scaleLinear()
		.domain([0 + gridShift, width + gridShift])
		.range(xExtent);
	const yScale = scaleLinear()
		.domain([height + gridShift, 0 + gridShift])
		.range(yExtent);
	return [xScale, yScale];
}

const deepFlatten = (array) => {
	let flattened = [];
	function flatten(array) {
		for (const item of array) {
			const isArray = Array.isArray(item);
			if (isArray) {
				flatten(item);
			} else {
				flattened.push(item);
			}
		}
	}
	flatten(array);
	return flattened;
};

export const create_grids = (width, height, m, n) => {
	let gridWidth = width / n;
	let gridHeight = height / m;
	let grids = [];
	let flattened = [];
	for (let mi = 0; mi < m; mi++) {
		let rows = [];
		for (let ni = 0; ni < n; ni++) {
			const gridPoint = [ni * gridWidth, mi * gridHeight];
			const gridData = {
				point: gridPoint,
				width: gridWidth,
				height: gridHeight,
			};
			rows.push(gridData);
			flattened.push(gridData);
		}
		grids.push(rows);
	}
	return [grids, flattened];
};

export function findKClosest(
	data,
	position,
	k = 400,
	embeddingsGetter = (d) => d.features2D
) {
	let distances = [];
	for (let i = 0; i < data.length; i++) {
		const length = distance(position, embeddingsGetter(data[i]));
		distances.push({ distance: length, index: i });
	}
	const sorted_distances = distances.sort((a, b) => a.distance - b.distance);
	const topK = sorted_distances.slice(0, k);
	return topK;
}
