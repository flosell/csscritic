describe("Basic HTML reporter", function () {
    "use strict";

    var util = csscriticLib.util(),
        basicHTMLReporterUtil = csscriticLib.basicHTMLReporterUtil(),
        reporter;

    var htmlImage, referenceImage, updatedReferenceImage, differenceImageCanvas, highlightedDifferenceImageCanvas,
        paramsOnPassingTest;

    beforeEach(function () {
        spyOn(basicHTMLReporterUtil, 'supportsReadingHtmlFromCanvas');

        htmlImage = window.document.createElement("img");
        referenceImage = new window.Image();
        updatedReferenceImage = new window.Image();
        differenceImageCanvas = window.document.createElement("canvas");
        highlightedDifferenceImageCanvas = window.document.createElement("canvas");

        spyOn(basicHTMLReporterUtil, 'getDifferenceCanvas').and.callFake(function (imageA, imageB) {
            if (imageA === htmlImage && imageB === referenceImage) {
                return differenceImageCanvas;
            }
        });

        spyOn(basicHTMLReporterUtil, 'getHighlightedDifferenceCanvas').and.callFake(function (imageA, imageB) {
            if (imageA === htmlImage && imageB === referenceImage) {
                return highlightedDifferenceImageCanvas;
            }
        });

        reporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document).BasicHTMLReporter();

        paramsOnPassingTest = {
            status: "passed",
            testCase: {
                url: "page_url"
            },
            pageImage: htmlImage,
            referenceImage: referenceImage
        };
    });

    afterEach(function () {
        $("#csscritic_basichtmlreporter").remove();
    });

    it("should show an entry for the reported test", function () {
        reporter.reportComparison(paramsOnPassingTest);

        expect($("#csscritic_basichtmlreporter")).toExist();
        expect($("#csscritic_basichtmlreporter .comparison")).toExist();
    });

    it("should show the page url", function () {
        reporter.reportComparison({
            status: "passed",
            testCase: {
                url: "page_url<img>"
            },
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual("page_url<img>");
    });

    it("should show a link to the page", function () {
        reporter.reportComparison({
            status: "passed",
            testCase: {
                url: "dir/page_url"
            },
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect($("#csscritic_basichtmlreporter .comparison a.pageUrl")).toHaveAttr("href", "dir/page_url");
    });

    it("should show page render errors", function () {
        var comparison = paramsOnPassingTest;
        comparison.renderErrors = ["theFirstBadUrl", "yetAnotherBadUrl"];

        reporter.reportComparison(comparison);

        expect($("#csscritic_basichtmlreporter .comparison .loadErrors")).toExist();
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors li").length).toEqual(2);
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors li").get(0).textContent).toContain("theFirstBadUrl");
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors li").get(1).textContent).toContain("yetAnotherBadUrl");
    });

    describe("on running tests", function () {

        it("should render all currently running", function () {
            reporter.reportComparisonStarting({
                testCase: {
                    url: "page_url"
                }
            });

            expect($("#csscritic_basichtmlreporter .comparison")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison.running")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual("page_url");
        });

        it("should report the final result 'on top' of the running entry", function () {
            reporter.reportComparisonStarting({
                testCase: {
                    url: "page_url"
                }
            });
            reporter.reportComparison({
                status: "passed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison").length).toEqual(1);
            expect($("#csscritic_basichtmlreporter .comparison.running")).not.toExist();
        });

        it("should show two different entries for different test cases with the same url", function () {
            reporter.reportComparisonStarting({
                testCase: {
                    url: "page_url"
                }
            });
            reporter.reportComparisonStarting({
                testCase: {
                    url: "page_url",
                    active: '.selector'
                }
            });

            reporter.reportComparison({
                status: "passed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            });
            reporter.reportComparison({
                status: "passed",
                testCase: {
                    url: "page_url",
                    active: '.selector'
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison.passed").length).toBe(2);
        });

    });

    describe("on completion", function () {
        it("should render the time taken", function () {
            var dateNowValues = [1000, 2034];
            spyOn(Date, "now").and.callFake(function () {
                return dateNowValues.shift();
            });

            reporter.reportComparisonStarting({
                testCase: {
                    url: "page_url"
                }
            });
            reporter.reportTestSuite({success: true}, function () {});
            expect($("#csscritic_basichtmlreporter .timeTaken")).toExist();
            expect($("#csscritic_basichtmlreporter .timeTaken").text()).toEqual("finished in 1.034s");
        });

        it("should render the time taken as 0 when no test cases given", function () {
            reporter.reportTestSuite({success: true}, function () {});
            expect($("#csscritic_basichtmlreporter .timeTaken")).toExist();
            expect($("#csscritic_basichtmlreporter .timeTaken").text()).toEqual("finished in 0.000s");
        });
    });

    describe("Passed tests", function () {

        it("should show an entry as passed", function () {
            reporter.reportComparison({
                status: "passed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .passed.comparison")).toExist();
        });

        it("should show the status as passed", function () {
            reporter.reportComparison({
                status: "passed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("passed");
        });

    });

    describe("Failed tests", function () {
        var paramsOnFailingTest, resizePageImageSpy, acceptPageSpy;

        beforeEach(function () {
            resizePageImageSpy = jasmine.createSpy("resizePageImage").and.callFake(function () {
                return testHelper.successfulPromiseFake(updatedReferenceImage);
            });
            acceptPageSpy = jasmine.createSpy("acceptPage");

            paramsOnFailingTest = {
                status: "failed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                resizePageImage: resizePageImageSpy,
                acceptPage: acceptPageSpy,
                referenceImage: referenceImage
            };
        });

        it("should show an entry as failed", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .failed.comparison")).toExist();
        });

        it("should show the status as failed", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("failed");
        });

        it("should show the diff on a failing comparison", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .differenceCanvasSection canvas").get(0)).toBe(differenceImageCanvas);
        });

        it("should show the highlighted diff on a failing comparison", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .highlightedDifferenceCanvas").get(0)).toBe(highlightedDifferenceImageCanvas);
        });

        it("should show the rendered page for reference and so that the user can save it", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .currentPageSection img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .currentPageSection img").get(0)).toBe(htmlImage);
        });

        it("should show the reference image", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .referenceSection img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .referenceSection img").get(0)).toBe(referenceImage);
        });

        it("should allow the user to accept the rendered page and update the reference image", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .updateHint button")).toExist();

            $("#csscritic_basichtmlreporter .comparison .updateHint button").click();

            expect(acceptPageSpy).toHaveBeenCalled();
        });

        it("should resize the page canvas when user resizes the container", function () {
            reporter.reportComparison(paramsOnFailingTest);

            $("#csscritic_basichtmlreporter .comparison .currentPageResizableCanvas").css({
                width: 42,
                height: 24
            }).trigger("mouseup");

            expect(resizePageImageSpy).toHaveBeenCalledWith(42, 24);
            expect($("#csscritic_basichtmlreporter .comparison .currentPageSection img")[0]).toBe(updatedReferenceImage);
        });

    });

    describe("Missing image references", function () {
        var paramsOnMissingReference, resizePageImageSpy, acceptPageSpy;

        beforeEach(function () {
            resizePageImageSpy = jasmine.createSpy("resizePageImage").and.callFake(function () {
                return testHelper.successfulPromiseFake(updatedReferenceImage);
            });
            acceptPageSpy = jasmine.createSpy("acceptPage");

            paramsOnMissingReference = {
                status: "referenceMissing",
                testCase: {
                    url: "page_url<img>"
                },
                pageImage: htmlImage,
                resizePageImage: resizePageImageSpy,
                acceptPage: acceptPageSpy
            };
        });

        it("should show an entry as status 'referenceMissing'", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();
        });

        it("should show the status as 'missing reference'", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("missing reference");
        });

        it("should show the rendered page for reference", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .currentPageSection img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .currentPageSection img").get(0)).toBe(htmlImage);
        });

        it("should allow the user to accept the rendered page", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .saveHint button")).toExist();

            $("#csscritic_basichtmlreporter .comparison .saveHint button").click();

            expect(acceptPageSpy).toHaveBeenCalled();
        });

        it("should resize the canvas when user resizes the container", function () {
            reporter.reportComparison(paramsOnMissingReference);

            $("#csscritic_basichtmlreporter .comparison .currentPageResizableCanvas").css({
                width: 42,
                height: 24
            }).trigger("mouseup");

            expect(resizePageImageSpy).toHaveBeenCalledWith(42, 24);
            expect($("#csscritic_basichtmlreporter .comparison .currentPageSection img")[0]).toBe(updatedReferenceImage);
        });

        it("should correctly set the current image size after a resize", function (done) {
            testHelper.createImageOfSize(123, 234, function (img) {
                updatedReferenceImage = img;

                reporter.reportComparison(paramsOnMissingReference);

                $("#csscritic_basichtmlreporter .comparison .currentPageResizableCanvas").css({
                    width: 42,
                    height: 24
                }).trigger("mouseup");

                expect($("#csscritic_basichtmlreporter .comparison .currentPageResizableCanvas").width()).toEqual(123);
                expect($("#csscritic_basichtmlreporter .comparison .currentPageResizableCanvas").height()).toEqual(234);

                done();
            });
        });
    });

    describe("Erroneous tests", function () {
        var paramsOnErroneousTest;

        beforeEach(function () {
            paramsOnErroneousTest = {
                status: "error",
                testCase: {
                    url: "page_url"
                },
                pageImage: null
            };
        });

        it("should show an entry as erroneous", function () {
            reporter.reportComparison(paramsOnErroneousTest);

            expect($("#csscritic_basichtmlreporter .error.comparison")).toExist();
        });

        it("should show the status is 'error'", function () {
            reporter.reportComparison(paramsOnErroneousTest);

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("error");
        });

        it("should say what the error is about", function () {
            reporter.reportComparison(paramsOnErroneousTest);

            expect($("#csscritic_basichtmlreporter .comparison .errorMsg")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .errorMsg").text()).toContain("could not be rendered");
            expect($("#csscritic_basichtmlreporter .comparison .errorMsg").text()).toContain("page_url");
        });

    });

    describe("Mouse over image preview", function () {
        beforeEach(function () {
            reporter.reportComparison({
                status: "passed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            setFixtures('<style>' +
                '#csscritic_basichtmlreporter_tooltip {' +
                '    width: 100px;' +
                '}' +
                '</style>');
        });

        it("should show a preview image on mouse over", function () {
            expect(typeof $("#csscritic_basichtmlreporter .comparison").get(0).onmouseover).toEqual("function");

            $("#csscritic_basichtmlreporter .comparison").get(0).onmouseover({});

            expect($("#csscritic_basichtmlreporter_tooltip")).toBeVisible();
            expect($("#csscritic_basichtmlreporter_tooltip").children().get(0)).toBe(referenceImage);
        });

        it("should hide the tooltip on mouse out", function () {
            $("#csscritic_basichtmlreporter .comparison").get(0).onmouseover({});

            expect($("#csscritic_basichtmlreporter_tooltip")).toBeVisible();

            $("#csscritic_basichtmlreporter .comparison").get(0).onmouseout();

            expect($("#csscritic_basichtmlreporter_tooltip")).not.toBeVisible();
        });
    });

    describe("Browser compatibility warning", function () {
        afterEach(function () {
            $(".browserWarning").remove();
        });

        it("should show a warning if the browser is not supported", function () {
            basicHTMLReporterUtil.supportsReadingHtmlFromCanvas.and.callFake(function (callback) {
                callback(false);
            });

            reporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document).BasicHTMLReporter();

            expect($(".browserWarning")).toExist();
        });

        it("should not show a warning if the browser is supported", function () {
            basicHTMLReporterUtil.supportsReadingHtmlFromCanvas.and.callFake(function (callback) {
                callback(true);
            });

            reporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document).BasicHTMLReporter();

            expect($(".browserWarning")).not.toExist();
        });
    });
});
