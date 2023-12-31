expo-updates-server
===================
> port from expo/custom/expo-updates-server

installation
===========
yarn/npm expo-updates-server

how to use
==========
FileSystemUpdatesStorage implements ExpoUpdatesStorageApi based on files. 
you need output "expo export --experimental-bundle" to UPDATES folder under ${UPDATES}/${version}/${datetime:20230505}/[assets|bundles|metadata.json|expoConfig.json].
```
const express = require('express')
const {FileSystemUpdatesStorage, manifest, assets}=require("expo-updates-server")

const server=express()

const updatesStorage=new FileSystemUpdatesStorage({
    UPDATES: "/users/test/updates",
    HOSTNAME: "https://mydomain.com/updates",
    PRIVATE_KEY_PATH: "/users/test/private-key.pem",
})

server.use("/updates/manifest", manifest(updatesStorage))
server.use("/updates/assets", assets(updatesStorage))

```

extension
=========
the interface is at expo-updates-server/lib/common/ExpoUpdatesStorage.
```
const {ExpoUpdatesStorageApi}=require("expo-updates-server")

class MyExpoUpdatesStorage extends ExpoUpdatesStorageApi{
    getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion) {
	}

	getAssetMetadataAsync() {

	}
	getMetadataAsync() {

	}

	getPrivateKeyAsync() {

	}
	getExpoConfigAsync() {

	}
	//optional
	getAssetExtensionHeaders(){

	}
	//optional
	createRollBackDirectiveAsync() {

	}
	//optional
	createNoUpdateAvailableDirectiveAsync() {

	}
}
```
or if you already have manifest somewhere
```
const {ExpoUpdatesStorageApi}=require("expo-updates-server")

const storage=ExpoUpdatesStorageApi.fromManifestURI(({runtimeVersion, platform})=>`https://mydomain.com/updates/${runtimeVersion}/${platform}/manifest.json`)
```