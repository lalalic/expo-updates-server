const crypto = require('crypto');
const fetch = require('node-fetch')

class NoUpdateAvailableError extends Error {}

const UpdateType = {
	NORMAL_UPDATE: 0,
	ROLLBACK: 1,
};

class ExpoUpdatesStorage {
	constructor() {
		this.NoUpdateAvailableError = NoUpdateAvailableError;
	}

	/**return updateBundlePath */
	getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion, platform) {

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

	async getTypeOfUpdateAsync(updateBundlePath) {
		return UpdateType.NORMAL_UPDATE
	} 

	getMetadataAsync(updateBundlePath, runtimeVersion,) {
		return {}
	}

	async getManifest(id){
		return false
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

	static UpdateType=UpdateType
	static fromManifestURI(createManifestURL){
		return new (class ExpoUpdatesStorage{
			async getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion, platform){
				return createManifestURL({runtimeVersion, platform})
			}

			async getManifest(id){
				if(id in this.caches){
					if(this.manifest.id==id)
						return this.manifest
					const res=await fetch(this.caches[id])
					return await res.json()
				}
				return false
				
			}

			async getMetadataAsync(updateBundlePath){
				const res=await fetch(updateBundlePath)
				this.manifest=await res.json()
				;(this.caches=this.caches||{})[this.manifest.id]=updateBundlePath
				return {
					metadataJson:{fileMetadata:{ios:{},android:{}}},
					id:this.manifest.id,
					createdAt: new Date()
				}
			}
		})();
	}
}

module.exports = ExpoUpdatesStorage
