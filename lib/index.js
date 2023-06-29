const manifest=require("./pages/api/manifest")
const assets=require("./pages/api/assets")
const ExpoUpdatesStorageApi=require("./common/expo-updates-storage")
const FileSystemUpdatesStorage=require("./common/file-system-updates-storage")

module.exports={ExpoUpdatesStorageApi, FileSystemUpdatesStorage, manifest, assets}