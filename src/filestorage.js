window.csscritic = (function (module, fs) {
    module.storage = module.storage || {};
    module.filestorage = {};

    module.filestorage.options = {
        basePath: "./"
    };

    var filePathForKey = function (key) {
        return module.filestorage.options.basePath + key + ".json";
    };

    module.filestorage.storeReferenceImage = function (key, pageImage, viewportWidth, viewportHeight) {
        var uri, dataObj;

        uri = module.util.getDataURIForImage(pageImage);
        dataObj = {
            referenceImageUri: uri,
            viewport: {
                width: viewportWidth,
                height: viewportHeight
            }
        };

        fs.write(filePathForKey(key), JSON.stringify(dataObj), "w");
    };

    module.filestorage.readReferenceImage = function (key, successCallback, errorCallback) {
        var filePath = filePathForKey(key),
            dataObjString, dataObj;

        if (! fs.exists(filePath)) {
            errorCallback();
            return;
        }

        dataObjString = fs.read(filePath);
        try {
            dataObj = JSON.parse(dataObjString);
        } catch (e) {
            errorCallback();
            return;
        }

        if (dataObj.referenceImageUri) {
            module.util.getImageForUrl(dataObj.referenceImageUri, function (img) {
                var viewport = dataObj.viewport || {
                    width: img.width,
                    height: img.height
                };

                successCallback(img, viewport);
            }, errorCallback);
        } else {
            errorCallback();
            return;
        }
    };

    module.storage.options = module.filestorage.options;
    module.storage.storeReferenceImage = module.filestorage.storeReferenceImage;
    module.storage.readReferenceImage = module.filestorage.readReferenceImage;
    return module;
}(window.csscritic || {}, require("fs")));
