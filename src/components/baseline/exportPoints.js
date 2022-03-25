/**
 *
 * @param {any[]} flattened
 */
export function formatForDelyar(flattened) {
	console.log(flattened[0]);
	const newFormat = flattened.map((point) => {
		const { assigned } = point;
		let newFormatForDelyar = {
			features: assigned.features,
			tSNE2D: assigned.features2D,
			grid2D: [xScale(point.point[0]), yScale(point.point[1])],
			filename: assigned.filename,
			instance_index: assigned.instance_index,
		};
		return newFormatForDelyar;
	});
	console.log(newFormat);
}
