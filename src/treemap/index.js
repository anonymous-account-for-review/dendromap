const binaryTreeMap = (
	parent,
	x,
	y,
	width,
	height,
	localDepth = Infinity,
	k = 0
) => {
	const { value, children } = parent;

	// check base case we stop when we hit a leaf
	const isLeafNode = children === undefined || children.length === 0;
	const shouldStopEarly = k >= localDepth;
	if (isLeafNode || shouldStopEarly) {
		return;
	}

	// otherwise we can keep splitting
	const aspectRatio = width / height;
	const shouldDice = aspectRatio >= 1;
	const shouldSlice = aspectRatio < 1;
	if (shouldDice) {
		// split horizontally
		let shiftX = 0;
		children.forEach((child) => {
			child.y = y;
			child.height = height;

			const boxWidth = (child.value / value) * width;
			child.width = boxWidth;

			child.x = x + shiftX;
			shiftX += boxWidth;

			binaryTreeMap(
				child,
				child.x,
				child.y,
				child.width,
				child.height,
				localDepth,
				k + 1
			);
		});
	} else if (shouldSlice) {
		// split vertically
		let shiftY = 0;
		children.forEach((child) => {
			child.x = x;
			child.width = width;

			const boxHeight = (child.value / value) * height;
			child.height = boxHeight;

			child.y = y + shiftY;
			shiftY += boxHeight;

			binaryTreeMap(
				child,
				child.x,
				child.y,
				child.width,
				child.height,
				localDepth,
				k + 1
			);
		});
	} else {
		console.log(aspectRatio);
		console.log(parent.children);
		throw Error("Should slice or dice, no other option :P");
	}
};

export const hacTreeMap = (
	parent,
	x,
	y,
	width,
	height,
	localDepth = Infinity
) => {
	// set the parent width and height
	parent.x = x;
	parent.y = y;
	parent.width = width;
	parent.height = height;

	// call the recursive algorithm to split into 2 for children
	binaryTreeMap(parent, x, y, width, height, localDepth);
};

export const getLeaves = (parent) => {
	let leaves = [];
	const _getLeaves = (node) => {
		if (node.children === undefined || node.children.length === 0) {
			leaves.push(node);
			return;
		}
		node.children.forEach((child) => {
			_getLeaves(child);
		});
	};
	_getLeaves(parent);
	return leaves;
};

export const assignToClusters = (parent, cluster = (node) => node.data) => {
	const _accumulateUp = (node, initialValue) => {
		if (node.parent !== null) {
			if (node.parent.cluster === undefined) {
				node.parent.cluster = [initialValue];
			} else {
				node.parent.cluster.push(initialValue);
			}
			_accumulateUp(node.parent, initialValue);
		}
	};

	// from bottom up, follow the merging and add file to the cluster
	// top has all the files and each leaf should have individual files by the end
	let leaves = getLeaves(parent);
	leaves.forEach((leaf) => {
		let value = cluster(leaf);
		leaf.cluster = [value];
		_accumulateUp(leaf, value);
	});
};
