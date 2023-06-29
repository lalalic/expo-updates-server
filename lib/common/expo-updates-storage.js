const crypto = require('crypto');

class NoUpdateAvailableError extends Error {}

class ExpoUpdatesStorage {
	constructor() {
		this.NoUpdateAvailableError = NoUpdateAvailableError;
	}

	/**return updateBundlePath */
	getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion) {

	}

	/*
	return {
		hash: assetHash,
		key,
		fileExtension: `.${keyExtensionSuffix}`,
		contentType,
		url: assetURL(arg.runtimeVersion, arg.platform, assetFilePath),
	}
	*/
	getAssetMetadataAsync(
		/**
	 * {
			updateBundlePath,
			filePath: asset.path,
			ext: asset.ext,
			runtimeVersion,
			platform,
			isLaunchAsset: false,
		}
	 */
	) {

	}

	getMetadataAsync(updateBundlePath, runtimeVersion,) {

	}

	getPrivateKeyAsync() {

	}

	getExpoConfigAsync(updateBundlePath, runtimeVersion) {

	}

	createRollBackDirectiveAsync(updateBundlePath) {

	}

	getAssetExtensionHeaders(asset){

	}

	convertSHA256HashToUUID(value) {
		return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
	}
	createNoUpdateAvailableDirectiveAsync() {
		return {
			type: 'noUpdateAvailable',
		};
	}
	convertToDictionaryItemsRepresentation(obj) {
		return new Map(
			Object.entries(obj).map(([k, v]) => {
				return [k, [v, new Map()]];
			})
		);
	}
	signRSASHA256(data, privateKey) {
		const sign = crypto.createSign('RSA-SHA256');
		sign.update(data, 'utf8');
		sign.end();
		return sign.sign(privateKey, 'base64');
	}

	createHash(file, hashingAlgorithm, encoding) {
		return crypto.createHash(hashingAlgorithm).update(file).digest(encoding);
	}
	
	getBase64URLEncoding(base64EncodedString) {
		return base64EncodedString.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	}
	
	truthy(value) {
		return !!value;
	}
}

module.exports = ExpoUpdatesStorage
