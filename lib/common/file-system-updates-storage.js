const fsSync = require('fs');
const fs = require('fs').promises;
const mime = require('mime');
const { platform } = require('os');
const path = require('path');
const ExpoUpdatesStorage = require("./expo-updates-storage");

const UpdateType=ExpoUpdatesStorage.UpdateType
/**
 * env: 
 * {
 * UPDATES: root path of updates assets
 * HOSTNAME: url context to download assets	
 * PRIVATE_KEY_PATH: private key path
 * }
 */
class FileSystemUpdatesStorage extends ExpoUpdatesStorage{
	constructor(env){
		super()

		const process = {env}
		const {createHash, getBase64URLEncoding, truthy}=this

		this.getPrivateKeyAsync = async function getPrivateKeyAsync() {
			const privateKeyPath = process.env.PRIVATE_KEY_PATH;
			if (!privateKeyPath) {
				return null;
			}

			const pemBuffer = await fs.readFile(path.resolve(privateKeyPath));
			return pemBuffer.toString('utf8');
		};

		this.getLatestUpdateBundlePathForRuntimeVersionAsync = async function getLatestUpdateBundlePathForRuntimeVersionAsync(
			runtimeVersion
		) {
			const updatesDirectoryForRuntimeVersion = `${process.env.UPDATES}/${runtimeVersion}`;
			if (!fsSync.existsSync(updatesDirectoryForRuntimeVersion)) {
				throw new Error('Unsupported runtime version');
			}

			const filesInUpdatesDirectory = await fs.readdir(updatesDirectoryForRuntimeVersion);
			const directoriesInUpdatesDirectory = (
				await Promise.all(
					filesInUpdatesDirectory.map(async (file) => {
						const fileStat = await fs.stat(path.join(updatesDirectoryForRuntimeVersion, file));
						return fileStat.isDirectory() ? file : null;
					})
				)
			)
				.filter(truthy)
				.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
			return path.join(updatesDirectoryForRuntimeVersion, directoriesInUpdatesDirectory[0]);
		}

		this.getAssetMetadataAsync = async function getAssetMetadataAsync(arg) {
			const assetFilePath = `${arg.updateBundlePath}/${arg.filePath}`;
			const asset = await fs.readFile(path.resolve(assetFilePath), null);
			const assetHash = getBase64URLEncoding(createHash(asset, 'sha256', 'base64'));
			const key = createHash(asset, 'md5', 'hex');
			const keyExtensionSuffix = arg.isLaunchAsset ? 'bundle' : arg.ext;
			const contentType = arg.isLaunchAsset ? 'application/javascript' : mime.getType(arg.ext);

			return {
				hash: assetHash,
				key,
				fileExtension: `.${keyExtensionSuffix}`,
				contentType,
				url: assetURL(arg.runtimeVersion, arg.platform, assetFilePath),
			};
		}

		function assetURL(runtimeVersion, platform, assetFilePath){
			switch(typeof process.env.HOSTNAME){
				case "string":
					return `${process.env.HOSTNAME}/assets?asset=${assetFilePath}&runtimeVersion=${runtimeVersion}&platform=${platform}`
				case "function":
					return process.env.HOSTNAME({runtimeVersion, platform, assetFilePath})
			}
		}

		this.createRollBackDirectiveAsync = async function createRollBackDirectiveAsync(updateBundlePath) {
			try {
				const rollbackFilePath = `${updateBundlePath}/rollback`;
				const rollbackFileStat = await fs.stat(rollbackFilePath);
				return {
					type: 'rollBackToEmbedded',
					parameters: {
						commitTime: new Date(rollbackFileStat.birthtime).toISOString(),
					},
				};
			} catch (error) {
				throw new Error(`No rollback found. Error: ${error}`);
			}
		};

		this.getMetadataAsync = async function getMetadataAsync({ updateBundlePath, runtimeVersion }) {
			try {
				const metadataPath = `${updateBundlePath}/metadata.json`;
				const updateMetadataBuffer = await fs.readFile(path.resolve(metadataPath), null);
				const metadataJson = JSON.parse(updateMetadataBuffer.toString('utf-8'));
				const metadataStat = await fs.stat(metadataPath);

				return {
					metadataJson,
					createdAt: new Date(metadataStat.birthtime).toISOString(),
					id: createHash(updateMetadataBuffer, 'sha256', 'hex'),
				};
			} catch (error) {
				throw new Error(`No update found with runtime version: ${runtimeVersion}. Error: ${error}`);
			}
		};

		this.getExpoConfigAsync = async function getExpoConfigAsync({ updateBundlePath, runtimeVersion }) {
			try {
				const expoConfigPath = `${updateBundlePath}/expoConfig.json`;
				const expoConfigBuffer = await fs.readFile(path.resolve(expoConfigPath), null);
				const expoConfigJson = JSON.parse(expoConfigBuffer.toString('utf-8'));
				return expoConfigJson;
			} catch (error) {
				throw new Error(`No expo config json found with runtime version: ${runtimeVersion}. Error: ${error}`);
			}
		}

		this.getTypeOfUpdateAsync=async function getTypeOfUpdateAsync(updateBundlePath) {
			const directoryContents = await fs.readdir(updateBundlePath);
			return directoryContents.includes("rollback")
				? UpdateType.ROLLBACK
				: UpdateType.NORMAL_UPDATE;
		} 
	}
}

module.exports=FileSystemUpdatesStorage