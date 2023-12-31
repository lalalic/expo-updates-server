const fs = require('fs');
const mime = require('mime');
const nullthrows = require('nullthrows');
const path = require('path');

module.exports = storage=>async function assetsEndpoint(req, res) {
	const { asset: assetName, runtimeVersion, platform } = req.query;

	if (!assetName || typeof assetName !== 'string') {
		res.statusCode = 400;
		res.json({ error: 'No asset name provided.' });
		return;
	}

	if (platform !== 'ios' && platform !== 'android') {
		res.statusCode = 400;
		res.json({ error: 'No platform provided. Expected "ios" or "android".' });
		return;
	}

	if (!runtimeVersion || typeof runtimeVersion !== 'string') {
		res.statusCode = 400;
		res.json({ error: 'No runtimeVersion provided.' });
		return;
	}

	let updateBundlePath;
	try {
		updateBundlePath = await storage.getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion);
	} catch (error) {
		res.statusCode = 404;
		res.json({
			error: error.message,
		});
		return;
	}

	const { metadataJson } = await storage.getMetadataAsync({
		updateBundlePath,
		runtimeVersion,
	});

	const assetPath = path.resolve(assetName);
	const assetMetadata = metadataJson.fileMetadata[platform].assets.find(
		(asset) => asset.path === assetName.replace(`${updateBundlePath}/`, '')
	);
	const isLaunchAsset =
		metadataJson.fileMetadata[platform].bundle === assetName.replace(`${updateBundlePath}/`, '');

	if (!fs.existsSync(assetPath)) {
		res.statusCode = 404;
		res.json({ error: `Asset "${assetName}" does not exist.` });
		return;
	}

	try {
		const asset = fs.readFileSync(assetPath, null);

		res.statusCode = 200;
		res.setHeader(
			'content-type',
			isLaunchAsset ? 'application/javascript' : nullthrows(mime.getType(assetMetadata.ext))
		);
		res.end(asset);
	} catch (error) {
		console.log(error);
		res.statusCode = 500;
		res.json({ error });
	}
}


