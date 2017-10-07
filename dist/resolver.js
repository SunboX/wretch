import { mix } from "./mix";
import conf from "./config";
import perfs from "./perfs";
export var resolver = function (url) { return function (catchers) {
    if (catchers === void 0) { catchers = new Map(); }
    return function (opts) {
        if (opts === void 0) { opts = {}; }
        var finalOpts = mix(conf.defaults, opts);
        var fetchController = conf.polyfill("AbortController", false, true);
        if (!finalOpts["signal"] && fetchController) {
            finalOpts["signal"] = fetchController.signal;
        }
        var req = conf.polyfill("fetch")(url, finalOpts);
        var wrapper = req.then(function (response) {
            if (!response.ok) {
                return response[conf.errorType || "text"]().then(function (_) {
                    var err = new Error(_);
                    err[conf.errorType] = _;
                    err["status"] = response.status;
                    err["response"] = response;
                    throw err;
                });
            }
            return response;
        });
        var nameCatchers = new Map();
        var doCatch = function (promise) {
            return promise.catch(function (err) {
                if (catchers.has(err.status))
                    catchers.get(err.status)(err);
                else if (nameCatchers.has(err.name))
                    nameCatchers.get(err.name)(err);
                else
                    throw err;
            });
        };
        var wrapTypeParser = function (funName) { return function (cb) { return funName ?
            doCatch(wrapper.then(function (_) { return _ && _[funName](); }).then(function (_) { return _ && cb && cb(_) || _; })) :
            doCatch(wrapper.then(function (_) { return _ && cb && cb(_) || _; })); }; };
        var responseChain = {
            /**
             * Retrieves the raw result as a promise.
             */
            res: wrapTypeParser(null),
            /**
             * Retrieves the result as a parsed JSON object.
             */
            json: wrapTypeParser("json"),
            /**
             * Retrieves the result as a Blob object.
             */
            blob: wrapTypeParser("blob"),
            /**
             * Retrieves the result as a FormData object.
             */
            formData: wrapTypeParser("formData"),
            /**
             * Retrieves the result as an ArrayBuffer object.
             */
            arrayBuffer: wrapTypeParser("arrayBuffer"),
            /**
             * Retrieves the result as a string.
             */
            text: wrapTypeParser("text"),
            /**
             * Performs a callback on the API performance timings of the request.
             *
             * Warning: Still experimental on browsers and node.js
             */
            perfs: function (cb) {
                req.then(function (res) { return perfs.observe(res.url, cb); });
                return responseChain;
            },
            /**
             * Aborts the request after a fixed time.
             *
             * @param time Time in milliseconds
             * @param controller A custom controller
             */
            setTimeout: function (time, controller) {
                if (controller === void 0) { controller = fetchController; }
                setTimeout(function () { return controller.abort(); }, time);
                return responseChain;
            },
            /**
             * Returns the automatically generated AbortController alongside the current wretch response as a pair.
             */
            controller: function () { return [fetchController, responseChain]; },
            /**
             * Catches an http response with a specific error code and performs a callback.
             */
            error: function (code, cb) {
                typeof code === "string" ?
                    nameCatchers.set(code, cb) :
                    catchers.set(code, cb);
                return responseChain;
            },
            /**
             * Catches a bad request (http code 400) and performs a callback.
             */
            badRequest: function (cb) { return responseChain.error(400, cb); },
            /**
             * Catches an unauthorized request (http code 401) and performs a callback.
             */
            unauthorized: function (cb) { return responseChain.error(401, cb); },
            /**
             * Catches a forbidden request (http code 403) and performs a callback.
             */
            forbidden: function (cb) { return responseChain.error(403, cb); },
            /**
             * Catches a "not found" request (http code 404) and performs a callback.
             */
            notFound: function (cb) { return responseChain.error(404, cb); },
            /**
             * Catches a timeout (http code 408) and performs a callback.
             */
            timeout: function (cb) { return responseChain.error(408, cb); },
            /**
             * Catches an internal server error (http code 500) and performs a callback.
             */
            internalError: function (cb) { return responseChain.error(500, cb); },
            /**
             * Catches an AbortError and performs a callback.
             */
            onAbort: function (cb) { return responseChain.error("AbortError", cb); }
        };
        return responseChain;
    };
}; };
//# sourceMappingURL=resolver.js.map