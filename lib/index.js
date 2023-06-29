const manifest=require("./pages/api/manifest")
const assets=require("./pages/api/assets")
const ExpoUpdatesStorageApi=require("./common/expo-updates-storage")
const FileSystemUpdatesStorage=require("./common/file-system-updates-storage")

function createUpdatesServer(storage){
    return function(req, res){
        const [api, target]=req.url.split("/").filter(a=>!!a)
        if (target.startsWith("manifest")) {
            manifest(storage)(req, res)
        } else if (target.startsWith("assets")) {
            assets(storage)(req, res)
        }
    }
}

module.exports={createUpdatesServer, ExpoUpdatesStorageApi, FileSystemUpdatesStorage}