import { lap } from "./lap";

export const distance = (p1, p2) => {
	return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
};
const cdist2D = (grids, points) => {
	let dists = [];
	for (let i = 0; i < grids.length; i++) {
		const grid = grids[i];
		let perGridAllDists = [];
		for (let j = 0; j < points.length; j++) {
			const point = points[j];
			const dist = distance(grid, point);
			perGridAllDists.push(dist);
		}
		dists.push(perGridAllDists);
	}

	return dists;
};
const zeros = (length) => new Array(length).fill(0);
const rowBalance = (dists) => {
	const squareShape = dists[0].length;
	let merged = [];
	for (let i = dists.length; i < squareShape; i++) {
		merged.push(zeros(squareShape));
	}
	return dists.concat(merged);
};
const assign = (col, costs, grids, trueCost) => {
	let verifiedSum = 0;
	let assignments = [];
	for (let i = 0; i < grids; i++) {
		const assignment = col[i];
		const c = costs[i][assignment];
		assignments.push(assignment);
		verifiedSum += c;
	}
	if (Math.round(trueCost, 2) !== Math.round(verifiedSum, 2)) {
		throw Error(
			`assignments incorrect because costs don't match with true ${trueCost} != ${verifiedSum}`
		);
	}
	return assignments;
};

export const rowBalancedLapJV = (costMatrix, numRows) => {
	const cost = rowBalance(costMatrix);
	const solution = lap(cost.length, cost);
	const rowAssignments = assign(solution.row, cost, numRows, solution.cost);
	return rowAssignments;
};

export const gridLapJV = (gridCoords, pointCoords) => {
	const numGrids = gridCoords.length;
	const cost = cdist2D(gridCoords, pointCoords);
	const gridAssignments = rowBalancedLapJV(cost, numGrids);

	return gridAssignments;
};
