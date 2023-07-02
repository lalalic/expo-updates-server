const FormData = require("form-data");
const fs = require("fs").promises;
const { serializeDictionary } = require("structured-headers");

const UpdateType = {
	NORMAL_UPDATE: 0,
	ROLLBACK: 1,
};

module.exports = storage=>async function manifestEndpoint(req, res) {
	if (req.method !== "GET") {
		res.statusCode = 405;
		res.json({ error: "Expected GET." });
		return;
	}

	const protocolVersionMaybeArray = req.headers["expo-protocol-version"];
	if (protocolVersionMaybeArray && Array.isArray(protocolVersionMaybeArray)) {
		res.statusCode = 400;
		res.json({
			error: "Unsupported protocol version. Expected either 0 or 1.",
		});
		return;
	}
	const protocolVersion = parseInt(protocolVersionMaybeArray ?? "0", 10);

	const platform = req.headers["expo-platform"] ?? req.query["platform"];
	if (platform !== "ios" && platform !== "android") {
		res.statusCode = 400;
		res.json({
			error: "Unsupported platform. Expected either ios or android.",
		});
		return;
	}

	const runtimeVersion = req.headers["expo-runtime-version"] ?? req.query["runtime-version"];
	if (!runtimeVersion || typeof runtimeVersion !== "string") {
		res.statusCode = 400;
		res.json({
			error: "No runtimeVersion provided.",
		});
		return;
	}

	let updateBundlePath;
	try {
		updateBundlePath =
			await storage.getLatestUpdateBundlePathForRuntimeVersionAsync(
				runtimeVersion, platform
			);
	} catch (error) {
		res.statusCode = 404;
		res.json({
			error: error.message,
		});
		return;
	}

	const updateType = await storage.getTypeOfUpdateAsync(updateBundlePath);

	try {
		try {
			if (updateType === UpdateType.NORMAL_UPDATE) {
				await putUpdateInResponseAsync(storage,
					req,
					res,
					updateBundlePath,
					runtimeVersion,
					platform,
					protocolVersion
				);
			} else if (updateType === UpdateType.ROLLBACK) {
				await putRollBackInResponseAsync(storage,
					req,
					res,
					updateBundlePath,
					protocolVersion
				);
			}
		} catch (maybeNoUpdateAvailableError) {
			if (maybeNoUpdateAvailableError instanceof storage.NoUpdateAvailableError) {
				await putNoUpdateAvailableInResponseAsync(storage,
					req,
					res,
					protocolVersion
				);
				return;
			}
			throw maybeNoUpdateAvailableError;
		}
	} catch (error) {
		console.error(error);
		res.statusCode = 404;
		res.json({ error });
	} 
};

async function putUpdateInResponseAsync(storage,
	req,
	res,
	updateBundlePath,
	runtimeVersion,
	platform,
	protocolVersion
) {
	const currentUpdateId = req.headers["expo-current-update-id"];
	const { metadataJson, createdAt, id } = await storage.getMetadataAsync({
		updateBundlePath,
		runtimeVersion,
	});

	if (currentUpdateId === id && protocolVersion === 1) {
		throw new storage.NoUpdateAvailableError();
	}

	const expoConfig = await storage.getExpoConfigAsync({
		updateBundlePath,
		runtimeVersion,
	});
	const platformSpecificMetadata = metadataJson.fileMetadata[platform];
	const manifest = (await storage.getManifest(id)) || {
		id: storage.convertSHA256HashToUUID(id),
		createdAt,
		runtimeVersion,
		assets: await Promise.all(
			platformSpecificMetadata.assets.map((asset) =>
				storage.getAssetMetadataAsync({
					updateBundlePath,
					filePath: asset.path,
					ext: asset.ext,
					runtimeVersion,
					platform,
					isLaunchAsset: false,
				})
			)
		),
		launchAsset: await storage.getAssetMetadataAsync({
			updateBundlePath,
			filePath: platformSpecificMetadata.bundle,
			isLaunchAsset: true,
			runtimeVersion,
			platform,
			ext: null,
		}),
		metadata: {},
		extra: {
			expoClient: expoConfig,
		},
	};

	await send({storage,
		req, res,protocolVersion,directive:manifest,
		feedForm(form, signature){
			const assetRequestHeaders = {};
			[...manifest.assets, manifest.launchAsset].forEach((asset) => {
				const assetExtensionHeaders=storage.getAssetExtensionHeaders(asset)
				if(assetExtensionHeaders){
					assetRequestHeaders[asset.key]=assetExtensionHeaders
				}
			});

			form.append("manifest", JSON.stringify(manifest), {
				contentType: "application/json",
				header: {
					"content-type": "application/json; charset=utf-8",
					...(signature ? { "expo-signature": signature } : {}),
				},
			});
			form.append("extensions", JSON.stringify({ assetRequestHeaders }), {
				contentType: "application/json",
			});
		}
	})
}

async function putRollBackInResponseAsync(storage,
	req,
	res,
	updateBundlePath,
	protocolVersion
) {
	if (protocolVersion === 0) {
		throw new Error("Rollbacks not supported on protocol version 0");
	}

	const embeddedUpdateId = req.headers["expo-embedded-update-id"];
	if (!embeddedUpdateId || typeof embeddedUpdateId !== "string") {
		throw new Error(
			"Invalid Expo-Embedded-Update-ID request header specified."
		);
	}

	const currentUpdateId = req.headers["expo-current-update-id"];
	if (currentUpdateId === embeddedUpdateId) {
		throw new storage.NoUpdateAvailableError();
	}

	await send({req, res,directive:await storage.createRollBackDirectiveAsync(updateBundlePath)})
}

async function putNoUpdateAvailableInResponseAsync(storage, req, res, protocolVersion) {
	if (protocolVersion === 0) {
		throw new Error(
			"NoUpdateAvailable directive not available in protocol version 0"
		);
	}

	await send({storage, res,req,directive:await storage.createNoUpdateAvailableDirectiveAsync(),})
}

async function send({storage,
		req, res,
		directive, protocolVersion=1,
		feedForm=function(form, signature){
			form.append("directive", JSON.stringify(directive), {
				contentType: "application/json",
				header: {
					"content-type": "application/json; charset=utf-8",
					...(signature ? { "expo-signature": signature } : {}),
				},
			});
		}
	}) {

	let signature = null;
	const expectSignatureHeader = req.headers["expo-expect-signature"];
	if (expectSignatureHeader) {
		const privateKey = await storage.getPrivateKeyAsync();
		if (!privateKey) {
			res.statusCode = 400;
			res.json({
				error: "Code signing requested but no key supplied when starting server.",
			});
			return;
		}
		const hashSignature = storage.signRSASHA256(JSON.stringify(directive), privateKey);
		const dictionary = storage.convertToDictionaryItemsRepresentation({
			sig: hashSignature,
			keyid: "main",
		});
		signature = serializeDictionary(dictionary);
	}
	const form = new FormData();
	feedForm(form, signature)

	res.statusCode = 200;
	res.setHeader("expo-protocol-version", protocolVersion);
	res.setHeader("expo-sfv-version", 0);
	res.setHeader("cache-control", "private, max-age=0");
	res.setHeader(
		"content-type",
		`multipart/mixed; boundary=${form.getBoundary()}`
	);
	res.write(form.getBuffer());
	res.end();
}
