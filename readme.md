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
const {FileSystemUpdatesStorage, createUpdatesServer, ExpoUpdatesStorageApi}=require("expo-updates-server")

const server=express()

const updatesStorage=new FileSystemUpdatesStorage({
    UPDATES: "/users/test/updates",
    HOSTNAME: "https://mydomain.com/updates",
    PRIVATE_KEY_PATH: "/users/test/private-key.pem",
})

const updatesServer=createUpdatesServer(updatesStorage)

server.use("/updates", updatesServer)

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

