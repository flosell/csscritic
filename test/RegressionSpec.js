describe("Regression testing", function () {
    var getImageForPageUrl, readReferenceImage,
        htmlImage, referenceImage;

    beforeEach(function () {
        htmlImage = jasmine.createSpy('htmlImage');
        referenceImage = {
            width: 42,
            height: 7
        };

        getImageForPageUrl = spyOn(csscritic.util, 'getImageForPageUrl');
        readReferenceImage = spyOn(csscritic.util, 'readReferenceImage');

        spyOn(csscritic.util, 'workAroundTransparencyIssueInFirefox').andCallFake(function (image, callback) {
            callback(image);
        });
    });

    afterEach(function () {
        csscritic.clearReporters();
    });

    describe("Reference comparison", function () {

        beforeEach(function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });
        });

        it("should compare a page with a reference image and return 'passed' on success", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(status).toEqual('passed');
        });

        it("should compare a page with a reference image and return 'failed' on failure", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(false);

            csscritic.compare("differentpage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(status).toEqual("failed");
        });

        it("should make the callback optional", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
        });

        it("should make the reference image url optional", function () {
            var status;

            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));

            expect(status).toEqual('passed');
        });

        it("should make both reference image url and callback optional", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
        });
    });

    describe("Configuration error handling", function () {
        var imagediffEqual;

        beforeEach(function () {
            imagediffEqual = spyOn(imagediff, 'equal');
        });

        it("should return 'referenceMissing' if the reference image cannot be loaded", function () {
            var status;

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback) {
                successCallback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(status).toEqual('referenceMissing');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });

        it("should return 'error' if the page does not exist", function () {
            var status;

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(status).toEqual('error');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });

        it("should return 'error' if the page does not exist even if the reference image does", function () {
            var status;

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback) {
                successCallback(referenceImage);
            });

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(status).toEqual('error');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });
    });

    describe("Reporting", function () {
        var reporter, diffCanvas;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);
            csscritic.addReporter(reporter);

            diffCanvas = jasmine.createSpy('diffCanvas');
        });

        it("should report a successful comparison", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

        it("should report a canvas showing the difference on a failing comparison", function () {
            var imagediffDiffSpy = spyOn(imagediff, 'diff').andReturn(diffCanvas);
            spyOn(imagediff, 'equal').andReturn(false);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "failed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage,
                differenceImageData: diffCanvas
            });
            expect(imagediffDiffSpy).toHaveBeenCalledWith(htmlImage, referenceImage);
        });

        it("should report a missing reference image", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            });
        });

        it("should provide a appropriately sized page rendering on a missing reference image", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 800, 600, jasmine.any(Function), jasmine.any(Function));
        });

        it("should report an error if the page does not exist", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "error",
                pageUrl: "samplepage.html",
                pageImage: null
            });
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = jasmine.createSpy("newHtmlImage"),
                result;
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                if (width === 16) {
                    callback(newHtmlImage);
                } else {
                    callback(htmlImage);
                }
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
            result = reporter.reportComparison.mostRecentCall.args[0];

            result.resizePageImage(16, 34, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 16, 34, jasmine.any(Function));
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            var storeReferenceImageSpy = spyOn(csscritic.util, 'storeReferenceImage');
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });

            reporter.reportComparison.mostRecentCall.args[0].acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith("differentpage.html", htmlImage);
        });

        it("should provide a list of URLs that couldn't be loaded", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                erroneousPageUrls: ["oneUrl", "anotherUrl"],
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

        it("should provide a list of URLs that couldn't be loaded independently of whether the reference image exists", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                erroneousPageUrls: ["oneUrl", "anotherUrl"],
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            });
        });

        it("should not pass along a list if no errors exist", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

    });

});