// @bun
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/iso.js
var exports_iso = {};
__export(exports_iso, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/coerce.js
var exports_coerce = {};
__export(exports_coerce, {
  bigint: () => bigint2,
  boolean: () => boolean3,
  date: () => date3,
  number: () => number3,
  string: () => string3
});

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => ("headers" in request);
var parseBody = async (request, options = Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded")
    return parseFormData(request, {
      all,
      dot
    });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData)
    return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request))
    request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData)
    return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]")))
      form[key] = value;
    else
      handleParsingAllValues(form, key, value);
  });
  if (options.dot)
    Object.entries(form).forEach(([key, value]) => {
      if (key.includes(".")) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== undefined) {
    if (Array.isArray(form[key]))
      form[key].push(value);
    else
      form[key] = [form[key], value];
  } else if (!key.endsWith("[]"))
    form[key] = value;
  else
    form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key))
    return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33)
    throwNestingLimitExceeded();
  keys.forEach((key, index) => {
    if (index === keys.length - 1)
      nestedForm[key] = value;
    else {
      if (!nestedForm[key] || typeof nestedForm[key] !== "object" || Array.isArray(nestedForm[key]) || nestedForm[key] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS)
          throwNestingLimitExceeded();
        nestedForm[key] = Object.create(null);
      }
      nestedForm = nestedForm[key];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "")
    paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return {
    groups,
    path
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1;i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1;j >= 0; j--)
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*")
    return "*";
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match[2])
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
          cacheKey,
          match[1],
          new RegExp(`^${match[2]}(?=/${next})`)
        ] : [
          label,
          match[1],
          new RegExp(`^${match[2]}$`)
        ];
      else
        patternCache[cacheKey] = [
          label,
          match[1],
          true
        ];
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match) => {
      try {
        return decoder(match);
      } catch {
        return match;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (;i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? undefined : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35)
      break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length)
    sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":"))
    return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment))
      basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "")
          results.push("/");
        else
          results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else
        basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1)
    value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1)
    url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex = url.indexOf("?", 8);
    if (keyIndex === -1)
      return;
    if (!url.startsWith(key, keyIndex + 1))
      keyIndex = url.indexOf(`&${key}`, keyIndex + 1);
    while (keyIndex !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? undefined : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode))
        return "";
      keyIndex = url.indexOf(`&${key}`, keyIndex + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded)
      return;
  }
  const results = Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1)
      valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? undefined : nextKeyIndex : valueIndex);
    if (encoded)
      name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "")
      continue;
    let value;
    if (valueIndex === -1)
      value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? undefined : nextKeyIndex);
      if (encoded)
        value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name])))
        results[name] = [];
      results[name].push(value);
    } else
      results[name] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request.js
var HonoRequest = class {
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== undefined)
        decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name)
      return this.raw.headers.get(name) ?? undefined;
    const headerData = Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody)
      return cachedBody;
    for (const anyCachedKey in bodyCache)
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json")
          body = JSON.stringify(body);
        const contentType = anyCachedKey === "formData" ? undefined : raw.headers.get("content-type");
        return new Response(body, { headers: contentType ? { "Content-Type": contentType } : undefined })[key]();
      });
    return bodyCache[key] = raw[key]();
  };
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise))
      str = str.toString();
    if (str instanceof Promise)
      str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length)
    return Promise.resolve(str);
  if (buffer)
    buffer[0] += str;
  else
    buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str) => resolveCallback(str, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks)
    return raw(await resStr, callbacks);
  else
    return resStr;
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no ExecutionContext");
  }
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type")
          continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies)
            _res.headers.append("set-cookie", cookie);
        } else
          _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  setLayout = (layout) => this.#layout = layout;
  getLayout = () => this.#layout;
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  header = (name, value, options) => {
    if (this.finalized)
      this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers;
    if (value === undefined)
      headers.delete(name);
    else if (options?.append)
      headers.append(name, value);
    else
      headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map;
    this.#var.set(key, value);
  };
  get = (key) => {
    return this.#var ? this.#var.get(key) : undefined;
  };
  get var() {
    if (!this.#var)
      return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers;
      for (const [key, value] of new Headers(arg.headers))
        if (key === "set-cookie")
          responseHeaders.append(key, value);
        else
          responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers)
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers;
            break;
          }
      }
      if (responseHeaders)
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string")
            responseHeaders.set(k, v);
          else {
            responseHeaders.delete(k);
            for (const v2 of v)
              responseHeaders.append(k, v2);
          }
        }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index)
        throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else
        handler = i === middleware.length && next || undefined;
      if (handler)
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else
            throw err;
        }
      else if (context.finalized === false && onNotFound)
        res = await onNotFound(context);
      if (res && (context.finalized === false || isError))
        context.res = res;
      return context;
    }
  };
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string")
          this.#path = args1;
        else
          this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers)
            this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string")
        this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app) {
    const subApp = this.basePath(path);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler)
        handler = r.handler;
      else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function")
        optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false)
          replaceRequest = (request) => request;
        else
          replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options = optionHandler(c);
      return Array.isArray(options) ? options : [options];
    } : (c) => {
      let executionContext = undefined;
      try {
        executionContext = c.executionCtx;
      } catch {}
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res)
        return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== undefined ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error)
      return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD")
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized)
          throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request)
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, undefined, event.request.method));
    });
  };
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/utils.js
var createNullObject = () => Object.create(null);

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match = (method, path) => {
    const matcher = matchers[method] || matchers["ALL"];
    const staticMatch = matcher[2][path];
    if (staticMatch)
      return staticMatch;
    const match = path.match(matcher[0]);
    if (!match)
      return [[], emptyParam];
    const index = match.indexOf("", 1);
    return [matcher[1][index], match];
  };
  this.match = match;
  return match(method, path);
}

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1)
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1)
    return 1;
  if (a === ".*" || a === "(?:|/.*)")
    return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)")
    return -1;
  if (a === "[^/]+")
    return 1;
  else if (b === "[^/]+")
    return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class Node {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length;i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (regexpStr === ".*")
            throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr))
            throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr))
            throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children)
              if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)")
                throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node;
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children)
            if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)")
              throw PATH_ERROR;
          nextNode = node.#children[token] = new Node;
        }
      }
      node = nextNode;
    }
    if (node.#index !== undefined)
      throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1)
      strList.unshift(`#${this.#index}`);
    if (strList.length === 0)
      return "";
    if (strList.length === 1)
      return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node;
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0;; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced)
        break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1;i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1;j >= 0; j--)
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "")
      return [
        /^$/,
        [],
        []
      ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== undefined) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== undefined) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(`^${path.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match, metaChar) => metaChar ? `\\${metaChar}` : match === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length))
    if (buildWildcardRegExp(k).test(path))
      return [...middleware[k]];
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie;
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*")
      path = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods)
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware["ALL"], path) || [];
        }
      for (const handlerMap of [middleware, routes])
        for (const m of methods)
          for (const p in handlerMap[m])
            re.test(p) && handlerMap[m][p].push([handler, path]);
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path of paths)
      for (const m of methods) {
        if (!routes[m][path]) {
          this.#insertPath(m, path);
          routes[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware["ALL"], path) || [];
        }
        routes[m][path].push([handler, path]);
      }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes))
      matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = undefined;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes])
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [h, trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
          map[key] = paramReplacementMap[pathData[1][i][1]];
          return map;
        }, createNullObject())]);
      }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes)
      throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (;i < len; i++) {
      const router = routers[i];
      try {
        for (let i = 0, len = routes.length;i < len; i++)
          router.add(...routes[i]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError)
          continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = undefined;
      break;
    }
    if (i === len)
      throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1)
      throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class Node {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set;
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === undefined && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node;
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam)
        possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length;i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i = 0, len = handlerSet.possibleKeys.length;i < len; i++) {
          const key = handlerSet.possibleKeys[i];
          handlerSet.params[key] = params?.[key] && !i ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0;i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length;j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"])
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else
            tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true)
            continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0;p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1])
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node2;
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path])
      this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../OPAL/node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter, new TrieRouter] });
  }
};

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array, separator = "|") {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}

class Cached {
  constructor(getter) {
    this._getter = getter;
    this._value = undefined;
  }
  get value() {
    const getter = this._getter;
    if (getter !== undefined) {
      this._value = getter();
      this._getter = undefined;
    }
    return this._value;
  }
}
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object, key, getter) {
  let value = undefined;
  Object.defineProperty(object, key, {
    get() {
      if (value === EVALUATING) {
        return;
      }
      if (value === undefined) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
function mirrorProps(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source[key]);
    else
      putProp(target, key, desc.value);
  }
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== undefined && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({ type: "nonoptional", innerType: value }));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function sizeCaps(defChecks) {
  const caps = [];
  for (const ch of defChecks ?? []) {
    const d = ch._zod.def;
    if (!/_(length|size)$|_equals$/.test(d.check))
      break;
    const max = d.maximum ?? d.length ?? d.size;
    if (max >= 0)
      caps.push([max, ch]);
  }
  return caps;
}
function attachSchema(issues, start, inst) {
  var _a;
  for (let i = start;i < issues.length; i++) {
    (_a = issues[i]).schema ?? (_a.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config) {
  var _a;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a = iss).schema ?? (_a.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : undefined;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0;i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
function derived(computes, table) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table;
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? undefined : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = undefined;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: undefined };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = () => value;
  fn[CONSTANT_CATCH] = true;
  return fn;
}

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/core.js
var _a;
var _zodDesc = { value: undefined, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition;
      }
      try {
        return new Definition;
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition;
}
function $constructor(name, initializer, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = new Set;
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && new WeakSet;
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = undefined;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer(inst, def);
    if (initialized) {
      const own = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto = _.prototype;
    for (const k in proto) {
      if (!Object.prototype.hasOwnProperty.call(proto, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = undefined;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: undefined, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = undefined;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, undefined, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error, path = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node = curr[el];
            if (terminal) {
              node._errors.push(mapper(issue));
            }
            curr = node;
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError;
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
function failure(Err, issues, ctx) {
  let error;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = undefined;
        ctx = undefined;
      }
      return error;
    },
    set error(e) {
      error = e;
      issues = undefined;
      ctx = undefined;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = (schema, value, _ctx) => {
  const validator = schema._zod.bag.validator;
  if (validator !== undefined) {
    if (validator(value) !== COMPILE_INVALID)
      return true;
    if (validator.definite === true && _ctx === undefined)
      return false;
  }
  return validateFallback(schema, value, _ctx);
};
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length === 0;
}
var validateAsync = async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
};
var _encode = (_Err) => {
  const parse = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decode = (_Err) => {
  const parse = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    return parse(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _encodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
  return new RegExp(`^${source}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== undefined;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join(`
`)}
};`);
    return factory(...Object.values(this.closed));
  }
}

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 7
};

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary) => {
            return handleCanaryResult(canary, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result) => runChecks(result, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {}
      return validateAsync2(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function canParseURL(input) {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function")
      return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
function validateURL(trimmed, def) {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL;
      if (typeof URLStatic.parse === "function")
        return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
  hostname.lastIndex = 0;
  return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url = validateURL(trimmed, def);
      if (url === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }
      if (def.hostname && !urlHostnameOk(url, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== undefined && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === undefined ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts = value.split("/");
  if (parts.length !== 2)
    return false;
  const [address, prefix] = parts;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {}
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {}
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function capSize(inst, size) {
  const caps = sizeCaps(inst._zod.def.checks);
  if (!caps.length)
    return;
  const cap = Math.min(...caps.map((c) => c[0]));
  const parse = inst._zod.parse;
  inst._zod.parse = (payload, ctx) => {
    const n = size(payload.value);
    if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
      for (const [max, ch] of sizeCaps(inst._zod.def.checks)) {
        if (n > max && ch._zod.def.when(payload)) {
          const start = payload.issues.length;
          ch._zod.check(payload);
          payload.issues[start].continue = false;
          attachSchema(payload.issues, start, inst);
          return payload;
        }
      }
    }
    return parse(payload, ctx);
  };
}
var arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
  capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== undefined && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === undefined) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: undefined,
        path: [key]
      });
    }
    return;
  }
  if (result.value === undefined) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = undefined;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, new Set);
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== undefined)
          propValues[key].add(undefined);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo = globalConfig.memoizer;
  const generateFastpass = (shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo, syms });
    const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== undefined;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== undefined) ? "optional" : undefined);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results, payload, inst, ctx);
    });
  };
});
function discriminatorMap(def) {
  const map = new Map;
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map.has(value)) {
        if (value !== undefined)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map.set(value, null);
      } else {
        map.set(value, option);
      }
    }
  }
  return map;
}
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(undefined))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, new Set);
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(undefined);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const value = input?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== undefined || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value) => disc.value.get(value) !== null),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left, right]) => {
        return handleIntersectionResults(payload, left, right);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = new Map;
  let unrecIssue;
  const keyIssues = new Map;
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
  $ZodType.init(inst, def);
  const items = def.items;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        input,
        inst,
        expected: "tuple",
        code: "invalid_type"
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, [], ctx) : [];
    const proms = [];
    const optinStart = getTupleOptStart(items, "optin");
    const optoutStart = getTupleOptStart(items, "optout");
    if (!def.rest) {
      if (input.length < optinStart) {
        payload.issues.push({
          code: "too_small",
          minimum: optinStart,
          inclusive: true,
          input,
          inst,
          origin: "array"
        });
        return payload;
      }
      if (input.length > items.length) {
        payload.issues.push({
          code: "too_big",
          maximum: items.length,
          inclusive: true,
          input,
          inst,
          origin: "array"
        });
      }
    }
    const itemResults = new Array(items.length);
    const abortEarly = def.rest ? ctx?.abortEarly : undefined;
    let itemAborted = false;
    for (let i = 0;i < items.length; i++) {
      const r = items[i]._zod.run({ value: input[i], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((rr) => {
          itemResults[i] = rr;
        }));
      } else {
        itemResults[i] = r;
        if (abortEarly && !itemAborted && r.issues.length)
          itemAborted = aborted(r);
      }
    }
    if (def.rest && !itemAborted) {
      let i = items.length - 1;
      const rest = input.slice(items.length);
      let seen = payload.issues.length;
      for (const el of rest) {
        if (abortEarly && payload.issues.length !== seen) {
          if (aborted(payload, seen))
            break;
          seen = payload.issues.length;
        }
        i++;
        const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((r) => handleTupleResult(r, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
    }
    return handleTupleResults(itemResults, payload, items, input, optoutStart);
  };
});
function getTupleOptStart(items, key) {
  for (let i = items.length - 1;i >= 0; i--) {
    const omittable = key === "optin" ? items[i]._zod.optin !== undefined : items[i]._zod.optout === "optional";
    if (!omittable)
      return i + 1;
  }
  return 0;
}
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input, optoutStart) {
  for (let i = 0;i < items.length; i++) {
    const r = itemResults[i];
    const isPresent = i < input.length;
    if (!isPresent && i >= optoutStart && items[i]._zod.optin === "optional") {
      final.value.length = i;
      break;
    }
    if (r.issues.length) {
      if (!isPresent && i >= optoutStart) {
        final.value.length = i;
        break;
      }
      final.issues.push(...prefixIssues(i, r.issues));
    }
    final.value[i] = r.value;
  }
  for (let i = final.value.length - 1;i >= input.length; i--) {
    if (items[i]._zod.optout === "optional" && final.value[i] === undefined) {
      final.value.length = i;
    } else {
      break;
    }
  }
  return final;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = new Set;
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result) => {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[outKey] = result.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result) => {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? undefined : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? new Set([...values, undefined]) : undefined;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === undefined) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result) => handleOptionalResult(payload, result));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleDefaultResult(result, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleNonOptionalResult(result, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleCatchResult(payload, result, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazyInternal(inst, "pattern", (zod) => zod.innerType?._zod?.pattern);
  defineLazyInternal(inst, "propValues", (zod) => zod.innerType?._zod?.propValues);
  defineLazyInternal(inst, "optin", (zod) => zod.innerType?._zod?.optin ?? undefined);
  defineLazyInternal(inst, "optout", (zod) => zod.innerType?._zod?.optout ?? undefined);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/memoizer.js
class $ZodCyclicError extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
}
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap;
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve) {
  const cached = recursive.get(inst);
  if (cached !== undefined)
    return cached ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check = (child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result)
        result = answer;
    }
  };
  const shape = (sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  };
  const merge = (answer) => {
    if (answer > result)
      result = answer;
  };
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge(raw ? shape(raw, true) : ASSUMED);
      check(def.catchall);
      break;
    }
    case "array":
      check(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check(el);
      check(def.rest);
      break;
    case "record":
    case "map":
      check(def.keyType);
      check(def.valueType);
      break;
    case "set":
      check(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check(el);
      break;
    case "intersection":
      check(def.left);
      check(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check(def.innerType);
      break;
    case "pipe":
      check(def.in);
      check(def.out);
      break;
    case "function":
      check(def.input);
      check(def.output);
      break;
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : undefined);
      merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    case "template_literal":
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check(value);
        else if (Array.isArray(value))
          for (const el of value)
            check(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = new WeakMap;
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = undefined;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a;
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError;
        return base(payload, ctx);
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (isRecursiveInst === undefined) {
          const walked = isRecursive(inst, new Set, false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input = payload.value;
        if (!isRef(input))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: new WeakMap, backEdges: undefined };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = new WeakSet);
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = undefined;
        const entry = open.length > depth ? open.pop() : undefined;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== undefined && isRef(value) && backEdges.has(value);
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/locales/en.js
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    currency_code: "currency code",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  function getTypeName(type, input) {
    if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
      return String(input);
    }
    return TypeDictionary[type] ?? type;
  }
  return (issue) => {
    switch (issue.code) {
      case "invalid_type": {
        const expected = getTypeName(issue.expected);
        const receivedType = parsedType(issue.input);
        const received = getTypeName(receivedType, issue.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
      case "too_big": {
        const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
        const sizing = getSizing(issue.origin);
        if (sizing)
          return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
        const sizing = getSizing(issue.origin);
        if (sizing) {
          return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue.origin}`;
      case "invalid_union":
        if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
          const opts = issue.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/registries.js
var _a2;
class $ZodRegistry {
  constructor() {
    this._map = new WeakMap;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new WeakMap;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
function _string(Class, params) {
  return new Class(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
function _coercedString(Class, params) {
  return new Class(snapshotChecks({ type: "string", coerce: true, ...normalizeParams(params) }));
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
function _coercedNumber(Class, params) {
  return new Class(snapshotChecks({ type: "number", coerce: true, checks: [], ...normalizeParams(params) }));
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _coercedBoolean(Class, params) {
  return new Class({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _coercedBigint(Class, params) {
  return new Class({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _null2(Class, params) {
  return new Class({
    type: "null",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _coercedDate(Class, params) {
  return new Class({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _slugify() {
  return _overwrite((input) => slugify(input));
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn, params) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source)) {
      if (Object.prototype.propertyIsEnumerable.call(source, key)) {
        assignProp(target, key, source[key]);
      }
    }
  }
  return target;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {}),
    io: params?.io ?? "output",
    counter: 0,
    seen: new Map,
    sharedDefsExtractedFor: undefined,
    sharedEmitDoneFor: undefined,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? undefined
  };
}
function handleUnrepresentable(schema, ctx, json, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === undefined || result === "throw")
    throw new Error(message);
  Object.assign(json, result);
  return true;
}
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = undefined;
  ctx.sharedEmitDoneFor = undefined;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema);
  if (meta)
    assignProps(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a = result.schema).default ?? (_a.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = new Map;
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id) => id);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema = seen.schema;
    for (const key in schema) {
      delete schema[key];
    }
    schema.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error("Cycle detected: " + `#/${seen.cycle?.join("/")}/<root>` + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== undefined)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === undefined || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
function foldObjects(members) {
  const objects = [];
  for (const member of members) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties = {};
  const required = new Set;
  for (const object of objects) {
    for (const key in object.properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key))
        continue;
      const parts = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === undefined)
          continue;
        if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts.push(part);
      }
      const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
      assignProp(properties, key, merged);
    }
    for (const key of object.required ?? [])
      required.add(key);
  }
  const folded = { type: "object", properties };
  if (required.size)
    folded.required = [...required];
  if (objects.every((object) => object.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object of objects) {
      const constraint = undeclaredConstraint(object);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
function foldIntersection(json) {
  const allOf = json.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
    if (Object.keys(union).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union);
    const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json.allOf;
  assignProps(json, folded);
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema = seen.def ?? seen.schema;
    const _cached = { ...schema };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema.allOf = schema.allOf ?? [];
        schema.allOf.push(refSchema);
      } else {
        assignProps(schema, refSchema);
      }
      assignProps(schema, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema,
      path: seen.path ?? []
    });
  };
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = new Map;
      for (const seen of ctx.seen.values()) {
        for (const json of [seen.schema, seen.def]) {
          const allOf = json?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json);
          else
            carriers.set(allOf, [json]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json of carriers.get(allOf) ?? [])
          foldIntersection(json);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {}
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== undefined && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {} else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: new Set };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
  if (agg[key] === undefined || value > agg[key])
    agg[key] = value;
};
var narrowMax = (agg, key, value) => {
  if (agg[key] === undefined || value < agg[key])
    agg[key] = value;
};
var narrowBoth = (agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
  agg.patterns ?? (agg.patterns = new Set);
  agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
  agg.format = format;
  if (format.includes("int"))
    agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
};
var contributors = {
  greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
  less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
  multiple_of: (agg, def) => addDivisor(agg, def.value),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: (agg, def) => narrowBoth(agg, def.length),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: (agg, def) => narrowBoth(agg, def.size),
  string_format: (agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  },
  mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== undefined)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== undefined)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== undefined)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== undefined)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== undefined)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== undefined) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
};
var exactPatterns = new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time" || laxFormat) {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json.allOf = [
        ...patternList.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = new Set;
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== undefined)
      json.multipleOf = first;
    if (rest.length)
      json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var bigintProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "BigInt cannot be represented in JSON Schema");
};
var nullProcessor = (_schema, ctx, json, _params) => {
  if (ctx.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var dateProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Date cannot be represented in JSON Schema");
};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === undefined) {
      if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {} else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var customProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json.type = "object";
  json.properties = {};
  for (const key in shape) {
    assignProp(json.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const requiredKeys = [];
  for (const key of Object.keys(shape)) {
    const field = def.shape[key];
    if (ctx.io === "input" ? inputOptin(field) === undefined : field._zod.optout === undefined) {
      requiredKeys.push(key);
    }
  }
  if (requiredKeys.length > 0) {
    json.required = requiredKeys;
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => ("allOf" in val) && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
  ctx.intersections.push(allOf);
};
var tupleProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? processSchema(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  let minItems = def.items.length;
  while (minItems > 0) {
    const item = def.items[minItems - 1];
    const optional = ctx.io === "input" ? inputOptin(item) !== undefined : item._zod.optout === "optional";
    if (!optional)
      break;
    minItems--;
  }
  const maxItems = def.items.length;
  const isClosed = !def.rest;
  if (ctx.target === "draft-2020-12") {
    json.prefixItems = prefixItems;
    if (isClosed) {
      json.items = false;
    } else if (rest) {
      json.items = rest;
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  } else if (ctx.target === "openapi-3.0") {
    json.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json.items.anyOf.push(rest);
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  } else {
    json.items = prefixItems;
    if (isClosed) {
      json.additionalItems = false;
    } else if (rest) {
      json.additionalItems = rest;
    }
    if (minItems > 0)
      json.minItems = minItems;
    if (isClosed)
      json.maxItems = maxItems;
  }
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
};
function stringifyKeyNames(bySchema, json, visited) {
  if (json.$ref) {
    if (visited.has(json))
      return json;
    visited.add(json);
    const def = bySchema.get(json)?.def;
    if (!def)
      return json;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json = { ...json, [keyword]: mapped };
  }
  const types = Array.isArray(json.type) ? json.type : [json.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json.enum ?? (json.const !== undefined ? [json.const] : undefined);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
var pendingRecords = new WeakMap;
function rewriteKeyNames(ctx) {
  const bySchema = new Map;
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = new Map;
  for (const record of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, new Set);
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
var recordProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== undefined;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues.map(String);
    }
  }
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json.default = value;
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json._prefault = value;
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(undefined);
  } catch {
    handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
  _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
  _lazyMethod(proto, "addIssue", (self) => (issue) => {
    self.issues.push(issue);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self) => (issues) => {
    self.issues.push(...issues);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, undefined, {
  Parent: Error
});

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta) {
    reg.add(this, meta);
    return this;
  },
  refine(check, params) {
    return this.check(refine(check, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(_overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(undefined).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  get "~standard"() {
    return hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  },
  parse: function _parse(data, params) {
    return parse2(this, data, params, { callee: _parse });
  },
  parseAsync: async function _parseAsync(data, params) {
    return await parseAsync(this, data, params, { callee: _parseAsync });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: function _encode(data, params) {
    return encode(this, data, params, { callee: _encode });
  },
  decode: function _decode(data, params) {
    return decode(this, data, params, { callee: _decode });
  },
  encodeAsync: async function _encodeAsync(data, params) {
    return await encodeAsync(this, data, params, { callee: _encodeAsync });
  },
  decodeAsync: async function _decodeAsync(data, params) {
    return await decodeAsync(this, data, params, { callee: _decodeAsync });
  },
  safeEncode(data, params) {
    return safeEncode(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  get description() {
    return globalRegistry.get(this)?.description;
  },
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /* @__PURE__ */ derived({
  format: (inst) => aggregateChecks(inst).format ?? null,
  minLength: (inst) => aggregateChecks(inst).minimum ?? null,
  maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
  regex(...args) {
    return this.check(_regex(...args));
  },
  includes(...args) {
    return this.check(_includes(...args));
  },
  startsWith(...args) {
    return this.check(_startsWith(...args));
  },
  endsWith(...args) {
    return this.check(_endsWith(...args));
  },
  min(...args) {
    return this.check(_minLength(...args));
  },
  max(...args) {
    return this.check(_maxLength(...args));
  },
  length(...args) {
    return this.check(_length(...args));
  },
  nonempty(...args) {
    return this.check(_minLength(1, ...args));
  },
  lowercase(params) {
    return this.check(_lowercase(params));
  },
  uppercase(params) {
    return this.check(_uppercase(params));
  },
  trim() {
    return this.check(_trim());
  },
  normalize(...args) {
    return this.check(_normalize(...args));
  },
  toLowerCase() {
    return this.check(_toLowerCase());
  },
  toUpperCase() {
    return this.check(_toUpperCase());
  },
  slugify() {
    return this.check(_slugify());
  }
}));
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(_email(ZodEmail, params));
  },
  url(params) {
    return this.check(_url(ZodURL, params));
  },
  jwt(params) {
    return this.check(_jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(_emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(_guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(_uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(_uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(_uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(_uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(_nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(_cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(_cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(_ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(_base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(_base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(_xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(_ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(_ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(_ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(_cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(_cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(_e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(_isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(_isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(_isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(_isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
  inst.isFinite = true;
}, /* @__PURE__ */ derived({
  minValue: (inst) => {
    const { minimum, exclusiveMinimum } = aggregateChecks(inst);
    return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
  },
  maxValue: (inst) => {
    const { maximum, exclusiveMaximum } = aggregateChecks(inst);
    return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
  },
  isInt: (inst) => {
    const { isInt, multipleOf } = aggregateChecks(inst);
    return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
  },
  format: (inst) => aggregateChecks(inst).format ?? null
}, {
  gt(value, params) {
    return this.check(_gt(value, params));
  },
  gte(value, params) {
    return this.check(_gte(value, params));
  },
  min(value, params) {
    return this.check(_gte(value, params));
  },
  lt(value, params) {
    return this.check(_lt(value, params));
  },
  lte(value, params) {
    return this.check(_lte(value, params));
  },
  max(value, params) {
    return this.check(_lte(value, params));
  },
  int(params) {
    return this.check(int(params));
  },
  safe(params) {
    return this.check(int(params));
  },
  positive(params) {
    return this.check(_gt(0, params));
  },
  nonnegative(params) {
    return this.check(_gte(0, params));
  },
  negative(params) {
    return this.check(_lt(0, params));
  },
  nonpositive(params) {
    return this.check(_lte(0, params));
  },
  multipleOf(value, params) {
    return this.check(_multipleOf(value, params));
  },
  step(value, params) {
    return this.check(_multipleOf(value, params));
  },
  finite() {
    return this;
  }
}));
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ $constructor("ZodBigInt", (inst, def) => {
  $ZodBigInt.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => bigintProcessor(inst, ctx, json, params);
}, /* @__PURE__ */ derived({
  minValue: (inst) => aggregateChecks(inst).minimum ?? null,
  maxValue: (inst) => aggregateChecks(inst).maximum ?? null,
  format: (inst) => aggregateChecks(inst).format ?? null
}, {
  gte(value, params) {
    return this.check(_gte(value, params));
  },
  min(value, params) {
    return this.check(_gte(value, params));
  },
  gt(value, params) {
    return this.check(_gt(value, params));
  },
  lt(value, params) {
    return this.check(_lt(value, params));
  },
  lte(value, params) {
    return this.check(_lte(value, params));
  },
  max(value, params) {
    return this.check(_lte(value, params));
  },
  positive(params) {
    return this.check(_gt(BigInt(0), params));
  },
  negative(params) {
    return this.check(_lt(BigInt(0), params));
  },
  nonpositive(params) {
    return this.check(_lte(BigInt(0), params));
  },
  nonnegative(params) {
    return this.check(_gte(BigInt(0), params));
  },
  multipleOf(value, params) {
    return this.check(_multipleOf(value, params));
  }
}));
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
  $ZodDate.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => dateProcessor(inst, ctx, json, params);
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
}, /* @__PURE__ */ derived({
  minDate: (inst) => {
    const { minimum } = aggregateChecks(inst);
    return minimum ? new Date(minimum) : null;
  },
  maxDate: (inst) => {
    const { maximum } = aggregateChecks(inst);
    return maximum ? new Date(maximum) : null;
  }
}, {}));
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(_minLength(n, params));
  },
  nonempty(params) {
    return this.check(_minLength(1, params));
  },
  max(n, params) {
    return this.check(_maxLength(n, params));
  },
  length(n, params) {
    return this.check(_length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
  keyof() {
    return _enum(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(mergeDefs(this._zod.def, { catchall: undefined }));
  },
  extend(incoming) {
    return extend(this, incoming);
  },
  safeExtend(incoming) {
    return safeExtend(this, incoming);
  },
  merge(other) {
    return merge(this, other);
  },
  pick(mask) {
    return pick(this, mask);
  },
  omit(mask) {
    return omit(this, mask);
  },
  partial(...args) {
    return partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: never(),
    ...normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => tupleProcessor(inst, ctx, json, params);
}, {
  rest(rest) {
    return this.clone({
      ...this._zod.def,
      rest
    });
  },
  partial() {
    const def = this._zod.def;
    if (def.checks?.length)
      throw new Error(".partial() cannot be used on tuple schemas containing refinements");
    return this.clone({
      ...def,
      items: def.items.map((item) => new ZodOptional({ type: "optional", innerType: item }))
    });
  }
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/iso.js
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
function date2(params) {
  return _isoDate(ZodISODate, params);
}
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}
// ../../OPAL/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/classic/coerce.js
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint2(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date3(params) {
  return _coercedDate(ZodDate, params);
}
// ../../OPAL/packages/shared/src/op.ts
function op(c) {
  return c;
}
function pathParams(path) {
  return [...path.matchAll(/:([A-Za-z_]\w*)/g)].map((m) => m[1]);
}
var zId = exports_coerce.number().int().positive();
var zEmpty = object({});
var zOk = object({ ok: literal(true) });
var zPageInput = object({
  cursor: string2().optional(),
  limit: exports_coerce.number().int().min(1).max(500).default(100)
});
function zPage(item) {
  return object({ items: array(item), next: string2().nullable() });
}
// ../../OPAL/packages/shared/src/qty.ts
var QTY_DECIMALS = 4;
var QTY_SCALE = 10 ** QTY_DECIMALS;
var DECIMAL = /^-?\d+(\.\d{1,4})?$/;
var zQty = string2().regex(DECIMAL, "Quantity must be a decimal with at most 4 places");
// ../../OPAL/packages/shared/src/time.ts
var zTimestamp = exports_iso.datetime({ offset: false });
// ../../OPAL/packages/shared/src/designators.ts
var DESIGNATOR_PREFIXES = ["OPAL", "WO", "IT", "RISK", "REQ", "T", "PO"];
var STORED_DIGITS = 10;
var ALT = DESIGNATOR_PREFIXES.join("|");
var ANY_WIDTH = new RegExp(`^(${ALT})-(\\d{1,${STORED_DIGITS}})$`, "i");
var STORED_IN_TEXT = new RegExp(`(?<![\\w-])(${ALT})-(\\d{${STORED_DIGITS}})(?![\\w])`, "g");
// ../../OPAL/packages/shared/src/units.ts
var u = (code, symbol, name, dimension, factor, offset) => offset === undefined ? { code, symbol, name, dimension, factor } : { code, symbol, name, dimension, factor, offset };
var IN = 0.0254;
var LBF = 4.4482216152605;
var OZF = LBF / 16;
var UNITS = [
  u("um", "\xB5m", "micrometre", "length", 0.000001),
  u("mm", "mm", "millimetre", "length", 0.001),
  u("cm", "cm", "centimetre", "length", 0.01),
  u("m", "m", "metre", "length", 1),
  u("km", "km", "kilometre", "length", 1000),
  u("mil", "mil", "thousandth of an inch", "length", IN / 1000),
  u("in", "in", "inch", "length", IN),
  u("ft", "ft", "foot", "length", 0.3048),
  u("yd", "yd", "yard", "length", 0.9144),
  u("mm2", "mm\xB2", "square millimetre", "area", 0.000001),
  u("cm2", "cm\xB2", "square centimetre", "area", 0.0001),
  u("m2", "m\xB2", "square metre", "area", 1),
  u("in2", "in\xB2", "square inch", "area", IN * IN),
  u("ft2", "ft\xB2", "square foot", "area", 0.09290304),
  u("ml", "mL", "millilitre", "volume", 0.000001),
  u("l", "L", "litre", "volume", 0.001),
  u("cm3", "cm\xB3", "cubic centimetre", "volume", 0.000001),
  u("in3", "in\xB3", "cubic inch", "volume", IN * IN * IN),
  u("floz", "fl oz", "US fluid ounce", "volume", 0.0000295735295625),
  u("gal", "gal", "US gallon", "volume", 0.003785411784),
  u("mg", "mg", "milligram", "mass", 0.000001),
  u("g", "g", "gram", "mass", 0.001),
  u("kg", "kg", "kilogram", "mass", 1),
  u("oz", "oz", "ounce", "mass", 0.028349523125),
  u("lb", "lb", "pound", "mass", 0.45359237),
  u("n", "N", "newton", "force", 1),
  u("kn", "kN", "kilonewton", "force", 1000),
  u("ozf", "ozf", "ounce-force", "force", OZF),
  u("lbf", "lbf", "pound-force", "force", LBF),
  u("kgf", "kgf", "kilogram-force", "force", 9.80665),
  u("n_cm", "N\xB7cm", "newton centimetre", "torque", 0.01),
  u("n_m", "N\xB7m", "newton metre", "torque", 1),
  u("in_ozf", "in\xB7ozf", "inch ounce-force", "torque", IN * OZF),
  u("in_lbf", "in\xB7lbf", "inch pound-force", "torque", IN * LBF),
  u("ft_lbf", "ft\xB7lbf", "foot pound-force", "torque", 0.3048 * LBF),
  u("pa", "Pa", "pascal", "pressure", 1),
  u("kpa", "kPa", "kilopascal", "pressure", 1000),
  u("mpa", "MPa", "megapascal", "pressure", 1e6),
  u("mbar", "mbar", "millibar", "pressure", 100),
  u("bar", "bar", "bar", "pressure", 1e5),
  u("psi", "psi", "pound per square inch", "pressure", LBF / (IN * IN)),
  u("inh2o", "inH\u2082O", "inch of water", "pressure", 249.08891),
  u("torr", "Torr", "torr", "pressure", 101325 / 760),
  u("degc", "\xB0C", "degree Celsius", "temperature", 1, 273.15),
  u("degf", "\xB0F", "degree Fahrenheit", "temperature", 5 / 9, 273.15 - 32 * 5 / 9),
  u("k", "K", "kelvin", "temperature", 1),
  u("ms", "ms", "millisecond", "time", 0.001),
  u("s", "s", "second", "time", 1),
  u("min", "min", "minute", "time", 60),
  u("h", "h", "hour", "time", 3600),
  u("hz", "Hz", "hertz", "frequency", 1),
  u("khz", "kHz", "kilohertz", "frequency", 1000),
  u("mhz", "MHz", "megahertz", "frequency", 1e6),
  u("rpm", "rpm", "revolution per minute", "frequency", 1 / 60),
  u("m_s", "m/s", "metre per second", "speed", 1),
  u("km_h", "km/h", "kilometre per hour", "speed", 1 / 3.6),
  u("ft_s", "ft/s", "foot per second", "speed", 0.3048),
  u("mph", "mph", "mile per hour", "speed", 0.44704),
  u("l_min", "L/min", "litre per minute", "flow", 0.001 / 60),
  u("gpm", "gpm", "US gallon per minute", "flow", 0.003785411784 / 60),
  u("scfm", "scfm", "standard cubic foot per minute", "flow", 0.028316846592 / 60),
  u("deg", "\xB0", "degree", "angle", Math.PI / 180),
  u("rad", "rad", "radian", "angle", 1),
  u("rev", "rev", "revolution", "angle", 2 * Math.PI),
  u("mv", "mV", "millivolt", "voltage", 0.001),
  u("v", "V", "volt", "voltage", 1),
  u("kv", "kV", "kilovolt", "voltage", 1000),
  u("ua", "\xB5A", "microampere", "current", 0.000001),
  u("ma", "mA", "milliampere", "current", 0.001),
  u("a", "A", "ampere", "current", 1),
  u("mohm", "m\u03A9", "milliohm", "resistance", 0.001),
  u("ohm", "\u03A9", "ohm", "resistance", 1),
  u("kohm", "k\u03A9", "kilohm", "resistance", 1000),
  u("megohm", "M\u03A9", "megohm", "resistance", 1e6),
  u("pf", "pF", "picofarad", "capacitance", 0.000000000001),
  u("nf", "nF", "nanofarad", "capacitance", 0.000000001),
  u("uf", "\xB5F", "microfarad", "capacitance", 0.000001),
  u("mw", "mW", "milliwatt", "power", 0.001),
  u("w", "W", "watt", "power", 1),
  u("kw", "kW", "kilowatt", "power", 1000),
  u("j", "J", "joule", "energy", 1),
  u("wh", "Wh", "watt hour", "energy", 3600),
  u("mah", "mAh", "milliampere hour", "energy", 3.6),
  u("pct", "%", "percent", "ratio", 0.01),
  u("ppm", "ppm", "part per million", "ratio", 0.000001),
  u("ea", "ea", "each", "count", 1)
];
var BY_CODE = new Map(UNITS.map((x) => [x.code, x]));
// ../../OPAL/packages/shared/src/specs.ts
var zDecimal = string2().trim().regex(/^[-+]?(\d+(\.\d*)?|\.\d+)$/, "Expected a decimal number such as 12.125");
var zSpec = discriminatedUnion("kind", [
  object({ kind: literal("range"), lower: zDecimal, upper: zDecimal }),
  object({ kind: literal("nominal"), nominal: zDecimal, plus: zDecimal, minus: zDecimal }),
  object({ kind: literal("min"), lower: zDecimal }),
  object({ kind: literal("max"), upper: zDecimal }),
  object({ kind: literal("reference"), nominal: zDecimal })
]).superRefine((s, ctx) => {
  if (s.kind === "range" && cmp(s.lower, s.upper) > 0)
    ctx.addIssue({ code: "custom", path: ["upper"], message: "Upper limit is below the lower limit" });
  if (s.kind === "nominal" && (sign(s.plus) < 0 || sign(s.minus) < 0))
    ctx.addIssue({ code: "custom", path: ["plus"], message: "Tolerances are positive; minus is subtracted" });
});
function parse4(v) {
  const m = /^([-+]?)(\d*)(?:\.(\d*))?$/.exec(v.trim());
  if (!m || !m[2] && !m[3])
    return null;
  const frac = m[3] ?? "";
  const n = BigInt(`${m[2] || "0"}${frac}`) * (m[1] === "-" ? -1n : 1n);
  return { n, scale: frac.length };
}
function align(a, b) {
  const scale = Math.max(a.scale, b.scale);
  return [a.n * 10n ** BigInt(scale - a.scale), b.n * 10n ** BigInt(scale - b.scale), scale];
}
function cmp(a, b) {
  const x = parse4(a);
  const y = parse4(b);
  if (!x || !y)
    return Number.NaN;
  const [p, q] = align(x, y);
  return p < q ? -1 : p > q ? 1 : 0;
}
var sign = (a) => cmp(a, "0");
// ../../OPAL/packages/shared/src/spec-from-label.ts
var NUM = String.raw`[-+]?(?:\d+(?:\.\d*)?|\.\d+)`;
var UNIT = String.raw`\s*([^\d()\u00B1]{0,24}?)`;
var SEP = String.raw`\s*(?:-|\u2013|\u2014|to)\s*`;
// ../../OPAL/packages/shared/src/client.ts
function buildRequest(c, input) {
  const rest = { ...input };
  let url = c.path;
  for (const p of pathParams(c.path)) {
    url = url.replace(`:${p}`, encodeURIComponent(String(rest[p])));
    delete rest[p];
  }
  if (c.method === "GET" || c.method === "DELETE") {
    const qs = new URLSearchParams;
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined || v === null)
        continue;
      for (const item of Array.isArray(v) ? v : [v])
        qs.append(k, String(item));
    }
    const s = qs.toString();
    return { method: c.method, url: s ? `${url}?${s}` : url };
  }
  return { method: c.method, url, body: rest };
}
function createClient(tree, transport) {
  const out = {};
  for (const [k, v] of Object.entries(tree)) {
    out[k] = "path" in v && "method" in v ? (input) => transport(buildRequest(v, input ?? {})) : createClient(v, transport);
  }
  return out;
}
// ../../OPAL/packages/shared/src/domains/auth.ts
var zTimeDisplay = _enum(["local", "utc"]);
var zAuthUser = object({
  id: number2().int(),
  username: string2(),
  name: string2(),
  email: string2().nullable(),
  isAdmin: boolean2(),
  needsProfileSetup: boolean2(),
  needsOnboarding: boolean2(),
  timeDisplay: zTimeDisplay,
  avatarUrl: string2().nullable()
});
var zAuthConfig = object({
  needsSetup: boolean2(),
  passwordLoginEnabled: boolean2(),
  passkeysEnabled: boolean2(),
  oidcEnabled: boolean2(),
  oidcProviderName: string2().nullable()
});
var zSignedIn = object({ user: zAuthUser });
var zApiTokenInfo = object({
  id: number2().int(),
  name: string2(),
  createdAt: zTimestamp,
  lastUsedAt: zTimestamp.nullable(),
  expiresAt: zTimestamp.nullable()
});
var zPassword = string2().min(1).max(256);
var tokens = {
  list: op({
    name: "auth.tokens.list",
    method: "GET",
    path: "/auth/tokens",
    summary: "List the signed-in user's active API tokens.",
    input: object({}),
    output: object({ items: array(zApiTokenInfo) }),
    access: "signed-in",
    mcp: false
  }),
  create: op({
    name: "auth.tokens.create",
    method: "POST",
    path: "/auth/tokens",
    summary: "Create an API token. The token text is returned once.",
    input: object({
      name: string2().trim().min(1).max(100),
      expiresInDays: number2().int().min(1).max(3650).optional()
    }),
    output: object({
      id: number2().int(),
      name: string2(),
      token: string2(),
      expiresAt: zTimestamp.nullable()
    }),
    access: "signed-in",
    humanOnly: true,
    mcp: false
  }),
  revoke: op({
    name: "auth.tokens.revoke",
    method: "DELETE",
    path: "/auth/tokens/:id",
    summary: "Revoke one of the signed-in user's API tokens.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: false
  })
};
var zSessionInfo = object({
  id: number2().int(),
  method: string2(),
  createdAt: zTimestamp,
  lastSeenAt: zTimestamp.nullable(),
  userAgent: string2().nullable(),
  ipAddress: string2().nullable(),
  current: boolean2()
});
var zPasskeyInfo = object({
  id: number2().int(),
  name: string2(),
  createdAt: zTimestamp,
  lastUsedAt: zTimestamp.nullable(),
  transports: string2().nullable()
});
var zJson = record(string2(), unknown());
var zWebauthnOptions = object({ publicKey: zJson });
var zAuthSettings = object({
  passwordLoginEnabled: boolean2(),
  passkeysEnabled: boolean2(),
  oidcEnabled: boolean2(),
  oidcIssuer: string2(),
  oidcClientId: string2(),
  hasClientSecret: boolean2(),
  oidcScopes: string2(),
  oidcProviderName: string2(),
  oidcGroupsClaim: string2(),
  oidcAdminGroup: string2(),
  oidcAutoCreateUsers: boolean2(),
  oidcRedirectBaseUrl: string2(),
  callbackUrl: string2().nullable()
});
var zAuthSettingsInput = object({
  passwordLoginEnabled: boolean2(),
  passkeysEnabled: boolean2(),
  oidcEnabled: boolean2().default(false),
  oidcIssuer: string2().max(500).default(""),
  oidcClientId: string2().max(500).default(""),
  oidcClientSecret: string2().max(2000).default(""),
  clearClientSecret: boolean2().default(false),
  oidcScopes: string2().max(500).default("openid profile email groups"),
  oidcProviderName: string2().max(100).default("SSO"),
  oidcGroupsClaim: string2().max(100).default("groups"),
  oidcAdminGroup: string2().max(255).default(""),
  oidcAutoCreateUsers: boolean2().default(true),
  oidcRedirectBaseUrl: string2().max(500).default("")
});
var zDiscoveryResult = object({
  ok: boolean2(),
  message: string2(),
  authorizationEndpoint: string2().nullable(),
  tokenEndpoint: string2().nullable(),
  userinfoEndpoint: string2().nullable(),
  jwksUri: string2().nullable()
});
var sessions = {
  list: op({
    name: "auth.sessions.list",
    method: "GET",
    path: "/auth/sessions",
    summary: "List the signed-in user's live sessions.",
    input: object({}),
    output: object({ items: array(zSessionInfo) }),
    access: "signed-in",
    mcp: false
  }),
  revoke: op({
    name: "auth.sessions.revoke",
    method: "DELETE",
    path: "/auth/sessions/:id",
    summary: "End one of the signed-in user's sessions.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: false
  }),
  revokeOthers: op({
    name: "auth.sessions.revokeOthers",
    method: "POST",
    path: "/auth/sessions/revoke-others",
    summary: "End every session of the signed-in user except the current one.",
    input: object({}),
    output: object({ ok: literal(true), revoked: number2().int() }),
    access: "signed-in",
    mcp: false
  })
};
var passkeys = {
  list: op({
    name: "auth.passkeys.list",
    method: "GET",
    path: "/auth/passkeys",
    summary: "List the signed-in user's passkeys.",
    input: object({}),
    output: object({ items: array(zPasskeyInfo) }),
    access: "signed-in",
    mcp: false
  }),
  rename: op({
    name: "auth.passkeys.rename",
    method: "PATCH",
    path: "/auth/passkeys/:id",
    summary: "Rename one of the signed-in user's passkeys.",
    input: object({ id: zId, name: string2().trim().min(1).max(100) }),
    output: zPasskeyInfo,
    access: "signed-in",
    mcp: false
  }),
  delete: op({
    name: "auth.passkeys.delete",
    method: "DELETE",
    path: "/auth/passkeys/:id",
    summary: "Remove one of the signed-in user's passkeys.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: false
  }),
  registerBegin: op({
    name: "auth.passkeys.registerBegin",
    method: "POST",
    path: "/auth/passkeys/register/begin",
    summary: "Start registering a passkey. Returns the options for navigator.credentials.create.",
    input: object({ rpId: string2().max(255).optional() }),
    output: zWebauthnOptions,
    access: "signed-in",
    humanOnly: true,
    mcp: false
  }),
  registerComplete: op({
    name: "auth.passkeys.registerComplete",
    method: "POST",
    path: "/auth/passkeys/register/complete",
    summary: "Finish registering a passkey with the browser's credential.",
    input: object({ name: string2().trim().max(100).default("Passkey"), credential: zJson }),
    output: object({ ok: literal(true), id: number2().int(), name: string2() }),
    access: "signed-in",
    humanOnly: true,
    mcp: false
  }),
  loginBegin: op({
    name: "auth.passkeys.loginBegin",
    method: "POST",
    path: "/auth/passkeys/login/begin",
    summary: "Start a usernameless passkey sign-in.",
    input: object({ rpId: string2().max(255).optional() }),
    output: zWebauthnOptions,
    access: "public",
    mcp: false
  }),
  loginComplete: op({
    name: "auth.passkeys.loginComplete",
    method: "POST",
    path: "/auth/passkeys/login/complete",
    summary: "Finish a passkey sign-in with the browser's assertion.",
    input: object({ credential: zJson }),
    output: zSignedIn,
    access: "public",
    mcp: false
  })
};
var claim2 = {
  status: op({
    name: "auth.claim.status",
    method: "GET",
    path: "/auth/claim",
    summary: "Check an account-claim link. Invalid, expired and spent links look the same.",
    input: object({ token: string2().min(1).max(2000) }),
    output: object({ username: string2() }),
    access: "public",
    mcp: false
  }),
  complete: op({
    name: "auth.claim.complete",
    method: "POST",
    path: "/auth/claim",
    summary: "Set the first password on a passwordless account and sign in.",
    input: object({ token: string2().min(1).max(2000), password: zPassword }),
    output: zSignedIn,
    access: "public",
    mcp: false
  })
};
var claimLinks = {
  create: op({
    name: "auth.claimLinks.create",
    method: "POST",
    path: "/auth/claim-links",
    summary: "Issue a single-use link that lets a passwordless account set its password.",
    input: object({ userId: zId }),
    output: object({ token: string2(), expiresAt: zTimestamp }),
    access: "admin",
    humanOnly: true,
    mcp: false
  })
};
var settings = {
  get: op({
    name: "auth.settings.get",
    method: "GET",
    path: "/settings/auth",
    summary: "Read the sign-in settings.",
    input: object({}),
    output: zAuthSettings,
    access: "admin",
    mcp: false
  }),
  update: op({
    name: "auth.settings.update",
    method: "PUT",
    path: "/settings/auth",
    summary: "Save the sign-in settings. Refuses a setup that leaves nobody able to sign in.",
    input: zAuthSettingsInput,
    output: zAuthSettings,
    access: "admin",
    humanOnly: true,
    mcp: false
  }),
  testDiscovery: op({
    name: "auth.settings.testDiscovery",
    method: "POST",
    path: "/settings/auth/test",
    summary: "Fetch the OIDC provider's discovery document and report what it advertises.",
    input: object({}),
    output: zDiscoveryResult,
    access: "admin",
    mcp: false
  })
};
var auth = {
  config: op({
    name: "auth.config",
    method: "GET",
    path: "/auth/config",
    summary: "Which sign-in methods are on, and whether first-run setup is needed.",
    input: object({}),
    output: zAuthConfig,
    access: "public",
    mcp: false
  }),
  setup: op({
    name: "auth.setup",
    method: "POST",
    path: "/auth/setup",
    summary: "Create the first admin account and sign in. Refused once any user exists.",
    input: object({
      username: string2().trim().min(1).max(64),
      name: string2().trim().min(1).max(255),
      password: zPassword,
      email: string2().trim().max(255).nullable().optional()
    }),
    output: zSignedIn,
    access: "public",
    mcp: false
  }),
  login: op({
    name: "auth.login",
    method: "POST",
    path: "/auth/login",
    summary: "Sign in with username and password.",
    input: object({ username: string2().min(1).max(64), password: zPassword }),
    output: zSignedIn,
    access: "public",
    mcp: false
  }),
  logout: op({
    name: "auth.logout",
    method: "POST",
    path: "/auth/logout",
    summary: "End the current session.",
    input: object({}),
    output: zOk,
    access: "signed-in",
    mcp: false
  }),
  password: {
    change: op({
      name: "auth.password.change",
      method: "POST",
      path: "/auth/password",
      summary: "Change the signed-in user's password. Ends every other session.",
      input: object({
        currentPassword: string2().max(256).optional(),
        newPassword: zPassword
      }),
      output: object({ ok: literal(true), otherSessionsRevoked: number2().int() }),
      access: "signed-in",
      humanOnly: true,
      mcp: false
    })
  },
  me: op({
    name: "auth.me",
    method: "GET",
    path: "/auth/me",
    summary: "The signed-in user.",
    input: object({}),
    output: zAuthUser,
    access: "signed-in",
    mcp: true
  }),
  tokens,
  sessions,
  passkeys,
  claim: claim2,
  claimLinks,
  settings
};

// ../../OPAL/packages/shared/src/domains/datasets.ts
var FIELD_TYPES = ["number", "text", "boolean", "date"];
var DATASET_STATES = ["active", "archived"];
var MAX_CHART_POINTS = 1000;
var zSchemaField = object({
  name: string2().trim().min(1).max(100),
  type: _enum(FIELD_TYPES),
  unit: string2().trim().min(1).max(40).optional(),
  chart: boolean2().optional(),
  required: boolean2().optional(),
  min: number2().optional(),
  max: number2().optional(),
  spec: zSpec.optional()
}).refine((f) => f.type === "number" || f.min === undefined && f.max === undefined && !f.chart && !f.spec, {
  message: "Only number fields take min, max or chart",
  path: ["type"]
}).refine((f) => f.min === undefined || f.max === undefined || f.min <= f.max, {
  message: "min is above max",
  path: ["min"]
});
var zDatasetSchema = object({ fields: array(zSchemaField).max(100) }).superRefine((s, ctx) => {
  const seen = new Set;
  s.fields.forEach((f, i) => {
    if (seen.has(f.name)) {
      ctx.addIssue({ code: "custom", message: `Field '${f.name}' is used twice`, path: ["fields", i, "name"] });
    }
    seen.add(f.name);
  });
});
var zPointValue = union([string2(), number2(), boolean2(), _null3()]);
var zPointValues = record(string2(), zPointValue);
var zDataset = object({
  id: number2().int(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  name: string2(),
  description: string2().nullable(),
  schema: zDatasetSchema,
  procedureId: number2().int().nullable(),
  state: _enum(DATASET_STATES),
  archivedAt: zTimestamp.nullable(),
  pointCount: number2().int(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zDataPoint = object({
  id: number2().int(),
  datasetId: number2().int(),
  recordedAt: zTimestamp,
  values: zPointValues,
  stepExecutionId: number2().int().nullable(),
  source: object({
    executionId: number2().int(),
    woNumber: string2(),
    stepId: number2().int(),
    stepNumber: string2(),
    stepTitle: string2()
  }).nullable(),
  createdAt: zTimestamp
});
var zRecordedAt = exports_iso.datetime({ offset: true });
var zName = string2().trim().min(1).max(255);
var zQueryId = exports_coerce.number().int().positive();
var zChart = object({
  field: string2(),
  unit: string2().nullable(),
  series: array(object({ recordedAt: zTimestamp, value: number2().nullable() }))
});
var zDatasetImportResult = object({ imported: number2().int(), pointIds: array(number2().int()) });
var idOnly = object({ id: zId });
var datasets = {
  list: op({
    name: "datasets.list",
    method: "GET",
    path: "/datasets",
    summary: "List datasets, newest first. Filter by name, procedure and state.",
    input: zPageInput.extend({
      q: string2().optional(),
      projectId: zQueryId.optional(),
      procedureId: zQueryId.optional(),
      state: _enum(DATASET_STATES).optional()
    }),
    output: zPage(zDataset),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "datasets.create",
    method: "POST",
    path: "/datasets",
    summary: "Create a dataset with a field schema. A number field takes a unit code (such as in, mm, in_lbf, psi) and a spec (range, nominal, min, max or reference) as decimal strings; out-of-spec points are stored and flagged, never refused. Legacy min and max still refuse.",
    input: object({
      projectId: zId,
      name: zName,
      description: string2().trim().nullish(),
      schema: zDatasetSchema,
      procedureId: zId.nullish()
    }),
    output: zDataset,
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "datasets.get",
    method: "GET",
    path: "/datasets/:id",
    summary: "Read one dataset.",
    input: idOnly,
    output: zDataset,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "datasets.update",
    method: "PATCH",
    path: "/datasets/:id",
    summary: "Change a dataset. A null description or procedure clears it. Archived datasets are read-only.",
    input: object({
      id: zId,
      projectId: zId.optional(),
      name: zName.optional(),
      description: string2().trim().nullish(),
      schema: zDatasetSchema.optional(),
      procedureId: zId.nullish()
    }),
    output: zDataset,
    access: "signed-in",
    mcp: true
  }),
  archive: op({
    name: "datasets.archive",
    method: "POST",
    path: "/datasets/:id/archive",
    summary: "Archive a dataset: terminal. It keeps its points and takes no new ones.",
    input: idOnly,
    output: zDataset,
    access: "signed-in",
    mcp: true
  }),
  delete: op({
    name: "datasets.delete",
    method: "DELETE",
    path: "/datasets/:id",
    summary: "Delete a dataset that has no points. A dataset with points is archived instead.",
    input: idOnly,
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  exportCsv: op({
    name: "datasets.exportCsv",
    method: "GET",
    path: "/datasets/:id/export",
    summary: 'Every point of a dataset as CSV text (recorded_at, then one column per field, headed "name [unit symbol]", then an out_of_spec column naming the spec fields a point misses).',
    input: idOnly,
    output: string2(),
    produces: "text/csv",
    access: "signed-in",
    mcp: true
  }),
  chart: op({
    name: "datasets.chart",
    method: "GET",
    path: "/datasets/:id/chart",
    summary: "The series of one field over time, oldest first, for graphing.",
    input: object({
      id: zId,
      field: string2().min(1),
      start: zRecordedAt.optional(),
      end: zRecordedAt.optional(),
      limit: exports_coerce.number().int().min(1).max(MAX_CHART_POINTS).default(MAX_CHART_POINTS)
    }),
    output: zChart,
    access: "signed-in",
    mcp: true
  }),
  points: {
    list: op({
      name: "datasets.points.list",
      method: "GET",
      path: "/datasets/:id/points",
      summary: "List the points of a dataset. Newest first unless order is asc.",
      input: zPageInput.extend({
        id: zId,
        start: zRecordedAt.optional(),
        end: zRecordedAt.optional(),
        order: _enum(["asc", "desc"]).default("desc")
      }),
      output: zPage(zDataPoint),
      access: "signed-in",
      mcp: true
    }),
    import: op({
      name: "datasets.points.import",
      method: "POST",
      path: "/datasets/:id/points/import",
      summary: "Import points from CSV text. The header names the fields; an optional recorded_at column sets the time. All rows are checked first: one bad row imports nothing.",
      input: object({ id: zId, csv: string2().min(1) }),
      output: zDatasetImportResult,
      access: "signed-in",
      mcp: true
    }),
    add: op({
      name: "datasets.points.add",
      method: "POST",
      path: "/datasets/:id/points",
      summary: "Add a point. The values are checked against the dataset schema.",
      input: object({
        id: zId,
        recordedAt: zRecordedAt.optional(),
        values: zPointValues,
        stepExecutionId: zId.nullish()
      }),
      output: zDataPoint,
      access: "signed-in",
      mcp: true
    }),
    remove: op({
      name: "datasets.points.remove",
      method: "DELETE",
      path: "/datasets/:id/points/:pointId",
      summary: "Delete a point.",
      input: object({ id: zId, pointId: zId }),
      output: zOk,
      access: "signed-in",
      mcp: true
    })
  }
};

// ../../OPAL/packages/shared/src/domains/org.ts
var zQueryBool = union([boolean2(), _enum(["true", "false"]).transform((v) => v === "true")]);
var zWorkcenterRef = object({ id: number2().int(), name: string2() });
var zRoleRef = object({ id: number2().int(), name: string2() });
var zPersonRef = object({
  id: number2().int(),
  name: string2(),
  avatarUrl: string2().nullable()
});
var zProfileFields = {
  jobTitle: string2().nullable(),
  phone: string2().nullable(),
  workcenter: zWorkcenterRef.nullable(),
  roles: array(zRoleRef),
  avatarUrl: string2().nullable()
};
var zOrgUser = object({
  id: number2().int(),
  name: string2(),
  username: string2(),
  email: string2().nullable(),
  isActive: boolean2(),
  isAdmin: boolean2(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
  hasPassword: boolean2(),
  hasPasskey: boolean2(),
  ssoLinked: boolean2(),
  ...zProfileFields
});
var zDirectoryEntry = object({
  id: number2().int(),
  name: string2(),
  username: string2(),
  ...zProfileFields
});
var zEmail = string2().trim().max(255).regex(/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/, "Not a valid email address");
var zUserCreate = object({
  name: string2().trim().min(1).max(255),
  username: string2().trim().max(64).nullable().optional(),
  password: string2().min(1).max(256).nullable().optional(),
  email: zEmail.nullable().optional(),
  isAdmin: boolean2().default(false)
});
var zUserUpdate = object({
  name: string2().trim().min(1).max(255).optional(),
  email: zEmail.nullable().optional(),
  isActive: boolean2().optional(),
  isAdmin: boolean2().optional(),
  jobTitle: string2().max(120).nullable().optional(),
  phone: string2().max(40).nullable().optional(),
  workcenterId: number2().int().nullable().optional()
});
var zActivityEntry = object({
  timestamp: zTimestamp,
  table: string2(),
  action: string2(),
  subject: string2().nullable()
});
var MAX_AVATAR_BYTES = 2 * 1024 * 1024;
var zProfileState = object({
  needsProfileSetup: boolean2(),
  needsOnboarding: boolean2()
});
var users = {
  list: op({
    name: "users.list",
    method: "GET",
    path: "/users",
    summary: "List users by name. Filter by text (name, username, email) and active state.",
    input: zPageInput.extend({
      search: string2().optional(),
      isActive: zQueryBool.optional()
    }),
    output: zPage(zOrgUser).extend({ total: number2().int() }),
    access: "admin",
    mcp: true
  }),
  directory: op({
    name: "users.directory",
    method: "GET",
    path: "/users/directory",
    summary: "Active users by name, for assignee and owner pickers. Carries no email.",
    input: zEmpty,
    output: array(zDirectoryEntry),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "users.create",
    method: "POST",
    path: "/users",
    summary: "Create a user. Without a password the account starts unclaimed.",
    input: zUserCreate,
    output: zOrgUser,
    access: "admin",
    mcp: false
  }),
  get: op({
    name: "users.get",
    method: "GET",
    path: "/users/:id",
    summary: "Get one user. Admins read anyone; others only themselves.",
    input: object({ id: zId }),
    output: zOrgUser,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "users.update",
    method: "PATCH",
    path: "/users/:id",
    summary: "Update a user. Others edit only their own name, email, job title, phone and workcenter. " + "The last active admin cannot lose admin or be deactivated.",
    input: zUserUpdate.extend({ id: zId }),
    output: zOrgUser,
    access: "signed-in",
    mcp: true
  }),
  deactivate: op({
    name: "users.deactivate",
    method: "DELETE",
    path: "/users/:id",
    summary: "Deactivate an account and end its sessions. The last active admin cannot be deactivated.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: false
  }),
  resetPassword: op({
    name: "users.resetPassword",
    method: "POST",
    path: "/users/:id/reset-password",
    summary: "Clear a password and end the sessions of the user. The owner then claims the account.",
    input: object({ id: zId }),
    output: object({ ok: literal(true), sessionsRevoked: number2().int() }),
    access: "admin",
    humanOnly: true,
    mcp: false
  }),
  activity: op({
    name: "users.activity",
    method: "GET",
    path: "/users/:id/activity",
    summary: "The most recent audited changes of a user, newest first.",
    input: object({ id: zId, limit: exports_coerce.number().int().min(1).max(100).default(15) }),
    output: array(zActivityEntry),
    access: "signed-in",
    mcp: true
  }),
  setRoles: op({
    name: "users.setRoles",
    method: "PUT",
    path: "/users/:id/roles",
    summary: "Replace the roles of a user with exactly roleIds. The Admin role sets or clears isAdmin. " + "The last active admin cannot lose admin.",
    input: object({ id: zId, roleIds: array(zId) }),
    output: zOrgUser,
    access: "admin",
    mcp: false
  }),
  uploadAvatar: op({
    name: "users.uploadAvatar",
    method: "POST",
    path: "/users/:id/avatar",
    summary: "Set the photo of a user: PNG, JPEG, WebP or GIF, at most 2 MB, as base64. Self or admin.",
    input: object({ id: zId, data: string2().min(1) }),
    output: zOrgUser,
    access: "signed-in",
    mcp: false
  }),
  removeAvatar: op({
    name: "users.removeAvatar",
    method: "DELETE",
    path: "/users/:id/avatar",
    summary: "Remove the photo of a user. Initials show instead. Self or admin.",
    input: object({ id: zId }),
    output: zOrgUser,
    access: "signed-in",
    mcp: false
  }),
  profileState: op({
    name: "users.profileState",
    method: "GET",
    path: "/users/me/profile-state",
    summary: "Whether the signed-in user still owes a display name or the orientation.",
    input: zEmpty,
    output: zProfileState,
    access: "signed-in",
    mcp: false
  }),
  setTimeDisplay: op({
    name: "users.setTimeDisplay",
    method: "PUT",
    path: "/users/me/time-display",
    summary: "Choose whether the signed-in user sees times in the browser zone or in UTC.",
    input: object({ timeDisplay: zTimeDisplay }),
    output: object({ timeDisplay: zTimeDisplay }),
    access: "signed-in",
    mcp: false
  }),
  setupProfile: op({
    name: "users.setupProfile",
    method: "POST",
    path: "/users/me/setup-profile",
    summary: "Set the display name of the signed-in user and clear the profile-setup flag.",
    input: object({ name: string2().trim().min(1).max(255) }),
    output: zOrgUser,
    access: "signed-in",
    mcp: false
  })
};
var zRole = object({
  id: number2().int(),
  name: string2(),
  description: string2().nullable(),
  key: string2().nullable(),
  isSystem: boolean2(),
  memberCount: number2().int(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zRoleDetail = zRole.extend({ members: array(zPersonRef) });
var zGate = object({
  key: string2(),
  label: string2(),
  description: string2(),
  roleIds: array(number2().int())
});
var roles = {
  list: op({
    name: "roles.list",
    method: "GET",
    path: "/roles",
    summary: "Roles, system roles first, each with its count of active members.",
    input: zEmpty,
    output: array(zRole),
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "roles.get",
    method: "GET",
    path: "/roles/:id",
    summary: "One role with its active members.",
    input: object({ id: zId }),
    output: zRoleDetail,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "roles.create",
    method: "POST",
    path: "/roles",
    summary: "Create a role. Names are unique ignoring case.",
    input: object({
      name: string2().trim().min(1).max(50),
      description: string2().max(1000).nullable().optional()
    }),
    output: zRole,
    access: "admin",
    mcp: false
  }),
  update: op({
    name: "roles.update",
    method: "PATCH",
    path: "/roles/:id",
    summary: "Rename or describe a role. A system role cannot be renamed.",
    input: object({
      id: zId,
      name: string2().trim().min(1).max(50).optional(),
      description: string2().max(1000).nullable().optional()
    }),
    output: zRole,
    access: "admin",
    mcp: false
  }),
  delete: op({
    name: "roles.delete",
    method: "DELETE",
    path: "/roles/:id",
    summary: "Delete a custom role with its grants. A system role cannot be deleted.",
    input: object({ id: zId }),
    output: zOk,
    access: "admin",
    mcp: false
  })
};
var gates = {
  list: op({
    name: "gates.list",
    method: "GET",
    path: "/gates",
    summary: "Every gate with the ids of the roles that pass it. Admin always passes.",
    input: zEmpty,
    output: array(zGate),
    access: "signed-in",
    mcp: true
  }),
  set: op({
    name: "gates.set",
    method: "PUT",
    path: "/gates/:key",
    summary: "Replace the roles that pass a gate with exactly roleIds.",
    input: object({ key: string2(), roleIds: array(zId) }),
    output: zGate,
    access: "admin",
    mcp: false
  })
};
var zWorkcenter = object({
  id: number2().int(),
  name: string2(),
  code: string2(),
  description: string2().nullable(),
  location: string2().nullable(),
  isActive: boolean2(),
  defaultStepCount: number2().int(),
  queuedStepCount: number2().int()
});
var zWorkcenterWork = object({
  defaultSteps: array(object({
    procedureId: number2().int(),
    procedureName: string2(),
    procedureStatus: string2(),
    stepNumber: string2(),
    title: string2()
  })),
  queue: array(object({
    instanceId: number2().int(),
    workOrderNumber: string2().nullable(),
    procedureId: number2().int(),
    procedureName: string2(),
    instanceStatus: string2(),
    priority: number2().int(),
    targetCompletionAt: zTimestamp.nullable(),
    stepNumberStr: string2(),
    stepTitle: string2().nullable(),
    stepStatus: string2()
  }))
});
var zWorkcenterFields = {
  name: string2().trim().min(1).max(255),
  code: string2().trim().min(1).max(50),
  description: string2().nullable().optional(),
  location: string2().max(255).nullable().optional(),
  isActive: boolean2()
};
var workcenters = {
  list: op({
    name: "workcenters.list",
    method: "GET",
    path: "/workcenters",
    summary: "Workcenters by code, with step counts. Active ones unless activeOnly is false.",
    input: object({
      activeOnly: zQueryBool.optional(),
      search: string2().optional()
    }),
    output: array(zWorkcenter),
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "workcenters.get",
    method: "GET",
    path: "/workcenters/:id",
    summary: "One workcenter.",
    input: object({ id: zId }),
    output: zWorkcenter,
    access: "signed-in",
    mcp: true
  }),
  work: op({
    name: "workcenters.work",
    method: "GET",
    path: "/workcenters/:id/work",
    summary: "Procedure steps that default to a workcenter and the open work queued at it.",
    input: object({ id: zId }),
    output: zWorkcenterWork,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "workcenters.create",
    method: "POST",
    path: "/workcenters",
    summary: "Create a workcenter. The code is stored upper case and is unique.",
    input: object({ ...zWorkcenterFields, isActive: boolean2().default(true) }),
    output: zWorkcenter,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "workcenters.update",
    method: "PATCH",
    path: "/workcenters/:id",
    summary: "Update a workcenter.",
    input: object({
      id: zId,
      name: zWorkcenterFields.name.optional(),
      code: zWorkcenterFields.code.optional(),
      description: zWorkcenterFields.description,
      location: zWorkcenterFields.location,
      isActive: zWorkcenterFields.isActive.optional()
    }),
    output: zWorkcenter,
    access: "signed-in",
    mcp: true
  }),
  deactivate: op({
    name: "workcenters.deactivate",
    method: "DELETE",
    path: "/workcenters/:id",
    summary: "Deactivate a workcenter. Steps that name it keep it.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: false
  })
};
var zTier = object({
  level: number2().int(),
  name: string2().trim().min(1, "must not be blank"),
  code: string2().trim().min(1, "must not be blank").refine((c) => !/\s/.test(c), "must not contain spaces"),
  description: string2().default(""),
  defaultTracking: _enum(["serialized", "bulk"]),
  requireLot: boolean2(),
  autoSerial: boolean2()
});
var zTierInput = zTier.extend({
  defaultTracking: _enum(["serialized", "bulk"]).nullable().optional(),
  requireLot: boolean2().nullable().optional(),
  autoSerial: boolean2().nullable().optional()
});
var PART_NUMBER_VARIABLES = [
  "prefix",
  "sep",
  "tier_code",
  "tier_name",
  "tier_level",
  "sequence"
];
var zPartNumbering = object({
  prefix: string2().default(""),
  separator: string2().default("-"),
  sequenceDigits: number2().int().min(1).max(10).default(4),
  format: string2().default("{prefix}{sep}{tier_code}{sep}{sequence}").superRefine((value, ctx) => {
    const allowed = PART_NUMBER_VARIABLES.map((v) => `{${v}}`).join(", ");
    const unknown2 = [...value.matchAll(/\{(\w*)\}/g)].map((m) => m[1]).filter((v) => !PART_NUMBER_VARIABLES.includes(v));
    if (unknown2.length || /\{[^}]*$|^[^{]*\}/.test(value.replace(/\{\w+\}/g, ""))) {
      ctx.addIssue({ code: "custom", message: `unusable format; the variables are ${allowed}` });
    } else if (!value.includes("{sequence}")) {
      ctx.addIssue({
        code: "custom",
        message: "the format must contain {sequence}, or part numbers repeat"
      });
    }
  })
});
var zRequirementCatalogEntry = object({
  id: string2(),
  title: string2(),
  description: string2().default(""),
  category: string2().default("")
});
var zOrgSettings = object({
  name: string2(),
  description: string2(),
  tiers: array(zTier),
  partNumbering: zPartNumbering,
  categories: array(string2()),
  requirements: array(zRequirementCatalogEntry),
  customFields: record(string2(), unknown())
});
var zOrgSettingsInput = object({
  name: string2().trim().min(1, "must not be blank"),
  description: string2().default(""),
  tiers: array(zTierInput).min(1, "at least one tier is required"),
  partNumbering: zPartNumbering,
  categories: array(string2()).default([]),
  customFields: record(string2(), unknown()).nullable().optional()
}).superRefine((v, ctx) => {
  if (new Set(v.tiers.map((t) => t.level)).size !== v.tiers.length) {
    ctx.addIssue({ code: "custom", path: ["tiers"], message: "tier levels must be unique" });
  }
  if (new Set(v.tiers.map((t) => t.code)).size !== v.tiers.length) {
    ctx.addIssue({ code: "custom", path: ["tiers"], message: "tier codes must be unique" });
  }
});
var PROJECT_STATES = ["active", "archived"];
var zProjectRef = object({ id: number2().int(), code: string2(), name: string2() });
var zProject = object({
  id: number2().int(),
  code: string2(),
  name: string2(),
  description: string2().nullable(),
  state: _enum(PROJECT_STATES),
  archivedAt: zTimestamp.nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zProjectCode = string2().trim().min(1, "must not be blank").max(24).refine((c) => !/\s/.test(c), "must not contain spaces");
var projects = {
  list: op({
    name: "projects.list",
    method: "GET",
    path: "/projects",
    summary: "List projects by code. `state` narrows to active or archived projects.",
    input: zPageInput.extend({ state: _enum(PROJECT_STATES).optional(), search: string2().optional() }),
    output: zPage(zProject),
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "projects.get",
    method: "GET",
    path: "/projects/:id",
    summary: "One project.",
    input: object({ id: zId }),
    output: zProject,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "projects.create",
    method: "POST",
    path: "/projects",
    summary: "Create a project. The code is unique, stored in upper case.",
    input: object({
      code: zProjectCode,
      name: string2().trim().min(1, "must not be blank"),
      description: string2().nullable().optional()
    }),
    output: zProject,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "projects.update",
    method: "PATCH",
    path: "/projects/:id",
    summary: "Change the code, name or description of an active project.",
    input: object({
      id: zId,
      code: zProjectCode.optional(),
      name: string2().trim().min(1, "must not be blank").optional(),
      description: string2().nullable().optional()
    }),
    output: zProject,
    access: "signed-in",
    mcp: true
  }),
  archive: op({
    name: "projects.archive",
    method: "POST",
    path: "/projects/:id/archive",
    summary: "Archive a project. Terminal: it takes no new records and cannot be reopened.",
    input: object({ id: zId }),
    output: zProject,
    access: "signed-in",
    mcp: true
  })
};
var zSystemInfo = object({
  opalVersion: string2(),
  runtime: string2(),
  platform: string2(),
  server: string2(),
  dataDir: string2(),
  dbPath: string2(),
  dbSizeBytes: number2().int().nullable()
});
var zAgentActivation = object({
  enabled: boolean2(),
  authorizedBy: string2().nullable()
});
var settings2 = {
  get: op({
    name: "settings.get",
    method: "GET",
    path: "/settings/organization",
    summary: "The organization settings: tiers, part numbering scheme, categories. 404 before setup.",
    input: zEmpty,
    output: zOrgSettings,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "settings.create",
    method: "POST",
    path: "/settings/organization",
    summary: "Set up the organization of this instance. Once only; later changes use settings.update.",
    input: zOrgSettingsInput,
    output: zOrgSettings,
    access: "admin",
    mcp: false
  }),
  update: op({
    name: "settings.update",
    method: "PUT",
    path: "/settings/organization",
    summary: "Update the organization settings. A tier that parts still use cannot be removed.",
    input: zOrgSettingsInput,
    output: zOrgSettings,
    access: "admin",
    mcp: false
  }),
  previewPartNumber: op({
    name: "settings.previewPartNumber",
    method: "POST",
    path: "/settings/preview-part-number",
    summary: "Show the part number the scheme gives for a tier and a sequence.",
    input: object({ tierLevel: number2().int(), sequence: number2().int().min(0).default(1) }),
    output: object({ partNumber: string2(), tierName: string2() }),
    access: "signed-in",
    mcp: false
  }),
  nextPartNumber: op({
    name: "settings.nextPartNumber",
    method: "GET",
    path: "/settings/next-part-number",
    summary: "The next part number of a tier. Does not use it up.",
    input: object({ tier: exports_coerce.number().int() }),
    output: object({ partNumber: string2(), sequence: number2().int() }),
    access: "signed-in",
    mcp: true
  }),
  system: op({
    name: "settings.system",
    method: "GET",
    path: "/settings/system",
    summary: "Version, platform and storage facts of this instance.",
    input: zEmpty,
    output: zSystemInfo,
    access: "signed-in",
    mcp: false
  }),
  agentActivation: op({
    name: "settings.agentActivation",
    method: "GET",
    path: "/settings/agent-activation",
    summary: "Whether the MCP agent may activate parts, and which admin allowed it.",
    input: zEmpty,
    output: zAgentActivation,
    access: "signed-in",
    mcp: false
  }),
  setAgentActivation: op({
    name: "settings.setAgentActivation",
    method: "PUT",
    path: "/settings/agent-activation",
    summary: "Allow or forbid the MCP agent to activate parts. Allowing records the acting admin.",
    input: object({ enabled: boolean2() }),
    output: zAgentActivation,
    access: "admin",
    humanOnly: true,
    mcp: false
  })
};
var welcome = {
  state: op({
    name: "welcome.state",
    method: "GET",
    path: "/welcome",
    summary: "Which onboarding applies: organization setup for the first admin on an empty catalog, else the tutorial.",
    input: zEmpty,
    output: object({ mode: _enum(["setup", "tutorial"]) }),
    access: "signed-in",
    mcp: false
  }),
  complete: op({
    name: "welcome.complete",
    method: "POST",
    path: "/welcome/complete",
    summary: "Mark the onboarding of the signed-in user as done.",
    input: zEmpty,
    output: zOk,
    access: "signed-in",
    mcp: false
  })
};
var org = { users, roles, gates, workcenters, projects, settings: settings2, welcome };

// ../../OPAL/packages/shared/src/domains/procedures.ts
var PROCEDURE_STATUSES = ["draft", "released", "obsolete"];
var PROCEDURE_TYPES = ["op", "build"];
var KIT_USAGES = ["consume", "tooling"];
var CALLOUT_KINDS = ["caution", "info"];
var DATA_FIELD_TYPES = ["text", "number", "boolean", "select", "textarea", "photo"];
var PROCEDURE_SORT_KEYS = [
  "number",
  "name",
  "status",
  "type",
  "version",
  "steps",
  "executions",
  "createdAt",
  "updatedAt"
];
var DIFF_STATUSES = ["added", "removed", "modified", "unchanged"];
var zProcedureCallout = object({
  kind: _enum(CALLOUT_KINDS),
  text: string2()
});
var zProcedureDataField = object({
  name: string2().trim().min(1).max(100),
  label: string2().optional(),
  type: preprocess((t) => t === "checkbox" ? "boolean" : t, _enum(DATA_FIELD_TYPES)),
  required: boolean2().optional(),
  unit: string2().optional(),
  spec: zSpec.optional(),
  min: number2().optional(),
  max: number2().optional(),
  step: union([number2(), string2()]).optional(),
  options: array(string2()).optional(),
  placeholder: string2().optional(),
  rows: number2().int().optional(),
  multiple: boolean2().optional()
});
var zProcedureDataSchema = object({ fields: array(zProcedureDataField).default([]) }).superRefine((s, ctx) => {
  const seen = new Set;
  s.fields.forEach((f, i) => {
    if (seen.has(f.name)) {
      ctx.addIssue({ code: "custom", path: ["fields", i, "name"], message: `Duplicate field name '${f.name}'` });
    }
    seen.add(f.name);
  });
});
var zProcedureSignoff = object({
  label: string2(),
  role: string2().nullable()
});
var zProcedureSignoffInput = object({
  label: string2().optional(),
  role: string2().max(50).nullable().optional()
});
var zProcedureStepImage = object({
  id: number2().int(),
  attachmentId: number2().int(),
  sha256: string2(),
  filename: string2(),
  caption: string2().nullable(),
  position: number2().int()
});
var zProcedureKitItem = object({
  id: number2().int(),
  procedureId: number2().int(),
  stepId: number2().int().nullable(),
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  partExternalPn: string2().nullable(),
  partState: _enum(["draft", "active", "obsolete"]),
  unitOfMeasure: string2(),
  quantity: zQty,
  usage: _enum(KIT_USAGES),
  notes: string2().nullable(),
  onHand: zQty
});
var zProcedureOutput = object({
  id: number2().int(),
  procedureId: number2().int(),
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  partExternalPn: string2().nullable(),
  partState: _enum(["draft", "active", "obsolete"]),
  unitOfMeasure: string2(),
  quantity: zQty
});
var zProcedureStep = object({
  id: number2().int(),
  procedureId: number2().int(),
  order: number2().int(),
  number: string2(),
  level: number2().int(),
  parentId: number2().int().nullable(),
  title: string2(),
  instructions: string2().nullable(),
  dataSchema: zProcedureDataSchema.nullable(),
  isContingency: boolean2(),
  requiresSignoff: boolean2(),
  requiredRole: string2().nullable(),
  signoffs: array(zProcedureSignoff),
  estimatedDurationMinutes: number2().int().nullable(),
  callouts: array(zProcedureCallout),
  strictSequence: boolean2(),
  workcenterId: number2().int().nullable(),
  dependsOn: array(number2().int()),
  images: array(zProcedureStepImage),
  kit: array(zProcedureKitItem)
});
var zProcedureDraft = object({
  procedureId: number2().int(),
  steps: array(zProcedureStep)
});
var zProcedure = object({
  id: number2().int(),
  templateNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  name: string2(),
  description: string2().nullable(),
  procedureType: _enum(PROCEDURE_TYPES),
  status: _enum(PROCEDURE_STATUSES),
  currentVersionId: number2().int().nullable(),
  currentVersionNumber: number2().int().nullable(),
  opCount: number2().int(),
  stepCount: number2().int(),
  executionCount: number2().int(),
  unpublishedChanges: boolean2().nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zSnapshotImage = object({
  sha256: string2(),
  filename: string2(),
  caption: string2().nullable()
});
var zSnapshotKitLine = object({
  partId: number2().int(),
  quantity: zQty,
  usage: _enum(KIT_USAGES),
  notes: string2().nullable()
});
var zSnapshotStep = object({
  id: number2().int(),
  order: number2().int(),
  number: string2(),
  level: number2().int(),
  parentId: number2().int().nullable(),
  title: string2(),
  instructions: string2().nullable(),
  dataSchema: zProcedureDataSchema.nullable(),
  isContingency: boolean2(),
  strictSequence: boolean2(),
  estimatedDurationMinutes: number2().int().nullable(),
  workcenterId: number2().int().nullable(),
  signoffs: array(zProcedureSignoff),
  callouts: array(zProcedureCallout),
  dependsOn: array(number2().int()),
  images: array(zSnapshotImage),
  kit: array(zSnapshotKitLine)
});
var zProcedureSnapshot = object({
  schemaVersion: literal(1),
  procedure: object({
    templateNumber: string2(),
    projectId: number2().int(),
    name: string2(),
    description: string2().nullable(),
    procedureType: _enum(PROCEDURE_TYPES)
  }),
  steps: array(zSnapshotStep),
  kit: array(object({ partId: number2().int(), quantity: zQty })),
  outputs: array(object({ partId: number2().int(), quantity: zQty }))
});
var zProcedureVersion = object({
  id: number2().int(),
  procedureId: number2().int(),
  versionNumber: number2().int(),
  createdAt: zTimestamp,
  createdById: number2().int().nullable(),
  createdByName: string2().nullable(),
  changeNote: string2().nullable(),
  stepCount: number2().int(),
  isCurrent: boolean2()
});
var zVersionPart = object({
  id: number2().int(),
  internalPn: string2(),
  name: string2(),
  externalPn: string2().nullable(),
  unitOfMeasure: string2(),
  state: _enum(["draft", "active", "obsolete"])
});
var zProcedureVersionDetail = zProcedureVersion.extend({
  procedureTemplateNumber: string2(),
  procedureName: string2(),
  procedureType: _enum(PROCEDURE_TYPES),
  procedureStatus: _enum(PROCEDURE_STATUSES),
  projectCode: string2(),
  snapshot: zProcedureSnapshot,
  parts: array(zVersionPart)
});
var zStepDiff = object({
  status: _enum(DIFF_STATUSES),
  number: string2(),
  titleA: string2().nullable(),
  titleB: string2().nullable(),
  changedFields: array(string2()),
  changes: record(string2(), object({ a: unknown(), b: unknown() }))
});
var zPartDiff = object({
  partId: number2().int(),
  internalPn: string2().nullable(),
  name: string2().nullable(),
  status: _enum(["added", "removed", "modified"]),
  quantityA: zQty.nullable(),
  quantityB: zQty.nullable()
});
var zVersionDiff = object({
  procedureId: number2().int(),
  procedureName: string2(),
  versionA: zProcedureVersion,
  versionB: zProcedureVersion,
  procedureChanges: array(object({ field: string2(), a: string2().nullable(), b: string2().nullable() })),
  steps: array(zStepDiff),
  kit: array(zPartDiff),
  outputs: array(zPartDiff),
  added: number2().int(),
  removed: number2().int(),
  modified: number2().int(),
  unchanged: number2().int()
});
var stepFields = {
  instructions: string2().nullable().optional(),
  dataSchema: zProcedureDataSchema.nullable().optional(),
  estimatedDurationMinutes: number2().int().min(1).nullable().optional(),
  signoffs: array(zProcedureSignoffInput).nullable().optional(),
  requiredRole: string2().max(50).nullable().optional(),
  requiresSignoff: boolean2().optional(),
  callouts: array(zProcedureCallout).nullable().optional(),
  strictSequence: boolean2().optional(),
  workcenterId: number2().int().nullable().optional()
};
var zStepAdd = object({
  id: zId,
  title: string2().trim().min(1).max(255),
  isContingency: boolean2().default(false),
  parentId: number2().int().optional(),
  afterStepId: number2().int().optional(),
  ...stepFields
});
var zStepUpdate = object({
  id: zId,
  stepId: zId,
  title: string2().trim().min(1).max(255).optional(),
  isContingency: boolean2().optional(),
  ...stepFields
});
var zBuildStep = object({
  title: string2().trim().min(1).max(255),
  instructions: string2().nullable().optional(),
  requiredRole: string2().max(50).nullable().optional(),
  requiresSignoff: boolean2().optional(),
  signoffs: array(zProcedureSignoffInput).nullable().optional(),
  callouts: array(zProcedureCallout).nullable().optional(),
  strictSequence: boolean2().optional(),
  estimatedDurationMinutes: number2().int().min(1).nullable().optional(),
  workcenterId: number2().int().nullable().optional(),
  kit: array(object({
    partId: zId,
    quantity: zQty,
    usage: _enum(KIT_USAGES).default("consume"),
    notes: string2().nullable().optional()
  })).optional()
});
var zProcedureId = object({ id: zId });
var zStepRef = object({ id: zId, stepId: zId });
var zKitAdd = object({
  partId: zId,
  quantity: zQty,
  usage: _enum(KIT_USAGES).default("consume"),
  notes: string2().nullable().optional()
});
var steps = {
  add: op({
    name: "procedures.steps.add",
    method: "POST",
    path: "/procedures/:id/steps",
    summary: "Add an OP (no parentId) or a sub-step to the draft. Numbers follow: OP 1, 2; contingency C1, C2; sub-steps 1.1, 1.2. A number data field takes a unit code (such as in, mm, in_lbf, psi) and an optional spec.",
    input: zStepAdd,
    output: zProcedureStep,
    access: "signed-in",
    mcp: true
  }),
  reorder: op({
    name: "procedures.steps.reorder",
    method: "POST",
    path: "/procedures/:id/steps/reorder",
    summary: "Set the order of every step from one list of all step ids in document order. A step keeps its parent; the order inside each parent follows the list.",
    input: object({ id: zId, stepIds: array(zId) }),
    output: array(zProcedureStep),
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "procedures.steps.update",
    method: "PATCH",
    path: "/procedures/:id/steps/:stepId",
    summary: "Change a step. Absent fields stay; null clears instructions, data schema, duration, workcenter, callouts or sign-offs. A number data field takes a unit code (UNITS, such as in, mm, in_lbf, psi) and an optional spec (range, nominal, min, max, reference) as decimal strings; a spec is not combined with min or max. An out-of-spec value is recorded and needs a note or an NC before the step completes.",
    input: zStepUpdate,
    output: zProcedureStep,
    access: "signed-in",
    mcp: true
  }),
  remove: op({
    name: "procedures.steps.remove",
    method: "DELETE",
    path: "/procedures/:id/steps/:stepId",
    summary: "Delete a step. An OP takes its sub-steps along. Numbering closes over the gap.",
    input: zStepRef,
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  duplicate: op({
    name: "procedures.steps.duplicate",
    method: "POST",
    path: "/procedures/:id/steps/:stepId/duplicate",
    summary: "Copy a step (an OP with its sub-steps) to right after the original. Kit lines and images are copied. Op dependencies are not.",
    input: zStepRef,
    output: zProcedureStep,
    access: "signed-in",
    mcp: true
  }),
  move: op({
    name: "procedures.steps.move",
    method: "POST",
    path: "/procedures/:id/steps/:stepId/move",
    summary: "Move a step to an index among the children of parentId (null: among the OPs). An OP with sub-steps stays top-level. Moving an OP under another OP drops its op dependencies.",
    input: object({
      id: zId,
      stepId: zId,
      parentId: number2().int().nullable().default(null),
      index: number2().int().min(0),
      isContingency: boolean2().optional()
    }),
    output: zProcedureStep,
    access: "signed-in",
    mcp: true
  }),
  setDependencies: op({
    name: "procedures.steps.setDependencies",
    method: "PUT",
    path: "/procedures/:id/steps/:stepId/dependencies",
    summary: "Replace the OPs an OP waits on. Only top-level OPs of the same procedure; a self-loop or a cycle is refused.",
    input: object({ id: zId, stepId: zId, dependsOn: array(zId).default([]) }),
    output: object({ stepId: number2().int(), dependsOn: array(number2().int()) }),
    access: "signed-in",
    mcp: true
  }),
  images: {
    list: op({
      name: "procedures.steps.images.list",
      method: "GET",
      path: "/procedures/:id/steps/:stepId/images",
      summary: "A step's reference images in display order.",
      input: zStepRef,
      output: array(zProcedureStepImage),
      access: "signed-in",
      mcp: true
    }),
    update: op({
      name: "procedures.steps.images.update",
      method: "PATCH",
      path: "/procedures/:id/steps/:stepId/images/:imageId",
      summary: "Change the caption of a step image.",
      input: object({ id: zId, stepId: zId, imageId: zId, caption: string2().max(255).nullable().optional() }),
      output: zProcedureStepImage,
      access: "signed-in",
      mcp: true
    }),
    remove: op({
      name: "procedures.steps.images.remove",
      method: "DELETE",
      path: "/procedures/:id/steps/:stepId/images/:imageId",
      summary: "Unlink an image from the step. Published versions keep it by hash.",
      input: object({ id: zId, stepId: zId, imageId: zId }),
      output: zOk,
      access: "signed-in",
      mcp: true
    }),
    reorder: op({
      name: "procedures.steps.images.reorder",
      method: "POST",
      path: "/procedures/:id/steps/:stepId/images/reorder",
      summary: "Set the display order of a step images from the full list of image ids.",
      input: object({ id: zId, stepId: zId, imageIds: array(zId) }),
      output: array(zProcedureStepImage),
      access: "signed-in",
      mcp: true
    })
  },
  kit: {
    list: op({
      name: "procedures.steps.kit.list",
      method: "GET",
      path: "/procedures/:id/steps/:stepId/kit",
      summary: "Parts a step needs.",
      input: zStepRef,
      output: array(zProcedureKitItem),
      access: "signed-in",
      mcp: true
    }),
    add: op({
      name: "procedures.steps.kit.add",
      method: "POST",
      path: "/procedures/:id/steps/:stepId/kit",
      summary: "Add a part to a step. A part appears once per step.",
      input: object({ id: zId, stepId: zId }).extend(zKitAdd.shape),
      output: zProcedureKitItem,
      access: "signed-in",
      mcp: true
    }),
    update: op({
      name: "procedures.steps.kit.update",
      method: "PATCH",
      path: "/procedures/:id/steps/:stepId/kit/:kitId",
      summary: "Change quantity, usage or notes of a step kit line.",
      input: object({
        id: zId,
        stepId: zId,
        kitId: zId,
        quantity: zQty.optional(),
        usage: _enum(KIT_USAGES).optional(),
        notes: string2().nullable().optional()
      }),
      output: zProcedureKitItem,
      access: "signed-in",
      mcp: true
    }),
    remove: op({
      name: "procedures.steps.kit.remove",
      method: "DELETE",
      path: "/procedures/:id/steps/:stepId/kit/:kitId",
      summary: "Remove a part from a step.",
      input: object({ id: zId, stepId: zId, kitId: zId }),
      output: zOk,
      access: "signed-in",
      mcp: true
    })
  }
};
var kit = {
  list: op({
    name: "procedures.kit.list",
    method: "GET",
    path: "/procedures/:id/kit",
    summary: "Parts the procedure consumes as a whole, with stock on hand.",
    input: zProcedureId,
    output: array(zProcedureKitItem),
    access: "signed-in",
    mcp: true
  }),
  add: op({
    name: "procedures.kit.add",
    method: "POST",
    path: "/procedures/:id/kit",
    summary: "Add a part to the procedure kit. A part appears once.",
    input: object({ id: zId }).extend(zKitAdd.shape),
    output: zProcedureKitItem,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "procedures.kit.update",
    method: "PATCH",
    path: "/procedures/:id/kit/:kitId",
    summary: "Change the quantity of a kit line.",
    input: object({
      id: zId,
      kitId: zId,
      quantity: zQty.optional(),
      usage: _enum(KIT_USAGES).optional(),
      notes: string2().nullable().optional()
    }),
    output: zProcedureKitItem,
    access: "signed-in",
    mcp: true
  }),
  remove: op({
    name: "procedures.kit.remove",
    method: "DELETE",
    path: "/procedures/:id/kit/:kitId",
    summary: "Remove a part from the procedure kit.",
    input: object({ id: zId, kitId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};
var outputs = {
  list: op({
    name: "procedures.outputs.list",
    method: "GET",
    path: "/procedures/:id/outputs",
    summary: "Parts the procedure produces.",
    input: zProcedureId,
    output: array(zProcedureOutput),
    access: "signed-in",
    mcp: true
  }),
  add: op({
    name: "procedures.outputs.add",
    method: "POST",
    path: "/procedures/:id/outputs",
    summary: "Add a produced part. The first-level BOM of the part, times the quantity, is added to the procedure kit.",
    input: object({ id: zId, partId: zId, quantity: zQty.default("1") }),
    output: zProcedureOutput,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "procedures.outputs.update",
    method: "PATCH",
    path: "/procedures/:id/outputs/:outputId",
    summary: "Change the quantity produced.",
    input: object({ id: zId, outputId: zId, quantity: zQty }),
    output: zProcedureOutput,
    access: "signed-in",
    mcp: true
  }),
  remove: op({
    name: "procedures.outputs.remove",
    method: "DELETE",
    path: "/procedures/:id/outputs/:outputId",
    summary: "Remove a produced part.",
    input: object({ id: zId, outputId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};
var versions2 = {
  get: op({
    name: "procedures.versions.get",
    method: "GET",
    path: "/procedures/versions/:versionId",
    summary: "A published version with its frozen snapshot and the parts it names. Also the data of the print view.",
    input: object({ versionId: zId }),
    output: zProcedureVersionDetail,
    access: "signed-in",
    mcp: true
  }),
  qr: op({
    name: "procedures.versions.qr",
    method: "GET",
    path: "/procedures/versions/:versionId/qr",
    summary: "QR code (SVG) for a traveler. The client passes the URL to encode.",
    input: object({ versionId: zId, url: string2().min(1).max(2000) }),
    output: string2(),
    access: "signed-in",
    mcp: false,
    produces: "image/svg+xml"
  }),
  list: op({
    name: "procedures.versions.list",
    method: "GET",
    path: "/procedures/:id/versions",
    summary: "Published versions of a procedure, newest first.",
    input: zProcedureId,
    output: array(zProcedureVersion),
    access: "signed-in",
    mcp: true
  }),
  publish: op({
    name: "procedures.versions.publish",
    method: "POST",
    path: "/procedures/:id/publish",
    summary: "Freeze the draft as a new immutable version and release the procedure. Refused with no steps, or when the kit or outputs hold draft parts.",
    input: object({ id: zId, changeNote: string2().max(2000).nullable().optional() }),
    output: zProcedureVersion,
    access: "signed-in",
    mcp: true
  }),
  diff: op({
    name: "procedures.versions.diff",
    method: "GET",
    path: "/procedures/:id/versions/:versionA/diff/:versionB",
    summary: "Step, kit and output differences between two versions of one procedure.",
    input: object({ id: zId, versionA: zId, versionB: zId }),
    output: zVersionDiff,
    access: "signed-in",
    mcp: true
  }),
  restore: op({
    name: "procedures.versions.restore",
    method: "POST",
    path: "/procedures/:id/versions/:versionId/restore",
    summary: "Replace the draft steps, kit and outputs with a version snapshot. The status and the current version stay.",
    input: object({ id: zId, versionId: zId }),
    output: zProcedure,
    access: "signed-in",
    mcp: true
  })
};
var procedures = {
  list: op({
    name: "procedures.list",
    method: "GET",
    path: "/procedures",
    summary: "List procedures with search, filters, sort and per-row counts.",
    input: zPageInput.extend({
      q: string2().optional(),
      projectId: zId.optional(),
      status: _enum(PROCEDURE_STATUSES).optional(),
      procedureType: _enum(PROCEDURE_TYPES).optional(),
      sort: _enum(PROCEDURE_SORT_KEYS).default("updatedAt"),
      dir: _enum(["asc", "desc"]).default("desc")
    }),
    output: zPage(zProcedure).extend({ total: number2().int() }),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "procedures.create",
    method: "POST",
    path: "/procedures",
    summary: "Create a draft procedure in a project. It gets the next T-number.",
    input: object({
      projectId: zId,
      name: string2().trim().min(1).max(255),
      description: string2().nullable().optional(),
      procedureType: _enum(PROCEDURE_TYPES).default("op")
    }),
    output: zProcedure,
    access: "signed-in",
    mcp: true
  }),
  build: op({
    name: "procedures.build",
    method: "POST",
    path: "/procedures/build",
    summary: "Create a procedure with its OPs, step kits, kit and outputs in one call. Every part and workcenter is checked before anything is written.",
    input: object({
      projectId: zId,
      name: string2().trim().min(1).max(255),
      description: string2().nullable().optional(),
      procedureType: _enum(PROCEDURE_TYPES).default("op"),
      steps: array(zBuildStep).default([]),
      kit: array(object({ partId: zId, quantity: zQty })).default([]),
      outputs: array(object({ partId: zId, quantity: zQty.default("1") })).default([])
    }),
    output: object({
      procedure: zProcedure,
      stepCount: number2().int(),
      stepKitCount: number2().int(),
      kitCount: number2().int(),
      outputCount: number2().int()
    }),
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "procedures.get",
    method: "GET",
    path: "/procedures/:id",
    summary: "One procedure with counts and whether the draft differs from the current version.",
    input: zProcedureId,
    output: zProcedure,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "procedures.update",
    method: "PATCH",
    path: "/procedures/:id",
    summary: "Change name, description, type or status. Released needs a published version. Obsolete retires the procedure.",
    input: object({
      id: zId,
      projectId: zId.optional(),
      name: string2().trim().min(1).max(255).optional(),
      description: string2().nullable().optional(),
      status: _enum(PROCEDURE_STATUSES).optional(),
      procedureType: _enum(PROCEDURE_TYPES).optional()
    }),
    output: zProcedure,
    access: "signed-in",
    mcp: true
  }),
  delete: op({
    name: "procedures.delete",
    method: "DELETE",
    path: "/procedures/:id",
    summary: "Delete a procedure that was never published. A published one becomes obsolete instead.",
    input: zProcedureId,
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  clone: op({
    name: "procedures.clone",
    method: "POST",
    path: "/procedures/:id/clone",
    summary: "Copy the draft (steps, op dependencies, images, kit, outputs) into a new draft with a new T-number.",
    input: object({
      id: zId,
      newName: string2().trim().min(1).max(255).optional(),
      copyKit: boolean2().default(true),
      copyOutputs: boolean2().default(true)
    }),
    output: zProcedure,
    access: "signed-in",
    mcp: true
  }),
  draft: op({
    name: "procedures.draft",
    method: "GET",
    path: "/procedures/:id/draft",
    summary: "All draft steps in document order, each with images, kit lines and op dependencies. The editor loads this.",
    input: zProcedureId,
    output: zProcedureDraft,
    access: "signed-in",
    mcp: true
  }),
  dependencies: op({
    name: "procedures.dependencies",
    method: "GET",
    path: "/procedures/:id/dependencies",
    summary: "Every op dependency edge of the draft.",
    input: zProcedureId,
    output: array(object({ stepId: number2().int(), dependsOnStepId: number2().int() })),
    access: "signed-in",
    mcp: true
  }),
  steps,
  kit,
  outputs,
  versions: versions2
};

// ../../OPAL/packages/shared/src/domains/execution.ts
var EXECUTION_STATUSES = ["cut", "in_work", "completed", "aborted"];
var EXECUTION_PRIORITIES = ["normal", "high", "urgent"];
var EXEC_STEP_STATUSES = ["pending", "awaiting_signoff", "completed", "skipped"];
var EXECUTION_SORT_KEYS = ["workOrder", "procedure", "status", "created", "target", "priority"];
var EXEC_BLOCKER_KINDS = [
  "nc",
  "sequence",
  "dependency",
  "redline",
  "children",
  "hold",
  "signoff",
  "role",
  "out_of_spec"
];
var PRODUCTION_STATUSES = ["planned", "wip", "completed"];
var EXEC_USAGES = ["consume", "tooling"];
var zExecBlocker = object({
  kind: _enum(EXEC_BLOCKER_KINDS),
  message: string2(),
  issueId: number2().int().nullable(),
  issueNumber: string2().nullable()
});
var zExecHold = object({
  issueId: number2().int(),
  issueNumber: string2(),
  title: string2(),
  kind: _enum(["raised", "bound"]),
  dispositionState: string2(),
  ticketState: string2()
});
var zExecCursor = object({
  userId: number2().int(),
  name: string2().nullable(),
  avatarUrl: string2().nullable(),
  initials: string2(),
  focusedAt: zTimestamp.nullable(),
  stale: boolean2()
});
var zExecRosterEntry = zExecCursor.extend({
  stepId: number2().int().nullable(),
  stepNumber: string2().nullable()
});
var zLaborRow = object({
  opId: number2().int(),
  userId: number2().int(),
  name: string2().nullable(),
  avatarUrl: string2().nullable(),
  seconds: number2().int(),
  since: zTimestamp.nullable()
});
var zExecutionRow = object({
  id: number2().int(),
  woNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  procedureId: number2().int(),
  procedureNumber: string2(),
  procedureName: string2(),
  versionId: number2().int(),
  versionNumber: number2().int(),
  status: _enum(EXECUTION_STATUSES),
  priority: _enum(EXECUTION_PRIORITIES),
  createdAt: zTimestamp,
  startedAt: zTimestamp.nullable(),
  completedAt: zTimestamp.nullable(),
  scheduledStartAt: zTimestamp.nullable(),
  targetCompletionAt: zTimestamp.nullable(),
  createdBy: string2().nullable(),
  progressDone: number2().int(),
  progressTotal: number2().int(),
  heldBy: array(string2()),
  working: array(object({
    userId: number2().int(),
    name: string2().nullable(),
    avatarUrl: string2().nullable(),
    stepNumber: string2().nullable()
  }))
});
var zExecutionList = zPage(zExecutionRow).extend({
  total: number2().int(),
  counts: record(string2(), number2().int())
});
var zExecStepState = object({
  id: number2().int(),
  number: string2(),
  title: string2(),
  level: number2().int(),
  parentId: number2().int().nullable(),
  status: _enum(EXEC_STEP_STATUSES),
  dataCaptured: record(string2(), unknown()).nullable(),
  skipReason: string2().nullable(),
  startedAt: zTimestamp.nullable(),
  completedAt: zTimestamp.nullable(),
  completedBy: string2().nullable(),
  isAdHoc: boolean2()
});
var zExecution = zExecutionRow.extend({
  procedureType: _enum(["op", "build"]),
  versionCreatedAt: zTimestamp,
  durationSeconds: number2().int().nullable(),
  active: boolean2(),
  steps: array(zExecStepState)
});
var zPreviewPart = object({
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  uom: string2(),
  perWorkOrder: zQty,
  required: zQty,
  available: zQty,
  isAvailable: boolean2(),
  usage: _enum(EXEC_USAGES).nullable()
});
var zCutPreview = object({
  procedureId: number2().int(),
  procedureNumber: string2(),
  procedureName: string2(),
  procedureType: _enum(["op", "build"]),
  projectId: number2().int(),
  versions: array(object({ id: number2().int(), number: number2().int(), createdAt: zTimestamp, isCurrent: boolean2() })),
  versionId: number2().int(),
  versionNumber: number2().int(),
  stepCount: number2().int(),
  opCount: number2().int(),
  quantity: number2().int(),
  outputs: array(object({
    partId: number2().int(),
    partNumber: string2(),
    partName: string2(),
    quantityEach: zQty,
    serials: array(string2())
  })),
  kit: array(zPreviewPart),
  stepKit: array(zPreviewPart),
  allAvailable: boolean2()
});
var zDocSignoff = object({
  slot: number2().int(),
  label: string2(),
  role: string2().nullable(),
  signedBy: zPersonRef.nullable(),
  signedAt: zTimestamp.nullable(),
  canSign: boolean2(),
  blockers: array(zExecBlocker)
});
var zDocNoteFile = object({
  id: number2().int(),
  filename: string2(),
  mimeType: string2(),
  sizeBytes: number2().int(),
  url: string2(),
  isImage: boolean2()
});
var zDocNote = object({
  id: number2().int(),
  author: zPersonRef.nullable(),
  createdAt: zTimestamp,
  body: string2(),
  attachments: array(zDocNoteFile)
});
var zDocAttachment = object({
  id: number2().int(),
  filename: string2(),
  mimeType: string2(),
  sizeBytes: number2().int(),
  kind: string2().nullable(),
  note: string2().nullable(),
  uploadedBy: string2().nullable(),
  createdAt: zTimestamp
});
var zDocConsumption = object({
  id: number2().int(),
  stockId: number2().int(),
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  opalNumber: string2(),
  quantity: zQty,
  lotNumber: string2().nullable(),
  location: string2(),
  usage: _enum(EXEC_USAGES),
  stepId: number2().int().nullable(),
  stepNumber: string2().nullable()
});
var zDocStepKit = object({
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  quantity: zQty,
  usage: _enum(EXEC_USAGES),
  notes: string2().nullable()
});
var zDocImage = object({ sha256: string2(), filename: string2(), caption: string2().nullable() });
var zDocStep = object({
  id: number2().int(),
  templateStepId: number2().int().nullable(),
  number: string2(),
  title: string2(),
  level: number2().int(),
  isOp: boolean2(),
  parentId: number2().int().nullable(),
  status: _enum(EXEC_STEP_STATUSES),
  instructions: string2().nullable(),
  callouts: array(object({ kind: _enum(["caution", "info"]), text: string2() })),
  role: string2().nullable(),
  requiresSignoff: boolean2(),
  isContingency: boolean2(),
  estimatedDurationMinutes: number2().int().nullable(),
  images: array(zDocImage),
  stepKit: array(zDocStepKit),
  dataSchema: zProcedureDataSchema.nullable(),
  dataCaptured: record(string2(), unknown()).nullable(),
  skipReason: string2().nullable(),
  startedAt: zTimestamp.nullable(),
  completed: object({ by: string2().nullable(), initials: string2(), at: zTimestamp.nullable() }).nullable(),
  signedOff: object({ by: string2().nullable(), at: zTimestamp.nullable() }).nullable(),
  durationSeconds: number2().int().nullable(),
  cursors: array(zExecCursor),
  holds: array(zExecHold),
  issueHistory: array(object({
    issueId: number2().int(),
    issueNumber: string2(),
    state: string2(),
    ticketState: string2(),
    dispositionType: string2().nullable()
  })),
  completeBlockers: array(zExecBlocker),
  skipBlockers: array(zExecBlocker),
  notes: array(zDocNote),
  signoffs: array(zDocSignoff),
  attachments: array(zDocAttachment),
  consumptions: array(zDocConsumption),
  waiting: string2().nullable()
});
var zDocOp = object({
  id: number2().int(),
  number: string2(),
  title: string2(),
  status: _enum(EXEC_STEP_STATUSES),
  instructions: string2().nullable(),
  callouts: array(object({ kind: _enum(["caution", "info"]), text: string2() })),
  role: string2().nullable(),
  signoffs: array(zDocSignoff),
  strictSequence: boolean2(),
  isContingency: boolean2(),
  isAdHoc: boolean2(),
  redline: object({
    issueId: number2().int(),
    issueNumber: string2().nullable(),
    title: string2().nullable(),
    hostId: number2().int().nullable()
  }).nullable(),
  waitingOnOps: array(string2()),
  holds: array(zExecHold),
  openNcs: array(object({ id: number2().int(), issueNumber: string2(), title: string2() })),
  progress: object({ done: number2().int(), total: number2().int() }),
  step: zDocStep,
  steps: array(zDocStep)
});
var zDocIssue = object({
  id: number2().int(),
  issueNumber: string2(),
  title: string2(),
  issueType: string2(),
  priority: string2(),
  status: string2(),
  state: string2(),
  ticketState: string2(),
  containment: string2(),
  dispositionType: string2().nullable(),
  isBlocking: boolean2(),
  raisedStepNumber: string2().nullable(),
  createdAt: zTimestamp
});
var zDocHoldSummary = object({
  issueId: number2().int(),
  issueNumber: string2(),
  title: string2(),
  dispositionState: string2(),
  ticketState: string2(),
  blocks: array(string2())
});
var zKitRow = object({
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  uom: string2(),
  qtyRequired: zQty,
  qtyConsumed: zQty,
  variance: zQty
});
var zUnplannedRow = object({
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  qtyConsumed: zQty
});
var zOutputRow = object({
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  quantity: zQty
});
var zProductionRow = object({
  id: number2().int(),
  stockId: number2().int(),
  partId: number2().int(),
  partNumber: string2(),
  partName: string2(),
  serialNumber: string2().nullable(),
  opalNumber: string2(),
  quantity: zQty,
  lotNumber: string2().nullable(),
  location: string2(),
  status: _enum(PRODUCTION_STATUSES)
});
var zDataRow = object({
  stepNumber: string2(),
  stepId: number2().int(),
  field: string2(),
  unit: string2().nullable(),
  value: string2(),
  spec: string2().nullable().optional(),
  outOfSpec: boolean2().optional(),
  by: string2().nullable(),
  at: zTimestamp.nullable()
});
var zExecutionDocument = object({
  execution: object({
    id: number2().int(),
    woNumber: string2(),
    status: _enum(EXECUTION_STATUSES),
    active: boolean2(),
    priority: _enum(EXECUTION_PRIORITIES),
    projectId: number2().int(),
    projectCode: string2(),
    projectName: string2(),
    procedure: object({
      id: number2().int(),
      templateNumber: string2(),
      name: string2(),
      type: _enum(["op", "build"])
    }),
    version: object({
      id: number2().int(),
      number: number2().int(),
      createdAt: zTimestamp,
      createdBy: string2().nullable()
    }),
    createdAt: zTimestamp,
    createdBy: string2().nullable(),
    startedAt: zTimestamp.nullable(),
    completedAt: zTimestamp.nullable(),
    scheduledStartAt: zTimestamp.nullable(),
    targetCompletionAt: zTimestamp.nullable(),
    lastActivityAt: zTimestamp.nullable(),
    durationSeconds: number2().int().nullable()
  }),
  progress: object({ done: number2().int(), total: number2().int() }),
  ops: array(zDocOp),
  contingencyOps: array(zDocOp),
  issues: array(zDocIssue),
  holds: array(zDocHoldSummary),
  roster: array(zExecRosterEntry),
  myCursorId: number2().int().nullable(),
  kit: object({ items: array(zKitRow), unplanned: array(zUnplannedRow) }),
  consumptions: array(zDocConsumption),
  outputs: array(zOutputRow),
  productions: array(zProductionRow),
  kitRelevant: boolean2(),
  materialRelevant: boolean2(),
  canFinalize: boolean2(),
  referenceAttachments: array(zDocAttachment),
  attachments: array(zDocAttachment),
  dataRows: array(zDataRow),
  labor: array(zLaborRow),
  generatedAt: zTimestamp
});
var zExecutionState = object({
  execution: object({
    id: number2().int(),
    status: _enum(EXECUTION_STATUSES),
    progress: object({ done: number2().int(), total: number2().int() })
  }),
  steps: array(object({
    id: number2().int(),
    number: string2(),
    title: string2(),
    status: _enum(EXEC_STEP_STATUSES),
    cursors: array(zExecCursor),
    holds: array(zExecHold),
    attachments: number2().int(),
    consumed: number2().int(),
    notes: number2().int()
  })),
  roster: array(zExecRosterEntry),
  holds: array(zDocHoldSummary),
  labor: array(zLaborRow),
  generatedAt: zTimestamp
});
var zExecutionHolds = object({
  executionId: number2().int(),
  held: boolean2(),
  holds: array(object({
    issueId: number2().int(),
    issueNumber: string2(),
    title: string2(),
    priority: string2(),
    containment: string2(),
    ticketState: string2(),
    raisedStepId: number2().int().nullable(),
    containmentStepId: number2().int().nullable(),
    blocks: array(string2())
  }))
});
var zSignResult = object({
  step: zExecStepState,
  slot: number2().int(),
  stepCompleted: boolean2(),
  executionStarted: boolean2(),
  executionCompleted: boolean2(),
  signoffs: array(object({
    slot: number2().int(),
    label: string2(),
    role: string2().nullable(),
    signedBy: zPersonRef.nullable(),
    signedAt: zTimestamp.nullable()
  }))
});
var zStepNote = object({
  id: number2().int(),
  stepId: number2().int(),
  author: zPersonRef.nullable(),
  createdAt: zTimestamp,
  body: string2()
});
var zExecutionComment = object({
  id: number2().int(),
  executionId: number2().int(),
  author: zPersonRef.nullable(),
  createdAt: zTimestamp,
  body: string2()
});
var zConsumeLine = object({
  stockId: zId,
  quantity: zQty,
  usage: _enum(EXEC_USAGES).default("consume")
});
var zConsumptionRow = object({
  id: number2().int(),
  stockId: number2().int(),
  partId: number2().int(),
  partName: string2(),
  quantity: zQty,
  location: string2(),
  lotNumber: string2().nullable()
});
var zKitAvailability = object({
  executionId: number2().int(),
  allAvailable: boolean2(),
  items: array(object({
    partId: number2().int(),
    partNumber: string2(),
    partName: string2(),
    uom: string2(),
    quantityRequired: zQty,
    quantityAvailable: zQty,
    isAvailable: boolean2(),
    locations: array(object({
      stockId: number2().int(),
      opalNumber: string2(),
      location: string2(),
      lotNumber: string2().nullable(),
      quantity: zQty
    }))
  }))
});
var zBomReconciliation = object({
  kitItems: array(zKitRow),
  unplanned: array(zUnplannedRow),
  outputs: array(zProductionRow)
});
var zRedlineStepInput = object({
  title: string2().trim().min(1).max(255),
  instructions: string2().nullish(),
  dataSchema: zProcedureDataSchema.nullish(),
  requiresSignoff: boolean2().default(false)
});
var zRedline = object({
  id: number2().int(),
  executionId: number2().int(),
  issueId: number2().int(),
  issueNumber: string2().nullable(),
  hostId: number2().int().nullable(),
  opStepId: number2().int(),
  number: string2(),
  title: string2(),
  status: _enum(EXEC_STEP_STATUSES),
  createdAt: zTimestamp,
  steps: array(zExecStepState)
});
var zParticipant = object({
  userId: number2().int(),
  name: string2(),
  joinedAt: zTimestamp,
  lastStepId: number2().int().nullable()
});
var zParticipants = object({ executionId: number2().int(), participants: array(zParticipant) });
var zExecutionReport = object({
  execution: object({
    id: number2().int(),
    woNumber: string2(),
    status: string2(),
    projectCode: string2(),
    procedureId: number2().int(),
    procedureName: string2(),
    versionNumber: number2().int(),
    operator: string2().nullable(),
    startedAt: zTimestamp.nullable(),
    completedAt: zTimestamp.nullable()
  }),
  generatedAt: zTimestamp,
  endItems: array(object({
    partId: number2().int(),
    partName: string2(),
    partNumber: string2(),
    opalNumber: string2().nullable(),
    serialNumber: string2().nullable(),
    quantity: zQty,
    status: string2()
  })),
  operations: array(object({
    stepNumber: string2(),
    level: number2().int(),
    title: string2(),
    status: string2(),
    startedAt: zTimestamp.nullable(),
    completedAt: zTimestamp.nullable(),
    operator: string2().nullable(),
    signoffs: array(object({
      slot: number2().int(),
      label: string2(),
      role: string2().nullable(),
      signedBy: string2().nullable(),
      signedAt: zTimestamp.nullable()
    }))
  })),
  dataCollects: array(object({
    stepNumber: string2(),
    stepTitle: string2(),
    rows: array(object({
      label: string2(),
      value: string2(),
      unit: string2().nullable(),
      spec: string2().nullable().optional(),
      outOfSpec: boolean2().optional()
    }))
  })),
  chartDatasets: array(object({
    datasetId: number2().int(),
    name: string2(),
    chartFields: array(object({ name: string2(), label: string2().optional(), unit: string2().optional() })),
    fields: array(object({ name: string2(), label: string2().optional(), unit: string2().optional() })),
    points: array(object({ recordedAt: zTimestamp, values: record(string2(), unknown()) }))
  })),
  issues: array(object({
    id: number2().int(),
    issueNumber: string2(),
    issueType: string2(),
    priority: string2(),
    status: string2(),
    title: string2(),
    rootCause: string2().nullable(),
    dispositionType: string2().nullable(),
    createdAt: zTimestamp
  })),
  closeoutAttachments: array(object({ id: number2().int(), filename: string2(), createdAt: zTimestamp }))
});
var zStepPath = { id: zId, stepId: zId };
var zLocalTime = exports_iso.datetime({ offset: true });
var execution = {
  list: op({
    name: "execution.list",
    method: "GET",
    path: "/executions",
    summary: "List executions (work orders) with progress, holds and who is working. Filters: status (comma list), procedureId, projectId, q, mine, held.",
    input: zPageInput.extend({
      status: string2().optional(),
      procedureId: exports_coerce.number().int().positive().optional(),
      projectId: exports_coerce.number().int().positive().optional(),
      q: string2().optional(),
      mine: _enum(["true", "false"]).optional(),
      held: _enum(["true", "false"]).optional(),
      sort: _enum(EXECUTION_SORT_KEYS).optional(),
      dir: _enum(["asc", "desc"]).default("desc")
    }),
    output: zExecutionList,
    access: "signed-in",
    mcp: true
  }),
  preview: op({
    name: "execution.preview",
    method: "GET",
    path: "/executions/preview",
    summary: "Cut preview: versions, the serials build outputs would get, and a kit check scaled by quantity. Allocates nothing.",
    input: object({
      procedureId: zId,
      versionId: exports_coerce.number().int().positive().optional(),
      quantity: exports_coerce.number().int().min(1).max(100).default(1)
    }),
    output: zCutPreview,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "execution.create",
    method: "POST",
    path: "/executions",
    summary: "Cut execution(s) from a published procedure version. The project defaults to the procedure project. quantity above 1 cuts a batch; the result is the first, `cutIds` lists all.",
    input: object({
      procedureId: zId,
      versionId: zId.optional(),
      projectId: zId.optional(),
      woNumber: string2().trim().min(1).max(100).optional(),
      quantity: number2().int().min(1).max(100).default(1),
      priority: _enum(EXECUTION_PRIORITIES).default("normal"),
      scheduledStartAt: zLocalTime.nullish(),
      targetCompletionAt: zLocalTime.nullish()
    }),
    output: zExecution.extend({ cutIds: array(number2().int()) }),
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "execution.get",
    method: "GET",
    path: "/executions/:id",
    summary: "One execution with the state of every step.",
    input: object({ id: zId }),
    output: zExecution,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "execution.update",
    method: "PATCH",
    path: "/executions/:id",
    summary: "Change the work order number, project, priority or dates of an active execution.",
    input: object({
      id: zId,
      woNumber: string2().trim().min(1).max(100).optional(),
      projectId: zId.optional(),
      priority: _enum(EXECUTION_PRIORITIES).optional(),
      scheduledStartAt: zLocalTime.nullish(),
      targetCompletionAt: zLocalTime.nullish()
    }),
    output: zExecution,
    access: "signed-in",
    mcp: true
  }),
  cancel: op({
    name: "execution.cancel",
    method: "POST",
    path: "/executions/:id/cancel",
    summary: "Abort an active execution. Status is otherwise derived from the work done.",
    input: object({ id: zId, reason: string2().trim().max(2000).nullish() }),
    output: zExecution,
    access: "signed-in",
    mcp: true
  }),
  document: op({
    name: "execution.document",
    method: "GET",
    path: "/executions/:id/document",
    summary: "The execution document: OPs and steps with computed gates, holds, cursors, notes, evidence, kit and consumption. A pure read.",
    input: object({ id: zId }),
    output: zExecutionDocument,
    access: "signed-in",
    mcp: false
  }),
  state: op({
    name: "execution.state",
    method: "GET",
    path: "/executions/:id/state",
    summary: "Light state: step statuses, presence and holds. The poll doubles as a presence heartbeat.",
    input: object({ id: zId }),
    output: zExecutionState,
    access: "signed-in",
    mcp: true
  }),
  holds: op({
    name: "execution.holds",
    method: "GET",
    path: "/executions/:id/holds",
    summary: "Every undispositioned issue holding the execution, and what each blocks.",
    input: object({ id: zId }),
    output: zExecutionHolds,
    access: "signed-in",
    mcp: true
  }),
  report: op({
    name: "execution.report",
    method: "GET",
    path: "/executions/:id/report",
    summary: "Report content of a completed execution.",
    input: object({ id: zId }),
    output: zExecutionReport,
    access: "signed-in",
    mcp: true
  }),
  qr: op({
    name: "execution.qr",
    method: "GET",
    path: "/executions/:id/qr.svg",
    summary: "QR code linking to the execution page. origin: the browser origin.",
    input: object({ id: zId, origin: string2().optional() }),
    output: string2(),
    access: "signed-in",
    mcp: false,
    produces: "image/svg+xml"
  }),
  focus: op({
    name: "execution.focus",
    method: "POST",
    path: "/executions/:id/focus",
    summary: "Claim the OP a step belongs to (one claim per user per execution). Presence, not an event.",
    input: object({ id: zId, stepId: zId }),
    output: object({ stepId: number2().int(), focusedAt: zTimestamp }),
    access: "signed-in",
    mcp: true
  }),
  release: op({
    name: "execution.release",
    method: "DELETE",
    path: "/executions/:id/focus",
    summary: "Release the claim.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  join: op({
    name: "execution.join",
    method: "POST",
    path: "/executions/:id/join",
    summary: "Join an execution as a participant.",
    input: object({ id: zId }),
    output: zParticipants,
    access: "signed-in",
    mcp: true
  }),
  leave: op({
    name: "execution.leave",
    method: "POST",
    path: "/executions/:id/leave",
    summary: "Stop participating. The claim stays.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  participants: op({
    name: "execution.participants",
    method: "GET",
    path: "/executions/:id/participants",
    summary: "Who joined the execution.",
    input: object({ id: zId }),
    output: zParticipants,
    access: "signed-in",
    mcp: true
  }),
  complete: op({
    name: "execution.complete",
    method: "POST",
    path: "/executions/:id/steps/:stepId/complete",
    summary: "Sign slot 0 of a step, with the captured data validated against the step data schema. Refused while a hold, sequence, dependency, redline or open sub-step stands.",
    input: object({
      ...zStepPath,
      dataCaptured: record(string2(), unknown()).nullish(),
      notes: string2().nullish()
    }),
    output: zSignResult,
    access: "signed-in",
    mcp: true
  }),
  sign: op({
    name: "execution.sign",
    method: "POST",
    path: "/executions/:id/steps/:stepId/signoffs/:slot",
    summary: "Sign one slot of a step sign-off list. A step is complete when its last slot is signed. Data capture rides with slot 0.",
    input: object({
      ...zStepPath,
      slot: exports_coerce.number().int().min(0),
      dataCaptured: record(string2(), unknown()).nullish()
    }),
    output: zSignResult,
    access: "signed-in",
    mcp: true
  }),
  signoff: op({
    name: "execution.signoff",
    method: "POST",
    path: "/executions/:id/steps/:stepId/signoff",
    summary: "Sign the next unsigned slot of a step that awaits sign-off.",
    input: object(zStepPath),
    output: zSignResult,
    access: "signed-in",
    mcp: true
  }),
  skip: op({
    name: "execution.skip",
    method: "POST",
    path: "/executions/:id/steps/:stepId/skip",
    summary: "Skip a step (not applicable). Held scope and open redlines refuse it.",
    input: object({ ...zStepPath, reason: string2().trim().max(2000).nullish() }),
    output: zSignResult,
    access: "signed-in",
    mcp: true
  }),
  addNote: op({
    name: "execution.addNote",
    method: "POST",
    path: "/executions/:id/steps/:stepId/notes",
    summary: "Append a timestamped, authored note to a step. Any step state, any execution state. Attach files with POST /api/attachments (ownerType step_note).",
    input: object({ ...zStepPath, body: string2() }),
    output: zStepNote,
    access: "signed-in",
    mcp: true
  }),
  listComments: op({
    name: "execution.listComments",
    method: "GET",
    path: "/executions/:id/comments",
    summary: "The comment thread of a work order, oldest first. Step notes are separate (on each step).",
    input: object({ id: zId }),
    output: array(zExecutionComment),
    access: "signed-in",
    mcp: true
  }),
  addComment: op({
    name: "execution.addComment",
    method: "POST",
    path: "/executions/:id/comments",
    summary: "Add a comment to the thread of a work order. Any execution state. Markdown.",
    input: object({ id: zId, body: string2().trim().min(1).max(4000) }),
    output: zExecutionComment,
    access: "signed-in",
    mcp: true
  }),
  raiseNc: op({
    name: "execution.raiseNc",
    method: "POST",
    path: "/executions/:id/steps/:stepId/nc",
    summary: "Raise a non-conformance from a step. The issue holds what its containment says until dispositioned. The project, execution and step come from the context.",
    input: object({
      ...zStepPath,
      title: string2().trim().min(1).max(255),
      description: string2().nullish(),
      priority: _enum(["low", "medium", "high", "critical"]).default("medium"),
      shouldBe: string2().nullish(),
      actual: string2().nullish(),
      containment: _enum(["advisory", "step", "op", "wo"]).default("step"),
      containmentStepId: number2().int().positive().nullish(),
      assignedToId: number2().int().positive().nullish()
    }),
    output: object({
      id: number2().int(),
      issueNumber: string2(),
      title: string2(),
      containment: string2(),
      executionId: number2().int(),
      stepId: number2().int()
    }),
    access: "signed-in",
    mcp: true
  }),
  consumptions: op({
    name: "execution.consumptions",
    method: "GET",
    path: "/executions/:id/consumptions",
    summary: "Every consume move of the execution.",
    input: object({ id: zId }),
    output: array(zDocConsumption),
    access: "signed-in",
    mcp: true
  }),
  stepConsumptions: op({
    name: "execution.stepConsumptions",
    method: "GET",
    path: "/executions/:id/steps/:stepId/consumptions",
    summary: "Consume moves booked at one step.",
    input: object(zStepPath),
    output: array(zDocConsumption),
    access: "signed-in",
    mcp: true
  }),
  kit: op({
    name: "execution.kit",
    method: "GET",
    path: "/executions/:id/kit",
    summary: "Check the snapshot kit against live stock, with the stock records to draw from.",
    input: object({ id: zId }),
    output: zKitAvailability,
    access: "signed-in",
    mcp: true
  }),
  consume: op({
    name: "execution.consume",
    method: "POST",
    path: "/executions/:id/consume",
    summary: "Consume stock for the execution as a whole (procedure level).",
    input: object({ id: zId, items: array(zConsumeLine).min(1), notes: string2().nullish() }),
    output: array(zConsumptionRow),
    access: "signed-in",
    mcp: true
  }),
  consumeAtStep: op({
    name: "execution.consumeAtStep",
    method: "POST",
    path: "/executions/:id/steps/:stepId/consume",
    summary: "Consume stock at one step. Tooling is booked and returned (a zero move).",
    input: object({ ...zStepPath, items: array(zConsumeLine).min(1), notes: string2().nullish() }),
    output: array(zConsumptionRow),
    access: "signed-in",
    mcp: true
  }),
  outputs: op({
    name: "execution.outputs",
    method: "GET",
    path: "/executions/:id/outputs",
    summary: "The outputs the snapshot expects.",
    input: object({ id: zId }),
    output: array(zOutputRow),
    access: "signed-in",
    mcp: true
  }),
  produce: op({
    name: "execution.produce",
    method: "POST",
    path: "/executions/:id/produce",
    summary: "Produce output items now: a new stock record and a produce move linked to the execution.",
    input: object({
      id: zId,
      items: array(object({
        partId: zId,
        quantity: zQty,
        location: string2().trim().min(1),
        lotNumber: string2().nullish(),
        serialNumber: string2().nullish()
      })).min(1),
      notes: string2().nullish()
    }),
    output: array(zProductionRow),
    access: "signed-in",
    mcp: true
  }),
  productions: op({
    name: "execution.productions",
    method: "GET",
    path: "/executions/:id/productions",
    summary: "Planned, in-work and completed production of the execution.",
    input: object({ id: zId }),
    output: array(zProductionRow),
    access: "signed-in",
    mcp: true
  }),
  bom: op({
    name: "execution.bom",
    method: "GET",
    path: "/executions/:id/bom",
    summary: "BOM reconciliation: kit against what was consumed, unplanned consumption, outputs.",
    input: object({ id: zId }),
    output: zBomReconciliation,
    access: "signed-in",
    mcp: true
  }),
  finalize: op({
    name: "execution.finalize",
    method: "POST",
    path: "/executions/:id/finalize",
    summary: "After completion: book the planned outputs into stock at a location and record the genealogy of the consumed components.",
    input: object({ id: zId, location: string2().trim().min(1), notes: string2().nullish() }),
    output: object({ executionId: number2().int(), productions: array(zProductionRow) }),
    access: "signed-in",
    mcp: true
  }),
  createRedline: op({
    name: "execution.createRedline",
    method: "POST",
    path: "/executions/:id/redlines",
    summary: "Insert a redline (ad-hoc) OP into a running execution for an open non-conformance raised at a step. It gates the host OP.",
    input: object({
      id: zId,
      issueId: zId,
      title: string2().trim().min(1).max(255),
      steps: array(zRedlineStepInput).min(1)
    }),
    output: zRedline,
    access: "signed-in",
    mcp: true
  }),
  listRedlines: op({
    name: "execution.listRedlines",
    method: "GET",
    path: "/executions/:id/redlines",
    summary: "Redline OPs of the execution.",
    input: object({ id: zId }),
    output: array(zRedline),
    access: "signed-in",
    mcp: true
  }),
  deleteRedline: op({
    name: "execution.deleteRedline",
    method: "DELETE",
    path: "/executions/:id/redlines/:redlineId",
    summary: "Delete a redline OP (by its step id) and its steps, only while nothing in it started.",
    input: object({ id: zId, redlineId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};

// ../../OPAL/packages/shared/src/domains/plugins.ts
var PANEL_SLOTS = ["issue.side", "part.side", "execution.side", "project.side"];
var PLUGIN_SETTING_TYPES = ["text", "url", "secret", "number", "boolean", "select", "json", "project-map"];
var zInnerPath = string2().min(1).max(200).refine((p) => !p.startsWith("/") && !p.split(/[\\/]/).includes(".."), "Must be a relative path inside the plugin");
var zOpPattern = string2().regex(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*(\.\*)?$|^\*$/, "Operation name or pattern");
var zEventPattern = string2().regex(/^[a-z_]+\*?$|^\*$/, "Event type or pattern");
var zPluginSettingDef = strictObject({
  key: string2().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).max(64),
  label: string2().min(1).max(80),
  type: _enum(PLUGIN_SETTING_TYPES),
  required: boolean2().optional(),
  options: array(string2().min(1).max(80)).max(50).optional(),
  optionsFrom: string2().regex(/^\/[^\s?#]*$/).max(200).optional(),
  default: union([string2(), number2(), boolean2()]).optional()
});
var zPluginOptions = object({
  items: array(object({ value: string2(), label: string2() }))
});
var zPluginPanelDef = strictObject({
  slot: _enum(PANEL_SLOTS),
  title: string2().min(1).max(40),
  path: string2().regex(/^\/[^\s?#]*$/).max(200)
});
var zPluginManifest = strictObject({
  id: string2().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, digits and hyphens").max(40),
  name: string2().min(1).max(60),
  version: string2().regex(/^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/, "Semver: 1.2.3"),
  opal: string2().min(1).max(60),
  main: zInnerPath,
  summary: string2().max(200).optional(),
  homepage: url().optional(),
  permissions: strictObject({
    ops: array(zOpPattern).max(200).default([]),
    events: array(zEventPattern).max(50).default([]),
    hooks: boolean2().default(false)
  }).default({ ops: [], events: [], hooks: false }),
  settings: array(zPluginSettingDef).max(50).default([]),
  panels: array(zPluginPanelDef).max(10).default([])
});
var PLUGIN_PROCESS_STATES = ["stopped", "starting", "running", "crashed"];
var zPluginProcess = object({
  state: _enum(PLUGIN_PROCESS_STATES),
  pid: number2().int().nullable(),
  startedAt: zTimestamp.nullable(),
  restarts: number2().int(),
  exitCode: number2().int().nullable()
});
var zPluginSummary = object({
  id: string2(),
  name: string2(),
  version: string2(),
  source: string2(),
  ref: string2().nullable(),
  sha: string2(),
  previousSha: string2().nullable(),
  enabled: boolean2(),
  process: zPluginProcess,
  installedAt: zTimestamp,
  updatedAt: zTimestamp
});
var zPluginSettingValue = object({
  key: string2(),
  value: unknown().nullable(),
  set: boolean2()
});
var zPluginDetail = zPluginSummary.extend({
  manifest: zPluginManifest,
  settings: array(zPluginSettingValue),
  log: array(string2()),
  username: string2()
});
var zPluginPreview = object({
  source: string2(),
  ref: string2().nullable(),
  sha: string2(),
  manifest: zPluginManifest,
  installed: object({ version: string2(), sha: string2(), permissions: zPluginManifest.shape.permissions }).nullable(),
  compatible: boolean2()
});
var zPluginPanel = object({
  plugin: string2(),
  title: string2(),
  src: string2()
});
var LINK_ENTITIES = ["issue", "part", "execution", "project"];
var zExternalLink = object({
  id: number2().int(),
  plugin: string2(),
  pluginName: string2(),
  entityType: _enum(LINK_ENTITIES),
  entityId: number2().int(),
  externalId: string2(),
  url: url(),
  label: string2().nullable(),
  updatedAt: zTimestamp
});
var zKey = object({ id: zPluginManifest.shape.id });
var zSource = string2().trim().min(3).max(300);
var plugins = {
  list: op({
    name: "plugins.list",
    method: "GET",
    path: "/plugins",
    summary: "List installed plugins and the state of their processes.",
    input: object({}),
    output: object({ items: array(zPluginSummary) }),
    access: "admin",
    mcp: false
  }),
  get: op({
    name: "plugins.get",
    method: "GET",
    path: "/plugins/:id",
    summary: "Get a plugin: manifest, settings (secrets masked), process state and log.",
    input: zKey,
    output: zPluginDetail,
    access: "admin",
    mcp: false
  }),
  preview: op({
    name: "plugins.preview",
    method: "POST",
    path: "/plugins/preview",
    summary: "Download a plugin from GitHub and show its manifest. Installs nothing.",
    input: object({ source: zSource }),
    output: zPluginPreview,
    access: "admin",
    mcp: false
  }),
  install: op({
    name: "plugins.install",
    method: "POST",
    path: "/plugins/install",
    summary: "Install or update a previewed plugin at the exact commit shown.",
    input: object({ source: zSource, sha: string2().regex(/^([0-9a-f]{40}|local)$/) }),
    output: zPluginDetail,
    access: "admin",
    humanOnly: true,
    mcp: false
  }),
  settings: op({
    name: "plugins.settings",
    method: "PUT",
    path: "/plugins/:id/settings",
    summary: "Save plugin settings and restart the plugin. A secret left out keeps its value.",
    input: zKey.extend({ values: record(string2(), unknown()) }),
    output: zPluginDetail,
    access: "admin",
    humanOnly: true,
    mcp: false
  }),
  enable: op({
    name: "plugins.enable",
    method: "POST",
    path: "/plugins/:id/enable",
    summary: "Start a plugin, now and on every server start.",
    input: zKey,
    output: zPluginDetail,
    access: "admin",
    humanOnly: true,
    mcp: false
  }),
  disable: op({
    name: "plugins.disable",
    method: "POST",
    path: "/plugins/:id/disable",
    summary: "Stop a plugin and revoke its token.",
    input: zKey,
    output: zPluginDetail,
    access: "admin",
    mcp: false
  }),
  restart: op({
    name: "plugins.restart",
    method: "POST",
    path: "/plugins/:id/restart",
    summary: "Restart the process of an enabled plugin.",
    input: zKey,
    output: zPluginDetail,
    access: "admin",
    mcp: false
  }),
  remove: op({
    name: "plugins.remove",
    method: "DELETE",
    path: "/plugins/:id",
    summary: "Stop a plugin, revoke its token, delete its files, settings and links. Its user stays, deactivated.",
    input: zKey,
    output: zOk,
    access: "admin",
    humanOnly: true,
    mcp: false
  }),
  panels: op({
    name: "plugins.panels",
    method: "GET",
    path: "/plugin-panels",
    summary: "Panels of the running plugins for one slot.",
    input: object({ slot: _enum(PANEL_SLOTS) }),
    output: object({ items: array(zPluginPanel) }),
    access: "signed-in",
    mcp: false
  }),
  links: {
    list: op({
      name: "plugins.links.list",
      method: "GET",
      path: "/links",
      summary: "External links of one record, for example the Kaneo task of an issue.",
      input: object({ entityType: _enum(LINK_ENTITIES), entityId: exports_coerce.number().int().positive() }),
      output: object({ items: array(zExternalLink) }),
      access: "signed-in",
      mcp: true
    }),
    set: op({
      name: "plugins.links.set",
      method: "PUT",
      path: "/links",
      summary: "Create or update the calling plugin's link of a record to an external item.",
      input: object({
        entityType: _enum(LINK_ENTITIES),
        entityId: exports_coerce.number().int().positive(),
        externalId: string2().min(1).max(200),
        url: url().max(1000),
        label: string2().max(120).nullish()
      }),
      output: zExternalLink,
      access: "signed-in",
      mcp: false
    }),
    remove: op({
      name: "plugins.links.remove",
      method: "DELETE",
      path: "/links",
      summary: "Remove the calling plugin's link of a record to an external item.",
      input: object({
        entityType: _enum(LINK_ENTITIES),
        entityId: exports_coerce.number().int().positive(),
        externalId: string2().min(1).max(200)
      }),
      output: zOk,
      access: "signed-in",
      mcp: false
    })
  }
};

// ../../OPAL/packages/shared/src/domains/inventory.ts
var MOVE_KINDS = ["receive", "consume", "produce", "adjust", "count", "transfer"];
var STOCK_SOURCES = ["purchase", "production", "manual", "transfer"];
var ADJUST_REASONS = ["found", "correction", "damage", "scrap", "cycle_count"];
var STOCK_TEST_RESULTS = ["pass", "fail", "pending"];
var STOCK_TEST_TYPES = ["boolean", "numeric", "text"];
var CALIBRATION_STATUSES = ["ok", "due_soon", "overdue"];
var STOCK_SORT_KEYS = [
  "opalNumber",
  "part",
  "name",
  "location",
  "quantity",
  "lotNumber",
  "expirationDate",
  "createdAt"
];
var STOCK_BY_PART_SORT_KEYS = ["part", "name", "quantity", "recordCount"];
var zStockDate = string2().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
var zStockFlag = union([boolean2(), _enum(["true", "false", "1", "0"])]).transform((v) => v === true || v === "true" || v === "1");
var zStockMoveLinks = record(string2(), number2().int());
var zStockRecord = object({
  id: number2().int(),
  opalNumber: string2(),
  partId: number2().int(),
  partInternalPn: string2(),
  partName: string2(),
  partExternalPn: string2().nullable(),
  partUom: string2(),
  partTrackingType: _enum(["serialized", "bulk"]),
  partIsTooling: boolean2(),
  balance: zQty,
  location: string2(),
  lotNumber: string2().nullable(),
  serialNumber: string2().nullable(),
  alias: string2().nullable(),
  sourceType: _enum(STOCK_SOURCES),
  expirationDate: zStockDate.nullable(),
  isExpired: boolean2(),
  daysUntilExpiration: number2().int().nullable(),
  lastCountedAt: zTimestamp.nullable(),
  lastCalibratedAt: zTimestamp.nullable(),
  calibrationDueAt: zTimestamp.nullable(),
  calibrationStatus: _enum(CALIBRATION_STATUSES).nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zStockPage = zPage(zStockRecord).extend({ total: number2().int() });
var zStockByPart = object({
  partId: number2().int(),
  internalPn: string2(),
  externalPn: string2().nullable(),
  name: string2(),
  unitOfMeasure: string2(),
  trackingType: _enum(["serialized", "bulk"]),
  reorderPoint: zQty.nullable(),
  balance: zQty,
  recordCount: number2().int(),
  locations: array(string2()),
  isLowStock: boolean2()
});
var zStockLocation = object({
  location: string2(),
  recordCount: number2().int(),
  partCount: number2().int()
});
var zStockLedgerRow = object({
  id: number2().int(),
  kind: _enum(MOVE_KINDS),
  at: zTimestamp,
  qty: zQty,
  balance: zQty,
  reason: string2().nullable(),
  notes: string2().nullable(),
  actorName: string2().nullable(),
  fromLocation: string2().nullable(),
  toLocation: string2().nullable(),
  fromLot: string2().nullable(),
  toLot: string2().nullable(),
  counterpartOpal: string2().nullable(),
  links: zStockMoveLinks
});
var zStockMoveRow = zStockLedgerRow.omit({ balance: true }).extend({
  opalNumber: string2(),
  partId: number2().int(),
  partInternalPn: string2(),
  partName: string2()
});
var zStockGenealogyRow = object({
  depth: number2().int(),
  viaOpal: string2(),
  opalNumber: string2(),
  partId: number2().int(),
  partInternalPn: string2(),
  partName: string2(),
  qtyUsed: zQty,
  at: zTimestamp
});
var zStockGenealogy = object({
  opalNumber: string2(),
  components: array(zStockGenealogyRow),
  usedIn: array(zStockGenealogyRow)
});
var zStockTestTemplate = object({
  id: number2().int(),
  partId: number2().int(),
  name: string2(),
  description: string2().nullable(),
  required: boolean2(),
  testType: _enum(STOCK_TEST_TYPES),
  minValue: zQty.nullable(),
  maxValue: zQty.nullable(),
  unit: string2().nullable(),
  sortOrder: number2().int(),
  createdAt: zTimestamp
});
var zStockTestTemplateCreate = object({
  name: string2().trim().min(1).max(255),
  description: string2().nullable().optional(),
  required: boolean2().default(false),
  testType: _enum(STOCK_TEST_TYPES).default("boolean"),
  minValue: zQty.nullable().optional(),
  maxValue: zQty.nullable().optional(),
  unit: string2().trim().max(50).nullable().optional(),
  sortOrder: number2().int().default(0)
});
var zStockTestResult = object({
  id: number2().int(),
  stockId: number2().int(),
  templateId: number2().int().nullable(),
  testName: string2(),
  result: _enum(STOCK_TEST_RESULTS),
  value: string2().nullable(),
  notes: string2().nullable(),
  testedAt: zTimestamp.nullable(),
  testedByName: string2().nullable(),
  createdAt: zTimestamp
});
var zStockTestResultInput = object({
  testName: string2().trim().min(1).max(255),
  templateId: number2().int().nullable().optional(),
  result: _enum(STOCK_TEST_RESULTS).default("pending"),
  value: string2().max(255).nullable().optional(),
  notes: string2().nullable().optional()
});
var zStockTestStatus = object({
  stockId: number2().int(),
  total: number2().int(),
  passed: number2().int(),
  failed: number2().int(),
  pending: number2().int(),
  requiredPassed: boolean2(),
  missingRequired: array(string2()),
  overall: _enum(STOCK_TEST_RESULTS)
});
var zStockDetail = object({
  record: zStockRecord,
  part: object({
    id: number2().int(),
    internalPn: string2(),
    externalPn: string2().nullable(),
    name: string2(),
    unitOfMeasure: string2(),
    trackingType: _enum(["serialized", "bulk"]),
    isTooling: boolean2(),
    tier: number2().int(),
    tierName: string2().nullable(),
    state: _enum(["draft", "active", "obsolete"])
  }),
  source: object({
    type: _enum(STOCK_SOURCES),
    links: zStockMoveLinks,
    transferredFromOpal: string2().nullable()
  }),
  ledger: array(zStockLedgerRow),
  components: array(zStockGenealogyRow),
  usedIn: array(zStockGenealogyRow),
  tests: array(zStockTestResult),
  testTemplates: array(zStockTestTemplate),
  testStatus: zStockTestStatus
});
var zStockCreate = object({
  partId: zId,
  quantity: zQty,
  location: string2().trim().min(1).max(255),
  lotNumber: string2().trim().max(100).nullable().optional(),
  serialNumber: string2().trim().max(100).nullable().optional(),
  alias: string2().trim().max(100).nullable().optional(),
  expirationDate: zStockDate.nullable().optional(),
  enforceTierRules: boolean2().default(true)
});
var zStockUpdate = object({
  id: zId,
  lotNumber: string2().trim().max(100).nullable().optional(),
  serialNumber: string2().trim().max(100).nullable().optional(),
  alias: string2().trim().max(100).nullable().optional(),
  expirationDate: zStockDate.nullable().optional()
});
var zStockTransferInput = object({
  sourceId: zId,
  targetLocation: string2().trim().min(1).max(255),
  quantity: zQty,
  targetLotNumber: string2().trim().max(100).nullable().optional(),
  notes: string2().nullable().optional()
});
var zReceivingRules = object({
  partId: number2().int(),
  requireLot: boolean2(),
  autoSerial: boolean2(),
  tierName: string2().nullable()
});
var zLowStockPart = object({
  partId: number2().int(),
  internalPn: string2(),
  name: string2(),
  unitOfMeasure: string2(),
  onHand: zQty,
  reorderPoint: zQty
});
var zCalibrationReport = object({
  overdue: array(zStockRecord),
  dueSoon: array(zStockRecord)
});
var zPartStockSummary = object({
  partId: number2().int(),
  partName: string2(),
  internalPn: string2(),
  tier: number2().int(),
  totalQty: zQty,
  recordCount: number2().int(),
  byLocation: array(object({ location: string2(), qty: zQty, opalNumber: string2() })),
  isTooling: boolean2(),
  calibrationDueAt: zTimestamp.nullable(),
  calibrationStatus: _enum(["ok", "overdue", "unknown"]).nullable(),
  calibrationIntervalDays: number2().int().nullable()
});
var zStockLabel = object({
  key: string2(),
  kind: _enum(["stock", "part"]),
  primary: string2(),
  secondary: string2().nullable(),
  name: string2(),
  lotNumber: string2().nullable(),
  serialNumber: string2().nullable(),
  location: string2().nullable(),
  balance: zQty.nullable(),
  unitOfMeasure: string2(),
  trackingType: _enum(["serialized", "bulk"]),
  expirationDate: zStockDate.nullable(),
  tier: number2().int().nullable(),
  tierName: string2().nullable(),
  partState: _enum(["draft", "active", "obsolete"]).nullable(),
  url: string2(),
  qrSvg: string2()
});
var stockFilters = object({
  partId: zId.optional(),
  location: string2().optional(),
  q: string2().optional(),
  lowStock: zStockFlag.optional()
});
var inventory = {
  list: op({
    name: "inventory.list",
    method: "GET",
    path: "/inventory",
    summary: "List stock records with balances. Filter by part, location, lot, text, source, depletion, low stock, expiry and calibration.",
    input: zPageInput.merge(stockFilters).extend({
      lotNumber: string2().optional(),
      sourceType: _enum(STOCK_SOURCES).optional(),
      hasStock: zStockFlag.optional(),
      expired: zStockFlag.optional(),
      expiringSoon: zStockFlag.optional(),
      calibrationOverdue: zStockFlag.optional(),
      attention: zStockFlag.optional(),
      sort: _enum(STOCK_SORT_KEYS).optional(),
      order: _enum(["asc", "desc"]).default("asc")
    }),
    output: zStockPage,
    access: "signed-in",
    mcp: true
  }),
  byPart: op({
    name: "inventory.byPart",
    method: "GET",
    path: "/inventory/by-part",
    summary: "On-hand stock grouped by part.",
    input: zPageInput.merge(stockFilters).extend({
      sort: _enum(STOCK_BY_PART_SORT_KEYS).default("part"),
      order: _enum(["asc", "desc"]).default("asc")
    }),
    output: zPage(zStockByPart).extend({ total: number2().int() }),
    access: "signed-in",
    mcp: true
  }),
  locations: op({
    name: "inventory.locations",
    method: "GET",
    path: "/inventory/locations",
    summary: "Stock locations with record and part counts.",
    input: object({}),
    output: array(zStockLocation),
    access: "signed-in",
    mcp: true
  }),
  labels: op({
    name: "inventory.labels",
    method: "GET",
    path: "/inventory/labels",
    summary: "StockLabel data with QR codes. `inventory` and `part` are comma lists of OPAL numbers and part ids. `origin` is the web address the QR codes point at.",
    input: object({
      inventory: string2().optional(),
      part: string2().optional(),
      origin: string2().optional()
    }),
    output: object({ labels: array(zStockLabel), failures: array(string2()) }),
    access: "signed-in",
    mcp: false
  }),
  receivingRules: op({
    name: "inventory.receivingRules",
    method: "GET",
    path: "/inventory/receiving-rules",
    summary: "What the part tier requires when stock is received: a lot number, or generated serials.",
    input: object({ partId: zId }),
    output: zReceivingRules,
    access: "signed-in",
    mcp: true
  }),
  calibration: op({
    name: "inventory.calibration",
    method: "GET",
    path: "/inventory/calibration",
    summary: "Tooling records whose calibration is overdue or due within 30 days.",
    input: object({}),
    output: zCalibrationReport,
    access: "signed-in",
    mcp: true
  }),
  lowStock: op({
    name: "inventory.lowStock",
    method: "GET",
    path: "/inventory/low-stock",
    summary: "Parts whose total on-hand is below their reorder point.",
    input: object({}),
    output: array(zLowStockPart),
    access: "signed-in",
    mcp: true
  }),
  moves: op({
    name: "inventory.moves",
    method: "GET",
    path: "/inventory/moves",
    summary: "The stock ledger across records, newest first. Filter by part, location, kind.",
    input: zPageInput.extend({
      partId: zId.optional(),
      location: string2().optional(),
      kind: _enum(MOVE_KINDS).optional()
    }),
    output: zPage(zStockMoveRow),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "inventory.create",
    method: "POST",
    path: "/inventory",
    summary: "Receive stock by hand. A serialized part gets one record per unit; a bulk part gets one record. Each record has its own OPAL number.",
    input: zStockCreate,
    output: object({ items: array(zStockRecord) }),
    access: "signed-in",
    mcp: true
  }),
  transfer: op({
    name: "inventory.transfer",
    method: "POST",
    path: "/inventory/transfer",
    summary: "Move stock to another location or lot. A whole move keeps the OPAL number. A partial move creates a record with a new OPAL number, or merges into the stock already there.",
    input: zStockTransferInput,
    output: object({ source: zStockRecord, target: zStockRecord }),
    access: "signed-in",
    mcp: true
  }),
  getByOpal: op({
    name: "inventory.getByOpal",
    method: "GET",
    path: "/inventory/opal/:opalNumber",
    summary: "Look up a stock record by OPAL number.",
    input: object({ opalNumber: string2() }),
    output: zStockRecord,
    access: "signed-in",
    mcp: true
  }),
  detail: op({
    name: "inventory.detail",
    method: "GET",
    path: "/inventory/opal/:opalNumber/detail",
    summary: "Everything the record page shows: record, part, source, ledger, genealogy both ways, tests.",
    input: object({ opalNumber: string2() }),
    output: zStockDetail,
    access: "signed-in",
    mcp: true
  }),
  history: op({
    name: "inventory.history",
    method: "GET",
    path: "/inventory/opal/:opalNumber/history",
    summary: "The ledger of one OPAL number, oldest first, with a running balance.",
    input: object({ opalNumber: string2() }),
    output: array(zStockLedgerRow),
    access: "signed-in",
    mcp: true
  }),
  genealogy: op({
    name: "inventory.genealogy",
    method: "GET",
    path: "/inventory/opal/:opalNumber/genealogy",
    summary: "Components that went into this item and assemblies it went into. `depth` follows the tree further (1 to 8).",
    input: object({ opalNumber: string2(), depth: exports_coerce.number().int().min(1).max(8).default(1) }),
    output: zStockGenealogy,
    access: "signed-in",
    mcp: true
  }),
  partSummary: op({
    name: "inventory.partSummary",
    method: "GET",
    path: "/inventory/parts/:partId/summary",
    summary: "Stock summary of a part: total on hand, records by location, calibration status.",
    input: object({ partId: zId }),
    output: zPartStockSummary,
    access: "signed-in",
    mcp: true
  }),
  templates: {
    list: op({
      name: "inventory.templates.list",
      method: "GET",
      path: "/inventory/parts/:partId/test-templates",
      summary: "Test templates of a part.",
      input: object({ partId: zId }),
      output: array(zStockTestTemplate),
      access: "signed-in",
      mcp: true
    }),
    create: op({
      name: "inventory.templates.create",
      method: "POST",
      path: "/inventory/parts/:partId/test-templates",
      summary: "Add a test template to a part.",
      input: zStockTestTemplateCreate.extend({ partId: zId }),
      output: zStockTestTemplate,
      access: "signed-in",
      mcp: true
    }),
    delete: op({
      name: "inventory.templates.delete",
      method: "DELETE",
      path: "/inventory/parts/:partId/test-templates/:templateId",
      summary: "Delete a test template. Results already recorded keep their test name.",
      input: object({ partId: zId, templateId: zId }),
      output: zOk,
      access: "signed-in",
      mcp: true
    })
  },
  get: op({
    name: "inventory.get",
    method: "GET",
    path: "/inventory/:id",
    summary: "Get one stock record.",
    input: object({ id: zId }),
    output: zStockRecord,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "inventory.update",
    method: "PATCH",
    path: "/inventory/:id",
    summary: "Edit lot, serial, alias or expiration date. Quantity changes only through adjust, count and transfer.",
    input: zStockUpdate,
    output: zStockRecord,
    access: "signed-in",
    mcp: true
  }),
  adjust: op({
    name: "inventory.adjust",
    method: "POST",
    path: "/inventory/:id/adjust",
    summary: "Add or remove stock with a reason. `found` must add. `damage` and `scrap` must remove. The balance cannot go below zero.",
    input: object({
      id: zId,
      adjustment: zQty,
      reason: _enum(ADJUST_REASONS),
      notes: string2().nullable().optional()
    }),
    output: zStockRecord,
    access: "signed-in",
    mcp: true
  }),
  count: op({
    name: "inventory.count",
    method: "POST",
    path: "/inventory/:id/count",
    summary: "Record a physical count. The difference to the balance becomes a count move.",
    input: object({ id: zId, countedQuantity: zQty, notes: string2().nullable().optional() }),
    output: zStockRecord,
    access: "signed-in",
    mcp: true
  }),
  calibrate: op({
    name: "inventory.calibrate",
    method: "POST",
    path: "/inventory/:id/calibrate",
    summary: "Record a calibration of a tooling item. The next due date follows the part interval.",
    input: object({ id: zId }),
    output: zStockRecord,
    access: "signed-in",
    mcp: true
  }),
  tests: {
    list: op({
      name: "inventory.tests.list",
      method: "GET",
      path: "/inventory/:id/tests",
      summary: "Test results of a stock record, newest first.",
      input: object({ id: zId }),
      output: array(zStockTestResult),
      access: "signed-in",
      mcp: true
    }),
    create: op({
      name: "inventory.tests.create",
      method: "POST",
      path: "/inventory/:id/tests",
      summary: "Record a test result against a stock record.",
      input: zStockTestResultInput.extend({ id: zId }),
      output: zStockTestResult,
      access: "signed-in",
      mcp: true
    }),
    update: op({
      name: "inventory.tests.update",
      method: "PATCH",
      path: "/inventory/:id/tests/:testId",
      summary: "Change a test result.",
      input: zStockTestResultInput.extend({ id: zId, testId: zId }),
      output: zStockTestResult,
      access: "signed-in",
      mcp: true
    }),
    delete: op({
      name: "inventory.tests.delete",
      method: "DELETE",
      path: "/inventory/:id/tests/:testId",
      summary: "Delete a test result.",
      input: object({ id: zId, testId: zId }),
      output: zOk,
      access: "signed-in",
      mcp: true
    }),
    status: op({
      name: "inventory.tests.status",
      method: "GET",
      path: "/inventory/:id/test-status",
      summary: "Counts of passed, failed and pending tests, and whether the required tests passed.",
      input: object({ id: zId }),
      output: zStockTestStatus,
      access: "signed-in",
      mcp: true
    })
  }
};

// ../../OPAL/packages/shared/src/domains/issues.ts
var ISSUE_TYPES = ["non_conformance", "bug", "task", "improvement"];
var ISSUE_STATUSES = ["open", "closed", "void"];
var ISSUE_PRIORITIES = ["low", "medium", "high", "critical"];
var DISPOSITION_TYPES = [
  "use_as_is",
  "rework",
  "repair",
  "scrap",
  "return_to_supplier",
  "no_defect"
];
var CONTAINMENTS = ["advisory", "step", "op", "wo"];
var TICKET_STATES = ["pending", "in_work", "in_review", "done"];
var DISP_STATES = ["open", "undispositioned", "dispositioned", "closed", "void"];
var ISSUE_LINK_KINDS = ["part", "risk"];
var ISSUE_SORTS = ["number", "title", "type", "state", "priority", "created", "updated"];
var zUserRef = object({ id: number2().int(), name: string2(), avatarUrl: string2().nullable() });
var zIssueLink = object({
  id: number2().int(),
  kind: _enum(ISSUE_LINK_KINDS),
  targetId: number2().int(),
  label: string2(),
  sublabel: string2().nullable(),
  href: string2()
});
var zExecutionRef = object({
  id: number2().int(),
  label: string2().nullable(),
  procedureId: number2().int().nullable(),
  procedureName: string2().nullable()
});
var zLinkedRisk = object({
  riskId: number2().int(),
  riskNumber: string2(),
  title: string2(),
  relation: _enum(["mitigation", "research", "realized"])
});
var zRedlineOp = object({
  stepNumber: number2().int(),
  label: string2(),
  title: string2(),
  status: string2()
});
var zStepOption = object({ id: number2().int(), label: string2(), title: string2() });
var zIssue = object({
  id: number2().int(),
  issueNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  title: string2(),
  description: string2().nullable(),
  issueType: _enum(ISSUE_TYPES),
  status: _enum(ISSUE_STATUSES),
  priority: _enum(ISSUE_PRIORITIES),
  containment: _enum(CONTAINMENTS),
  containmentStepId: number2().int().nullable(),
  executionId: number2().int().nullable(),
  execution: zExecutionRef.nullable(),
  raisedStepId: number2().int().nullable(),
  raisedStepLabel: string2().nullable(),
  containmentStepLabel: string2().nullable(),
  dispState: _enum(DISP_STATES),
  dispositioned: boolean2(),
  ticketState: _enum(TICKET_STATES),
  isBlocking: boolean2(),
  selfDispositioned: boolean2(),
  shouldBe: string2().nullable(),
  actual: string2().nullable(),
  stepsToReproduce: string2().nullable(),
  expectedBehavior: string2().nullable(),
  actualBehavior: string2().nullable(),
  expectedBenefit: string2().nullable(),
  rootCause: string2().nullable(),
  correctiveAction: string2().nullable(),
  dispositionType: _enum(DISPOSITION_TYPES).nullable(),
  dispositionRationale: string2().nullable(),
  dispositionedAt: zTimestamp.nullable(),
  dispositionedBy: zUserRef.nullable(),
  workStartedAt: zTimestamp.nullable(),
  workStartedBy: zUserRef.nullable(),
  reviewRequestedAt: zTimestamp.nullable(),
  reviewRequestedBy: zUserRef.nullable(),
  closedAt: zTimestamp.nullable(),
  closedBy: zUserRef.nullable(),
  raisedBy: zUserRef.nullable(),
  assignedTo: zUserRef.nullable(),
  links: array(zIssueLink),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zIssueDetail = zIssue.extend({
  canDisposition: boolean2(),
  canApprove: boolean2(),
  raisedOpOrder: number2().int().nullable(),
  risks: array(zLinkedRisk),
  redlineOps: array(zRedlineOp),
  gateReasons: object({ disposition: string2().optional(), approve: string2().optional() })
});
var zIssueComment = object({
  id: number2().int(),
  issueId: number2().int(),
  user: zUserRef.nullable(),
  body: string2(),
  createdAt: zTimestamp
});
var zHoldTarget = object({
  scope: _enum(["step", "op", "wo"]),
  executionId: number2().int(),
  stepId: number2().int().nullable(),
  label: string2(),
  href: string2()
});
var text = string2().nullable().optional();
var zLinkInput = object({ kind: _enum(ISSUE_LINK_KINDS), targetId: zId });
var zIssueCreate = object({
  projectId: zId,
  title: string2().trim().min(1).max(255),
  description: text,
  issueType: _enum(ISSUE_TYPES).default("task"),
  priority: _enum(ISSUE_PRIORITIES).default("medium"),
  containment: _enum(CONTAINMENTS).default("advisory"),
  containmentStepId: number2().int().positive().nullable().optional(),
  shouldBe: text,
  actual: text,
  stepsToReproduce: text,
  expectedBehavior: text,
  actualBehavior: text,
  expectedBenefit: text,
  executionId: number2().int().positive().nullable().optional(),
  raisedStepId: number2().int().positive().nullable().optional(),
  assignedToId: number2().int().positive().nullable().optional(),
  links: array(zLinkInput).default([])
});
var zIssueUpdate = object({
  id: zId,
  projectId: zId.optional(),
  title: string2().trim().min(1).max(255).optional(),
  description: text,
  issueType: _enum(ISSUE_TYPES).optional(),
  status: _enum(["open", "closed"]).optional(),
  priority: _enum(ISSUE_PRIORITIES).optional(),
  shouldBe: text,
  actual: text,
  stepsToReproduce: text,
  expectedBehavior: text,
  actualBehavior: text,
  expectedBenefit: text,
  rootCause: text,
  correctiveAction: text,
  dispositionType: _enum(DISPOSITION_TYPES).nullable().optional(),
  dispositionRationale: text,
  assignedToId: number2().int().positive().nullable().optional(),
  executionId: number2().int().positive().nullable().optional()
});
var issues = {
  list: op({
    name: "issues.list",
    method: "GET",
    path: "/issues",
    summary: "List issues. Default order: undispositioned containment issues first, then newest. `state` is a comma list of ticket states.",
    input: zPageInput.extend({
      q: string2().optional(),
      projectId: zId.optional(),
      issueType: _enum(ISSUE_TYPES).optional(),
      status: _enum(ISSUE_STATUSES).optional(),
      dispState: _enum(DISP_STATES).optional(),
      state: string2().optional(),
      priority: _enum(ISSUE_PRIORITIES).optional(),
      assignedToId: zId.optional(),
      partId: zId.optional(),
      executionId: zId.optional(),
      procedureId: zId.optional(),
      sort: _enum(ISSUE_SORTS).optional(),
      dir: _enum(["asc", "desc"]).default("desc")
    }),
    output: zPage(zIssue).extend({ total: number2().int() }),
    access: "signed-in",
    mcp: true
  }),
  assignees: op({
    name: "issues.assignees",
    method: "GET",
    path: "/issues/assignees",
    summary: "Active users an issue can be assigned to.",
    input: zEmpty,
    output: array(zUserRef),
    access: "signed-in",
    mcp: false
  }),
  get: op({
    name: "issues.get",
    method: "GET",
    path: "/issues/:id",
    summary: "Get one issue with its links and the viewer gate flags.",
    input: object({ id: zId }),
    output: zIssueDetail,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "issues.create",
    method: "POST",
    path: "/issues",
    summary: "Raise an issue. Any containment above advisory holds work until a disposition is signed.",
    input: zIssueCreate,
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "issues.update",
    method: "PATCH",
    path: "/issues/:id",
    summary: "Edit an issue. Closing needs the issue.approve gate. A signed disposition cannot be edited.",
    input: zIssueUpdate,
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  start: op({
    name: "issues.start",
    method: "POST",
    path: "/issues/:id/start",
    summary: "Advisory issue: pending to in work. Containment issues enter work by disposition.",
    input: object({ id: zId }),
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  review: op({
    name: "issues.review",
    method: "POST",
    path: "/issues/:id/review",
    summary: "In work to in review.",
    input: object({ id: zId }),
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  returnFromReview: op({
    name: "issues.returnFromReview",
    method: "POST",
    path: "/issues/:id/review/return",
    summary: "In review to in work. The comment is stored on the issue.",
    input: object({ id: zId, comment: string2().min(1) }),
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  signOff: op({
    name: "issues.signOff",
    method: "POST",
    path: "/issues/:id/signoff",
    summary: "In review to done: closes the issue under the closing rules.",
    input: object({ id: zId }),
    output: zIssue,
    access: "issue.approve",
    mcp: false,
    humanOnly: true
  }),
  signDisposition: op({
    name: "issues.signDisposition",
    method: "POST",
    path: "/issues/:id/disposition",
    summary: "Sign the disposition. Releases every containment the issue holds.",
    input: object({
      id: zId,
      dispositionType: _enum(DISPOSITION_TYPES),
      dispositionRationale: string2().trim().min(1)
    }),
    output: zIssue,
    access: "issue.disposition",
    mcp: true,
    humanOnly: true
  }),
  setContainment: op({
    name: "issues.setContainment",
    method: "POST",
    path: "/issues/:id/containment",
    summary: "Change the containment scope. Narrowing a hold needs a note. containmentStepId: absent keeps, null clears.",
    input: object({
      id: zId,
      containment: _enum(CONTAINMENTS),
      containmentStepId: number2().int().positive().nullable().optional(),
      note: string2().nullable().optional()
    }),
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  void: op({
    name: "issues.void",
    method: "POST",
    path: "/issues/:id/void",
    summary: "Void an issue raised by mistake. Releases its holds. The reason is kept as a comment.",
    input: object({ id: zId, reason: string2().trim().min(1) }),
    output: zIssue,
    access: "signed-in",
    mcp: true
  }),
  steps: op({
    name: "issues.steps",
    method: "GET",
    path: "/issues/:id/steps",
    summary: "Steps of the issue work order: the candidates for a containment boundary.",
    input: object({ id: zId }),
    output: array(zStepOption),
    access: "signed-in",
    mcp: false
  }),
  holding: op({
    name: "issues.holding",
    method: "GET",
    path: "/issues/:id/holding",
    summary: "What the issue is stopping. Empty for advisory or dispositioned issues. `containment` previews a proposed scope.",
    input: object({ id: zId, containment: _enum(CONTAINMENTS).optional() }),
    output: array(zHoldTarget),
    access: "signed-in",
    mcp: true
  }),
  listComments: op({
    name: "issues.listComments",
    method: "GET",
    path: "/issues/:id/comments",
    summary: "Comments and activity notes on an issue, oldest first.",
    input: object({ id: zId }),
    output: array(zIssueComment),
    access: "signed-in",
    mcp: true
  }),
  addComment: op({
    name: "issues.addComment",
    method: "POST",
    path: "/issues/:id/comments",
    summary: "Comment on an issue.",
    input: object({ id: zId, body: string2().trim().min(1) }),
    output: zIssueComment,
    access: "signed-in",
    mcp: true
  }),
  addLink: op({
    name: "issues.addLink",
    method: "POST",
    path: "/issues/:id/links",
    summary: "Link an issue to another record.",
    input: object({ id: zId, kind: _enum(ISSUE_LINK_KINDS), targetId: zId }),
    output: zIssueLink,
    access: "signed-in",
    mcp: true
  }),
  removeLink: op({
    name: "issues.removeLink",
    method: "DELETE",
    path: "/issues/:id/links/:linkId",
    summary: "Remove a link from an issue.",
    input: object({ id: zId, linkId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};

// ../../OPAL/packages/shared/src/domains/parts.ts
var TRACKING_TYPES = ["serialized", "bulk"];
var PROCUREMENT = ["make", "buy", "both"];
var PART_STATES = ["draft", "active", "obsolete"];
var PART_SORT_KEYS = [
  "id",
  "internalPn",
  "externalPn",
  "name",
  "category",
  "tier",
  "state",
  "procurement",
  "unitOfMeasure",
  "createdAt",
  "updatedAt"
];
var CUSTOM_FIELD_TYPES = ["text", "number", "boolean", "select"];
var zPartMetadata = record(string2(), unknown());
var zPart = object({
  id: number2().int(),
  internalPn: string2(),
  externalPn: string2().nullable(),
  name: string2(),
  description: string2().nullable(),
  category: string2().nullable(),
  unitOfMeasure: string2(),
  trackingType: _enum(TRACKING_TYPES),
  procurement: _enum(PROCUREMENT),
  tier: number2().int(),
  tierName: string2().nullable(),
  reorderPoint: zQty.nullable(),
  isTooling: boolean2(),
  calibrationIntervalDays: number2().int().nullable(),
  metadata: zPartMetadata.nullable(),
  state: _enum(PART_STATES),
  activatedAt: zTimestamp.nullable(),
  activationCause: string2().nullable(),
  obsoletedAt: zTimestamp.nullable(),
  obsoleteCause: string2().nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zBool = union([boolean2(), _enum(["true", "false"]).transform((v) => v === "true")]);
var partFields = {
  externalPn: string2().trim().max(255).nullable().optional(),
  description: string2().nullable().optional(),
  category: string2().trim().max(100).nullable().optional(),
  reorderPoint: zQty.nullable().optional(),
  isTooling: boolean2().optional(),
  calibrationIntervalDays: number2().int().positive().nullable().optional(),
  metadata: zPartMetadata.nullable().optional()
};
var zPartCreate = object({
  name: string2().trim().min(1).max(255),
  tier: number2().int().min(1).default(1),
  internalPn: string2().trim().min(1).max(50).optional(),
  unitOfMeasure: string2().trim().min(1).max(20).default("ea"),
  trackingType: _enum(TRACKING_TYPES).optional(),
  procurement: _enum(PROCUREMENT).optional(),
  assemblyId: zId.optional(),
  assemblyQuantity: zQty.optional(),
  ...partFields,
  isTooling: boolean2().default(false)
});
var zPartUpdate = object({
  id: zId,
  name: string2().trim().min(1).max(255).optional(),
  internalPn: string2().trim().min(1).max(50).optional(),
  tier: number2().int().min(1).optional(),
  unitOfMeasure: string2().trim().min(1).max(20).optional(),
  trackingType: _enum(TRACKING_TYPES).optional(),
  procurement: _enum(PROCUREMENT).optional(),
  ...partFields
});
var zBomLine = object({
  id: number2().int(),
  assemblyId: number2().int(),
  assemblyPn: string2(),
  assemblyName: string2(),
  componentId: number2().int(),
  componentPn: string2(),
  componentName: string2(),
  componentExternalPn: string2().nullable(),
  componentTier: number2().int(),
  componentState: _enum(PART_STATES),
  quantity: zQty,
  referenceDesignator: string2().nullable(),
  notes: string2().nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zBomTreeNode = lazy(() => object({
  partId: number2().int(),
  internalPn: string2(),
  name: string2(),
  externalPn: string2().nullable(),
  tier: number2().int(),
  state: _enum(PART_STATES),
  quantity: zQty,
  referenceDesignator: string2().nullable(),
  circular: boolean2(),
  children: array(zBomTreeNode)
}));
var zPartExpects = object({ bom: boolean2(), suppliers: boolean2(), poLines: boolean2() });
var zPartDetail = object({
  part: zPart,
  tierCode: string2().nullable(),
  activatedBy: string2().nullable(),
  expects: zPartExpects,
  references: record(string2(), number2().int()),
  deletable: boolean2(),
  bom: array(zBomLine),
  whereUsed: array(zBomLine)
});
var zHistoryEntry = object({
  at: zTimestamp,
  action: _enum(["create", "update", "delete"]),
  op: string2(),
  userName: string2().nullable(),
  changes: array(object({ field: string2(), old: unknown(), new: unknown() }))
});
var zPartHistory = object({ items: array(zHistoryEntry), total: number2().int() });
var zSchemaTier = object({
  level: number2().int(),
  name: string2(),
  code: string2(),
  description: string2(),
  defaultTracking: _enum(TRACKING_TYPES),
  requireLot: boolean2(),
  autoSerial: boolean2()
});
var zCustomFieldDef = object({
  key: string2(),
  label: string2(),
  type: _enum(CUSTOM_FIELD_TYPES),
  options: array(string2()),
  default: unknown(),
  required: boolean2()
});
var zPartSchema = object({
  tiers: array(zSchemaTier),
  categories: array(string2()),
  customFields: array(zCustomFieldDef),
  numberingFormat: string2().nullable()
});
var zNextPn = object({
  partNumber: string2(),
  sequence: number2().int(),
  tier: number2().int(),
  tierName: string2().nullable(),
  defaultTracking: _enum(TRACKING_TYPES)
});
var zImportRowPreview = object({
  rowNumber: number2().int(),
  name: string2().nullable(),
  externalPn: string2().nullable(),
  tier: number2().int().nullable(),
  category: string2().nullable(),
  unitOfMeasure: string2().nullable(),
  trackingType: string2().nullable(),
  procurement: string2().nullable(),
  description: string2().nullable(),
  reorderPoint: zQty.nullable(),
  errors: array(string2()),
  warnings: array(string2()),
  valid: boolean2()
});
var zImportPreview = object({
  totalRows: number2().int(),
  validRows: number2().int(),
  errorRows: number2().int(),
  warningRows: number2().int(),
  rows: array(zImportRowPreview),
  headersFound: array(string2())
});
var zImportResult = object({
  created: number2().int(),
  skipped: number2().int(),
  errors: array(string2()),
  firstPn: string2().nullable(),
  lastPn: string2().nullable()
});
var MAX_BULK_PARTS = 500;
var parts_ = {
  nextPn: op({
    name: "parts.nextPn",
    method: "GET",
    path: "/parts/next-pn",
    summary: "Preview the next part number for a tier without using it.",
    input: object({ tier: exports_coerce.number().int().min(1) }),
    output: zNextPn,
    access: "signed-in",
    mcp: true
  }),
  categories: op({
    name: "parts.categories",
    method: "GET",
    path: "/parts/categories",
    summary: "List the categories in use on parts.",
    input: object({}),
    output: array(string2()),
    access: "signed-in",
    mcp: true
  }),
  schema: op({
    name: "parts.schema",
    method: "GET",
    path: "/parts/schema",
    summary: "Tiers, categories, custom fields and the numbering format from the project configuration.",
    input: object({}),
    output: zPartSchema,
    access: "signed-in",
    mcp: true
  }),
  reserve: op({
    name: "parts.reserve",
    method: "POST",
    path: "/parts/reserve",
    summary: "Reserve a block of part numbers as draft parts, for label pre-printing or vendor pre-allocation.",
    input: object({
      tier: number2().int().min(1).default(1),
      count: number2().int().min(1).max(500),
      namePrefix: string2().trim().min(1).max(100).optional()
    }),
    output: object({ parts: array(zPart), firstPn: string2(), lastPn: string2() }),
    access: "signed-in",
    mcp: true
  }),
  importPreview: op({
    name: "parts.importPreview",
    method: "POST",
    path: "/parts/import/preview",
    summary: "Parse and check CSV text for a parts import. Creates nothing.",
    input: object({ csv: string2().min(1) }),
    output: zImportPreview,
    access: "signed-in",
    mcp: true
  }),
  import: op({
    name: "parts.import",
    method: "POST",
    path: "/parts/import",
    summary: "Create draft parts from checked rows. A bad row is reported and does not stop the others.",
    input: object({
      rows: array(zPartCreate).max(5000),
      skipDuplicates: boolean2().default(true)
    }),
    output: zImportResult,
    access: "signed-in",
    mcp: true
  }),
  activateMany: op({
    name: "parts.activateMany",
    method: "POST",
    path: "/parts/activate",
    summary: "Activate several draft parts. Parts that are not drafts are skipped and reported.",
    input: object({
      partIds: array(zId).min(1).max(MAX_BULK_PARTS),
      cause: string2().trim().min(1).max(255).optional()
    }),
    output: object({
      activated: array(zPart),
      skipped: array(object({ id: number2().int(), reason: string2() }))
    }),
    access: "signed-in",
    mcp: true
  }),
  createMany: op({
    name: "parts.createMany",
    method: "POST",
    path: "/parts/bulk",
    summary: "Create several draft parts in one transaction. One bad part rejects the batch.",
    input: object({ parts: array(zPartCreate).min(1).max(MAX_BULK_PARTS) }),
    output: object({ parts: array(zPart) }),
    access: "signed-in",
    mcp: true
  }),
  list: op({
    name: "parts.list",
    method: "GET",
    path: "/parts",
    summary: "List parts. Filter by text, state, tier, category, procurement and tooling. Newest first by default.",
    input: zPageInput.extend({
      q: string2().optional(),
      state: _enum(PART_STATES).optional(),
      category: string2().optional(),
      tier: exports_coerce.number().int().optional(),
      procurement: _enum(PROCUREMENT).optional(),
      tooling: zBool.optional(),
      usedIn: zId.optional(),
      topLevel: zBool.optional(),
      sort: _enum(PART_SORT_KEYS).default("id"),
      dir: _enum(["asc", "desc"]).default("desc")
    }),
    output: zPage(zPart),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "parts.create",
    method: "POST",
    path: "/parts",
    summary: "Create a draft part. A part number is assigned unless one is given.",
    input: zPartCreate,
    output: zPart,
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "parts.get",
    method: "GET",
    path: "/parts/:id",
    summary: "Get one part.",
    input: object({ id: zId }),
    output: zPart,
    access: "signed-in",
    mcp: true
  }),
  detail: op({
    name: "parts.detail",
    method: "GET",
    path: "/parts/:id/detail",
    summary: "The part page: the part, its lifecycle facts, BOM and where-used.",
    input: object({ id: zId }),
    output: zPartDetail,
    access: "signed-in",
    mcp: true
  }),
  history: op({
    name: "parts.history",
    method: "GET",
    path: "/parts/:id/history",
    summary: "Audit trail of a part, newest first.",
    input: object({ id: zId, limit: exports_coerce.number().int().min(1).max(200).default(15) }),
    output: zPartHistory,
    access: "signed-in",
    mcp: true
  }),
  qrcode: op({
    name: "parts.qrcode",
    method: "GET",
    path: "/parts/:id/qrcode",
    summary: "QR code (SVG text) that links to the part page.",
    input: object({ id: zId, origin: string2().max(200).optional() }),
    output: object({ svg: string2(), url: string2() }),
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "parts.update",
    method: "PATCH",
    path: "/parts/:id",
    summary: "Edit a part. Omit a field to keep it; send null to clear a nullable field. Part number and tier change only while draft.",
    input: zPartUpdate,
    output: zPart,
    access: "signed-in",
    mcp: true
  }),
  delete: op({
    name: "parts.delete",
    method: "DELETE",
    path: "/parts/:id",
    summary: "Delete a draft part that nothing references. Its number is retired and never issued again.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  activate: op({
    name: "parts.activate",
    method: "POST",
    path: "/parts/:id/activate",
    summary: "Activate a draft part. This locks its part number and tier for good.",
    input: object({ id: zId, cause: string2().trim().min(1).max(255).optional() }),
    output: zPart,
    access: "signed-in",
    mcp: true
  }),
  obsolete: op({
    name: "parts.obsolete",
    method: "POST",
    path: "/parts/:id/obsolete",
    summary: "Retire an active part. Records that reference it keep working.",
    input: object({ id: zId, cause: string2().trim().min(1).max(255).optional() }),
    output: zPart,
    access: "signed-in",
    mcp: true
  })
};
var bom = {
  list: op({
    name: "parts.bom.list",
    method: "GET",
    path: "/parts/:id/bom",
    summary: "The components of an assembly: one level of its BOM.",
    input: object({ id: zId }),
    output: array(zBomLine),
    access: "signed-in",
    mcp: true
  }),
  tree: op({
    name: "parts.bom.tree",
    method: "GET",
    path: "/parts/:id/bom/tree",
    summary: "The full BOM of an assembly as a tree, to a depth. Each node carries its quantity in its parent.",
    input: object({ id: zId, depth: exports_coerce.number().int().min(1).max(50).default(20) }),
    output: zBomTreeNode,
    access: "signed-in",
    mcp: true
  }),
  whereUsed: op({
    name: "parts.bom.whereUsed",
    method: "GET",
    path: "/parts/:id/where-used",
    summary: "The assemblies that use a part as a component.",
    input: object({ id: zId }),
    output: array(zBomLine),
    access: "signed-in",
    mcp: true
  }),
  add: op({
    name: "parts.bom.add",
    method: "POST",
    path: "/parts/:id/bom",
    summary: "Add a component to an assembly. A part cannot contain itself, directly or through a sub-assembly.",
    input: object({
      id: zId,
      componentId: zId,
      quantity: zQty.default("1"),
      referenceDesignator: string2().trim().max(50).nullable().optional(),
      notes: string2().nullable().optional()
    }),
    output: zBomLine,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "parts.bom.update",
    method: "PATCH",
    path: "/bom/:lineId",
    summary: "Change a BOM line. Omit a field to keep it; send null to clear the designator or notes.",
    input: object({
      lineId: zId,
      quantity: zQty.optional(),
      referenceDesignator: string2().trim().max(50).nullable().optional(),
      notes: string2().nullable().optional()
    }),
    output: zBomLine,
    access: "signed-in",
    mcp: true
  }),
  remove: op({
    name: "parts.bom.remove",
    method: "DELETE",
    path: "/bom/:lineId",
    summary: "Remove a component from an assembly.",
    input: object({ lineId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};
var parts = { ...parts_, bom };

// ../../OPAL/packages/shared/src/domains/platform.ts
var ATTACHMENT_KINDS = [
  "inline",
  "reference",
  "closeout",
  "capture",
  "step_image",
  "quote",
  "invoice",
  "packing_slip"
];
var zAttachment = object({
  id: number2().int(),
  sha256: string2(),
  filename: string2(),
  mimeType: string2(),
  sizeBytes: number2().int(),
  ownerType: string2(),
  ownerId: number2().int(),
  kind: _enum(ATTACHMENT_KINDS).nullable(),
  note: string2().nullable(),
  uploadedById: number2().int().nullable(),
  uploadedByName: string2().nullable(),
  createdAt: zTimestamp,
  href: string2()
});
var zEvent = object({
  type: string2(),
  data: record(string2(), unknown()),
  timestamp: zTimestamp
});
var zPresence = object({
  userId: number2().int(),
  name: string2(),
  activity: string2().nullable(),
  lastSeenAt: zTimestamp
});
var NOTIFICATION_KINDS = [
  "issue_assigned",
  "issue_dispositioned",
  "issue_commented",
  "issue_closed",
  "execution_blocked",
  "execution_unblocked"
];
var NOTIFICATION_CATEGORIES = ["issues", "executions"];
var NOTIFICATION_PRIORITIES = ["low", "normal", "high", "critical"];
var NOTIFICATION_SORTS = ["recent", "priority", "unread"];
var NOTIFICATION_STATES = ["unread", "read"];
var zNotification = object({
  id: number2().int(),
  kind: _enum(NOTIFICATION_KINDS),
  category: _enum(NOTIFICATION_CATEGORIES),
  priority: _enum(NOTIFICATION_PRIORITIES),
  title: string2(),
  body: string2().nullable(),
  href: string2(),
  subjectType: string2(),
  subjectId: number2().int(),
  createdAt: zTimestamp,
  readAt: zTimestamp.nullable(),
  actorName: string2().nullable()
});
var AUDIT_ACTIONS = ["create", "update", "delete"];
var zFieldChange = object({
  field: string2(),
  old: unknown().nullable(),
  new: unknown().nullable(),
  oldLabel: string2().nullable(),
  newLabel: string2().nullable()
});
var zAuditEntry = object({
  id: number2().int(),
  at: zTimestamp,
  action: _enum(AUDIT_ACTIONS),
  entity: string2(),
  entityLabel: string2(),
  entityId: number2().int(),
  recordLabel: string2().nullable(),
  href: string2().nullable(),
  op: string2(),
  userId: number2().int().nullable(),
  userName: string2().nullable(),
  changes: array(zFieldChange)
});
var zAuditFacets = object({
  entities: array(object({ value: string2(), label: string2() })),
  users: array(object({ id: number2().int(), name: string2() }))
});
var zUndoPreview = object({
  auditId: number2().int(),
  op: string2(),
  summary: string2(),
  at: zTimestamp,
  canUndo: boolean2(),
  reason: string2().nullable()
});
var zSearchHit = object({
  entityType: string2(),
  id: number2().int(),
  label: string2(),
  sublabel: string2().nullable(),
  href: string2(),
  status: string2().nullable()
});
var zAbout = object({
  version: string2(),
  isDev: boolean2(),
  dbPath: string2(),
  operations: array(object({ name: string2(), method: string2(), path: string2() }))
});
var HEALTH_STATES = ["ok", "degraded", "down"];
var zHealth = object({
  status: _enum(HEALTH_STATES),
  version: string2(),
  checks: array(object({
    name: _enum(["database", "storage", "disk"]),
    ok: boolean2(),
    detail: string2().nullable()
  }))
});
var platform = {
  health: op({
    name: "platform.health",
    method: "GET",
    path: "/health",
    summary: "Server health: database readable and writable, file storage writable, free disk space. Always 200; `status` carries the state.",
    input: zEmpty,
    output: zHealth,
    access: "public",
    mcp: false
  }),
  about: op({
    name: "platform.about",
    method: "GET",
    path: "/about",
    summary: "Server version and the list of implemented operations.",
    input: zEmpty,
    output: zAbout,
    access: "signed-in",
    mcp: false
  }),
  attachments: {
    list: op({
      name: "attachments.list",
      method: "GET",
      path: "/attachments",
      summary: "List the files attached to one record, newest first.",
      input: object({
        ownerType: string2(),
        ownerId: zId,
        kind: _enum(ATTACHMENT_KINDS).optional()
      }),
      output: array(zAttachment),
      access: "signed-in",
      mcp: true
    }),
    update: op({
      name: "attachments.update",
      method: "PATCH",
      path: "/attachments/:id",
      summary: "Change the kind or the note of an attachment.",
      input: object({
        id: zId,
        kind: _enum(ATTACHMENT_KINDS).nullable().optional(),
        note: string2().max(2000).nullable().optional()
      }),
      output: zAttachment,
      access: "signed-in",
      mcp: true
    }),
    delete: op({
      name: "attachments.delete",
      method: "DELETE",
      path: "/attachments/:id",
      summary: "Remove an attachment link. The stored file stays while anything references it.",
      input: object({ id: zId }),
      output: zOk,
      access: "signed-in",
      mcp: true
    })
  },
  events: {
    stats: op({
      name: "events.stats",
      method: "GET",
      path: "/events/stats",
      summary: "Number of connected event-stream clients.",
      input: zEmpty,
      output: object({ connectedClients: number2().int() }),
      access: "signed-in",
      mcp: false
    })
  },
  presence: {
    heartbeat: op({
      name: "presence.heartbeat",
      method: "POST",
      path: "/presence/heartbeat",
      summary: "Record that the caller is online, with what they are doing. Returns who is online.",
      input: object({ activity: string2().max(200).nullable().optional() }),
      output: object({ online: array(zPresence) }),
      access: "signed-in",
      mcp: false
    }),
    list: op({
      name: "presence.list",
      method: "GET",
      path: "/presence",
      summary: "Who is online now and what each person is doing.",
      input: zEmpty,
      output: object({ online: array(zPresence) }),
      access: "signed-in",
      mcp: true
    })
  },
  notifications: {
    list: op({
      name: "notifications.list",
      method: "GET",
      path: "/notifications",
      summary: "The caller's undismissed notifications. Newest first unless sorted otherwise.",
      input: zPageInput.extend({
        state: _enum(NOTIFICATION_STATES).optional(),
        category: _enum(NOTIFICATION_CATEGORIES).optional(),
        sort: _enum(NOTIFICATION_SORTS).default("recent")
      }),
      output: zPage(zNotification).extend({ total: number2().int(), unreadCount: number2().int() }),
      access: "signed-in",
      mcp: true
    }),
    unreadCount: op({
      name: "notifications.unreadCount",
      method: "GET",
      path: "/notifications/unread-count",
      summary: "Number of unread notifications. What the bell shows.",
      input: zEmpty,
      output: object({ unreadCount: number2().int() }),
      access: "signed-in",
      mcp: true
    }),
    readAll: op({
      name: "notifications.readAll",
      method: "POST",
      path: "/notifications/read-all",
      summary: "Mark every unread notification read.",
      input: zEmpty,
      output: object({ markedRead: number2().int() }),
      access: "signed-in",
      mcp: true
    }),
    read: op({
      name: "notifications.read",
      method: "POST",
      path: "/notifications/:id/read",
      summary: "Mark one notification read.",
      input: object({ id: zId }),
      output: zNotification,
      access: "signed-in",
      mcp: true
    }),
    dismiss: op({
      name: "notifications.dismiss",
      method: "POST",
      path: "/notifications/:id/dismiss",
      summary: "Remove a notification from the inbox. It counts as read.",
      input: object({ id: zId }),
      output: zNotification,
      access: "signed-in",
      mcp: true
    })
  },
  audit: {
    list: op({
      name: "audit.list",
      method: "GET",
      path: "/audit",
      summary: "Audit entries, newest first. Filter by record, action, user and date.",
      input: zPageInput.extend({
        entity: string2().optional(),
        entityId: zId.optional(),
        action: _enum(AUDIT_ACTIONS).optional(),
        userId: zId.optional(),
        from: string2().optional(),
        to: string2().optional(),
        offset: exports_coerce.number().int().min(0).optional()
      }),
      output: zPage(zAuditEntry).extend({ total: number2().int() }),
      access: "signed-in",
      mcp: true
    }),
    facets: op({
      name: "audit.facets",
      method: "GET",
      path: "/audit/facets",
      summary: "Filter options: entity types present in the log and users who made entries.",
      input: zEmpty,
      output: zAuditFacets,
      access: "signed-in",
      mcp: false
    }),
    history: op({
      name: "audit.history",
      method: "GET",
      path: "/audit/history/:entity/:entityId",
      summary: "Every change to one record, newest first.",
      input: zPageInput.extend({ entity: string2(), entityId: zId }),
      output: zPage(zAuditEntry),
      access: "signed-in",
      mcp: true
    })
  },
  undo: {
    preview: op({
      name: "undo.preview",
      method: "GET",
      path: "/undo/last",
      summary: "What 'undo last action' would reverse for the caller. 404 when nothing is recent.",
      input: zEmpty,
      output: zUndoPreview,
      access: "signed-in",
      mcp: true
    }),
    last: op({
      name: "undo.last",
      method: "POST",
      path: "/undo/last",
      summary: "Reverse the caller's most recent action, if its operation is reversible.",
      input: zEmpty,
      output: object({ summary: string2() }),
      access: "signed-in",
      mcp: true
    })
  },
  search: {
    query: op({
      name: "search.query",
      method: "GET",
      path: "/search",
      summary: "Search every area at once. Up to `limit` hits per entity type.",
      input: object({
        q: string2().min(1),
        limit: exports_coerce.number().int().min(1).max(20).default(5)
      }),
      output: array(zSearchHit),
      access: "signed-in",
      mcp: true
    })
  }
};

// ../../OPAL/packages/shared/src/domains/purchasing.ts
var PURCHASE_STATUSES = ["draft", "ordered", "partial", "received", "cancelled", "on_hold"];
var PURCHASE_CHARGE_KINDS = ["shipping", "tax", "duty", "fee", "other"];
var PURCHASE_EXPENSE_KINDS = ["receipt", ...PURCHASE_CHARGE_KINDS];
var PURCHASE_SORT_KEYS = ["reference", "supplier", "status", "targetDate", "orderedAt", "createdAt"];
var SUPPLIER_SORT_KEYS = ["name", "code"];
var zPurchaseMoney = zQty;
var zFlag = union([boolean2(), _enum(["true", "false"]).transform((v) => v === "true")]);
var zDate = string2().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
var zText = (max) => string2().trim().max(max);
var zSupplier = object({
  id: number2().int(),
  name: string2(),
  code: string2().nullable(),
  description: string2().nullable(),
  website: string2().nullable(),
  email: string2().nullable(),
  phone: string2().nullable(),
  address: string2().nullable(),
  notes: string2().nullable(),
  isActive: boolean2(),
  purchaseCount: number2().int(),
  partCount: number2().int(),
  deletable: boolean2(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zSupplierWebsite = string2().trim().max(255).refine((v) => {
  if (!v)
    return true;
  try {
    const u = new URL(v);
    return (u.protocol === "http:" || u.protocol === "https:") && u.host !== "";
  } catch {
    return false;
  }
}, "website must be an http:// or https:// URL").transform((v) => v === "" ? null : v);
var supplierFields = {
  code: zText(50).nullable().optional(),
  description: string2().nullable().optional(),
  website: zSupplierWebsite.nullable().optional(),
  email: zText(255).nullable().optional(),
  phone: zText(50).nullable().optional(),
  address: string2().nullable().optional(),
  notes: string2().nullable().optional()
};
var zSupplierCreate = object({
  name: zText(255).min(1),
  isActive: boolean2().default(true),
  ...supplierFields
});
var zSupplierUpdate = object({
  id: zId,
  name: zText(255).min(1).nullable().optional(),
  isActive: boolean2().nullable().optional(),
  ...supplierFields
});
var zSupplierPage = object({
  items: array(zSupplier),
  next: string2().nullable(),
  total: number2().int()
});
var zSupplierPartRow = object({
  id: number2().int(),
  supplierId: number2().int(),
  supplierName: string2(),
  supplierIsActive: boolean2(),
  partId: number2().int(),
  partName: string2(),
  partInternalPn: string2(),
  vendorPn: string2(),
  isPreferred: boolean2(),
  leadTimeDays: number2().int().nullable(),
  notes: string2().nullable(),
  createdAt: zTimestamp,
  lastUnitCost: zPurchaseMoney.nullable(),
  lastOrderedAt: zTimestamp.nullable()
});
var zSupplierPartCreate = object({
  id: zId,
  partId: zId,
  vendorPn: zText(255).min(1),
  isPreferred: boolean2().default(false),
  leadTimeDays: number2().int().min(0).nullable().optional(),
  notes: string2().nullable().optional()
});
var zSupplierPartUpdate = object({
  id: zId,
  entryId: zId,
  vendorPn: zText(255).min(1).optional(),
  isPreferred: boolean2().optional(),
  leadTimeDays: number2().int().min(0).nullable().optional(),
  notes: string2().nullable().optional()
});
var zPartPoLine = object({
  lineId: number2().int(),
  purchaseId: number2().int(),
  reference: string2(),
  supplierName: string2(),
  status: _enum(PURCHASE_STATUSES),
  qtyOrdered: zQty,
  qtyReceived: zQty,
  unitCost: zPurchaseMoney.nullable(),
  targetDate: zDate.nullable()
});
var zPurchaseLine = object({
  id: number2().int(),
  purchaseId: number2().int(),
  partId: number2().int(),
  partName: string2(),
  partInternalPn: string2(),
  partExternalPn: string2().nullable(),
  unitOfMeasure: string2(),
  trackingType: _enum(["serialized", "bulk"]),
  lotRequired: boolean2(),
  autoSerial: boolean2(),
  qtyOrdered: zQty,
  qtyReceived: zQty,
  qtyOutstanding: zQty,
  unitCost: zPurchaseMoney.nullable(),
  destination: string2().nullable(),
  notes: string2().nullable(),
  isComplete: boolean2()
});
var zPurchase = object({
  id: number2().int(),
  reference: string2(),
  supplierId: number2().int().nullable(),
  supplierName: string2(),
  supplierReference: string2().nullable(),
  status: _enum(PURCHASE_STATUSES),
  targetDate: zDate.nullable(),
  destination: string2().nullable(),
  orderedAt: zTimestamp.nullable(),
  receivedAt: zTimestamp.nullable(),
  isOverdue: boolean2(),
  notes: string2().nullable(),
  lines: array(zPurchaseLine),
  totalLines: number2().int(),
  totalCost: zPurchaseMoney.nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
  createdById: number2().int().nullable(),
  createdByName: string2().nullable(),
  receivedById: number2().int().nullable(),
  receivedByName: string2().nullable()
});
var zPurchaseListItem = object({
  id: number2().int(),
  reference: string2(),
  supplierId: number2().int().nullable(),
  supplierName: string2(),
  supplierReference: string2().nullable(),
  status: _enum(PURCHASE_STATUSES),
  targetDate: zDate.nullable(),
  isOverdue: boolean2(),
  orderedAt: zTimestamp.nullable(),
  receivedAt: zTimestamp.nullable(),
  totalLines: number2().int(),
  linesComplete: number2().int(),
  totalCost: zPurchaseMoney.nullable(),
  createdAt: zTimestamp
});
var zPurchasePage = object({
  items: array(zPurchaseListItem),
  next: string2().nullable(),
  total: number2().int()
});
var zPurchaseLineInput = object({
  partId: zId,
  qtyOrdered: zQty,
  unitCost: zPurchaseMoney.nullable().optional(),
  destination: zText(255).nullable().optional(),
  notes: string2().nullable().optional()
});
var zPurchaseCreate = object({
  supplierId: zId.nullable().optional(),
  supplierName: zText(255).nullable().optional(),
  supplierReference: zText(100).nullable().optional(),
  reference: zText(64).nullable().optional(),
  targetDate: zDate.nullable().optional(),
  destination: zText(255).nullable().optional(),
  notes: string2().nullable().optional(),
  lines: array(zPurchaseLineInput).default([])
});
var zPurchaseUpdate = object({
  id: zId,
  supplierId: zId.nullable().optional(),
  supplierName: zText(255).nullable().optional(),
  supplierReference: zText(100).nullable().optional(),
  reference: zText(64).nullable().optional(),
  targetDate: zDate.nullable().optional(),
  destination: zText(255).nullable().optional(),
  notes: string2().nullable().optional(),
  status: _enum(PURCHASE_STATUSES).optional()
});
var zPurchaseLineUpdate = object({
  id: zId,
  lineId: zId,
  qtyOrdered: zQty.optional(),
  unitCost: zPurchaseMoney.nullable().optional(),
  destination: zText(255).nullable().optional(),
  notes: string2().nullable().optional()
});
var zPurchaseReceive = object({
  id: zId,
  lines: array(object({
    lineId: zId,
    quantity: zQty,
    location: zText(255).nullable().optional(),
    lotNumber: zText(100).nullable().optional(),
    allowOverReceipt: boolean2().default(false)
  })).min(1, "Enter a quantity for at least one line")
});
var zPurchaseReceivedRecord = object({
  stockId: number2().int(),
  opalNumber: string2(),
  partId: number2().int(),
  partName: string2(),
  partInternalPn: string2(),
  quantity: zQty,
  location: string2(),
  lotNumber: string2().nullable(),
  serialNumber: string2().nullable(),
  purchaseLineId: number2().int(),
  receivedAt: zTimestamp
});
var zPurchaseExpense = object({
  id: number2().int(),
  purchaseId: number2().int(),
  kind: _enum(PURCHASE_EXPENSE_KINDS),
  purchaseLineId: number2().int().nullable(),
  partId: number2().int().nullable(),
  partName: string2().nullable(),
  partInternalPn: string2().nullable(),
  quantity: zQty.nullable(),
  unitCost: zPurchaseMoney.nullable(),
  totalCost: zPurchaseMoney.nullable(),
  at: zTimestamp,
  notes: string2().nullable()
});
var suppliers = {
  list: op({
    name: "purchasing.suppliers.list",
    method: "GET",
    path: "/suppliers",
    summary: "List suppliers. Search by name, code or email; filter by active.",
    input: zPageInput.extend({
      q: string2().optional(),
      active: zFlag.optional(),
      sort: _enum(SUPPLIER_SORT_KEYS).default("name"),
      dir: _enum(["asc", "desc"]).default("asc")
    }),
    output: zSupplierPage,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "purchasing.suppliers.create",
    method: "POST",
    path: "/suppliers",
    summary: "Create a supplier.",
    input: zSupplierCreate,
    output: zSupplier,
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "purchasing.suppliers.get",
    method: "GET",
    path: "/suppliers/:id",
    summary: "Get one supplier.",
    input: object({ id: zId }),
    output: zSupplier,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "purchasing.suppliers.update",
    method: "PATCH",
    path: "/suppliers/:id",
    summary: "Edit a supplier, or deactivate it.",
    input: zSupplierUpdate,
    output: zSupplier,
    access: "signed-in",
    mcp: true
  }),
  delete: op({
    name: "purchasing.suppliers.delete",
    method: "DELETE",
    path: "/suppliers/:id",
    summary: "Delete a supplier no order refers to. Otherwise deactivate it.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};
var catalog = {
  list: op({
    name: "purchasing.catalog.list",
    method: "GET",
    path: "/suppliers/:id/parts",
    summary: "A supplier's catalog: the parts it sells and its number for each.",
    input: object({ id: zId }),
    output: array(zSupplierPartRow),
    access: "signed-in",
    mcp: true
  }),
  add: op({
    name: "purchasing.catalog.add",
    method: "POST",
    path: "/suppliers/:id/parts",
    summary: "Add a part to a supplier catalog with its supplier part number.",
    input: zSupplierPartCreate,
    output: zSupplierPartRow,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "purchasing.catalog.update",
    method: "PATCH",
    path: "/suppliers/:id/parts/:entryId",
    summary: "Change a supplier part number, preferred flag, lead time or notes.",
    input: zSupplierPartUpdate,
    output: zSupplierPartRow,
    access: "signed-in",
    mcp: true
  }),
  remove: op({
    name: "purchasing.catalog.remove",
    method: "DELETE",
    path: "/suppliers/:id/parts/:entryId",
    summary: "Remove a catalog entry.",
    input: object({ id: zId, entryId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  forPart: op({
    name: "purchasing.catalog.forPart",
    method: "GET",
    path: "/parts/:id/suppliers",
    summary: "Every supplier that sells a part, preferred first.",
    input: object({ id: zId }),
    output: array(zSupplierPartRow),
    access: "signed-in",
    mcp: true
  }),
  poLinesForPart: op({
    name: "purchasing.catalog.poLinesForPart",
    method: "GET",
    path: "/parts/:id/po-lines",
    summary: "Every purchase order line for a part, newest first.",
    input: object({ id: zId }),
    output: array(zPartPoLine),
    access: "signed-in",
    mcp: true
  })
};
var orders = {
  list: op({
    name: "purchasing.orders.list",
    method: "GET",
    path: "/purchases",
    summary: "List purchase orders. Filter by status, supplier, text, target date, open, awaiting or overdue.",
    input: zPageInput.extend({
      status: _enum(PURCHASE_STATUSES).optional(),
      open: zFlag.optional(),
      awaiting: zFlag.optional(),
      overdue: zFlag.optional(),
      supplierId: zId.optional(),
      supplier: string2().optional(),
      q: string2().optional(),
      targetFrom: zDate.optional(),
      targetTo: zDate.optional(),
      sort: _enum(PURCHASE_SORT_KEYS).default("createdAt"),
      dir: _enum(["asc", "desc"]).default("desc")
    }),
    output: zPurchasePage,
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "purchasing.orders.create",
    method: "POST",
    path: "/purchases",
    summary: "Create a purchase order as a draft. A PO number is assigned unless one is given.",
    input: zPurchaseCreate,
    output: zPurchase,
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "purchasing.orders.get",
    method: "GET",
    path: "/purchases/:id",
    summary: "Get one purchase order with its lines.",
    input: object({ id: zId }),
    output: zPurchase,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "purchasing.orders.update",
    method: "PATCH",
    path: "/purchases/:id",
    summary: "Edit the header of a purchase order or move it through its status workflow.",
    input: zPurchaseUpdate,
    output: zPurchase,
    access: "signed-in",
    mcp: true
  }),
  addLine: op({
    name: "purchasing.orders.addLine",
    method: "POST",
    path: "/purchases/:id/lines",
    summary: "Add a line to an open purchase order. The part must be active.",
    input: zPurchaseLineInput.extend({ id: zId }),
    output: zPurchaseLine,
    access: "signed-in",
    mcp: true
  }),
  updateLine: op({
    name: "purchasing.orders.updateLine",
    method: "PATCH",
    path: "/purchases/:id/lines/:lineId",
    summary: "Change a line. Quantity cannot drop below what arrived. Unit cost locks after receipt.",
    input: zPurchaseLineUpdate,
    output: zPurchaseLine,
    access: "signed-in",
    mcp: true
  }),
  removeLine: op({
    name: "purchasing.orders.removeLine",
    method: "DELETE",
    path: "/purchases/:id/lines/:lineId",
    summary: "Remove a line nothing has been received against.",
    input: object({ id: zId, lineId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  receive: op({
    name: "purchasing.orders.receive",
    method: "POST",
    path: "/purchases/:id/receive",
    summary: "Receive goods against lines, in full or in part. Creates stock records, writes the expense ledger and settles the status.",
    input: zPurchaseReceive,
    output: zPurchase,
    access: "signed-in",
    mcp: true
  }),
  received: op({
    name: "purchasing.orders.received",
    method: "GET",
    path: "/purchases/:id/inventory",
    summary: "Stock records that receiving against this order created.",
    input: object({ id: zId }),
    output: array(zPurchaseReceivedRecord),
    access: "signed-in",
    mcp: true
  }),
  expenses: op({
    name: "purchasing.orders.expenses",
    method: "GET",
    path: "/purchases/:id/expenses",
    summary: "The expense ledger: one receipt row per received line, and the charges.",
    input: object({ id: zId }),
    output: array(zPurchaseExpense),
    access: "signed-in",
    mcp: true
  }),
  addCharge: op({
    name: "purchasing.orders.addCharge",
    method: "POST",
    path: "/purchases/:id/expenses",
    summary: "Record a cost that is not a line: shipping, tax, duty, fee or other.",
    input: object({
      id: zId,
      kind: _enum(PURCHASE_CHARGE_KINDS),
      amount: zPurchaseMoney,
      note: zText(500).nullable().optional()
    }),
    output: zPurchaseExpense,
    access: "signed-in",
    mcp: true
  }),
  removeCharge: op({
    name: "purchasing.orders.removeCharge",
    method: "DELETE",
    path: "/purchases/:id/expenses/:expenseId",
    summary: "Remove a charge. Receipt rows are permanent.",
    input: object({ id: zId, expenseId: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};
var purchasing = { suppliers, catalog, orders };

// ../../OPAL/packages/shared/src/domains/reports.ts
var zProjectFilter = { projectId: zId.optional() };
var zOverviewCapped = (row) => object({
  items: array(row),
  total: number2().int(),
  flagged: number2().int()
});
var zOverviewIssue = object({
  issueNumber: string2(),
  title: string2(),
  priority: string2(),
  issueType: string2(),
  holding: boolean2(),
  assignee: string2().nullable(),
  mine: boolean2(),
  href: string2()
});
var zOverviewIssueCounts = object({
  open: number2().int(),
  critical: number2().int(),
  high: number2().int(),
  medium: number2().int(),
  low: number2().int(),
  unassigned: number2().int(),
  mine: number2().int()
});
var zOverviewExecution = object({
  label: string2(),
  procedure: string2().nullable(),
  status: string2(),
  stepsDone: number2().int(),
  stepsTotal: number2().int(),
  blocked: boolean2(),
  overdue: boolean2(),
  targetCompletionAt: zTimestamp.nullable(),
  mine: boolean2(),
  href: string2()
});
var zOverviewLowStock = object({
  partNumber: string2(),
  name: string2(),
  onHand: string2(),
  reorderPoint: string2(),
  uom: string2(),
  href: string2()
});
var zOverviewPurchase = object({
  reference: string2(),
  supplier: string2(),
  status: string2(),
  targetDate: string2().nullable(),
  overdue: boolean2(),
  linesOpen: number2().int(),
  href: string2()
});
var OVERVIEW_ATTENTION_KINDS = ["calibration_overdue", "expired", "expiring"];
var zOverviewStockAttention = object({
  opalNumber: string2().nullable(),
  partNumber: string2().nullable(),
  partName: string2(),
  kind: _enum(OVERVIEW_ATTENTION_KINDS),
  due: string2(),
  href: string2()
});
var zOverviewRisk = object({
  riskNumber: string2(),
  title: string2(),
  score: number2().int(),
  disposition: string2(),
  href: string2()
});
var zOverview = object({
  issues: zOverviewCapped(zOverviewIssue).extend({ counts: zOverviewIssueCounts }),
  executions: zOverviewCapped(zOverviewExecution),
  lowStock: zOverviewCapped(zOverviewLowStock),
  purchases: zOverviewCapped(zOverviewPurchase),
  stockAttention: zOverviewCapped(zOverviewStockAttention),
  risks: zOverviewCapped(zOverviewRisk),
  activity: array(zAuditEntry)
});
var zReportExecutionRow = object({
  id: number2().int(),
  projectId: number2().int().nullable().optional(),
  procedure: string2().nullable(),
  version: number2().int().nullable(),
  workOrder: string2().nullable(),
  status: string2(),
  priority: string2().nullable(),
  createdAt: zTimestamp,
  startedAt: zTimestamp.nullable(),
  completedAt: zTimestamp.nullable(),
  stepsCompleted: number2().int(),
  stepsTotal: number2().int()
});
var zWindow = {
  from: string2().optional(),
  to: string2().optional()
};
var zExecutionMetrics = object({
  totalExecutions: number2().int(),
  completed: number2().int(),
  inWork: number2().int(),
  cut: number2().int(),
  aborted: number2().int(),
  avgDurationMinutes: number2().nullable(),
  completionRate: number2()
});
var zIssueMetrics = object({
  totalIssues: number2().int(),
  open: number2().int(),
  advisoryOpen: number2().int(),
  undispositioned: number2().int(),
  dispositioned: number2().int(),
  closed: number2().int(),
  voided: number2().int(),
  byType: record(string2(), number2().int()),
  byPriority: record(string2(), number2().int())
});
var zLifecycleState = object({
  demoActive: boolean2(),
  demoFileExists: boolean2(),
  demoDbPath: string2()
});
var csv = (name, path, summary, input, filename) => op({
  name,
  method: "GET",
  path,
  summary,
  input,
  output: string2(),
  produces: "text/csv",
  filename,
  access: "signed-in",
  mcp: true
});
var reports = {
  overview: op({
    name: "reports.overview",
    method: "GET",
    path: "/overview",
    summary: "The landing page in one call: open issues, active executions, low stock, purchases awaiting receipt, calibration and expiry, high risks, recent activity.",
    input: object(zProjectFilter),
    output: zOverview,
    access: "signed-in",
    mcp: true
  }),
  partsCsv: csv("reports.partsCsv", "/reports/parts/csv", "Parts with on-hand quantity and stocking locations, as CSV.", object({
    category: string2().optional(),
    lowStock: union([boolean2(), _enum(["true", "false", "1", "0"]).transform((v) => v === "true" || v === "1")]).optional()
  }), "parts.csv"),
  inventoryCsv: csv("reports.inventoryCsv", "/reports/inventory/csv", "Stock records with balance, location and lot, as CSV.", object({ location: string2().optional() }), "inventory.csv"),
  executionsCsv: csv("reports.executionsCsv", "/reports/executions/csv", "Executions with status, timing and step progress, as CSV.", object({ status: string2().optional(), procedureId: exports_coerce.number().int().optional(), ...zProjectFilter, ...zWindow }), "executions.csv"),
  issuesCsv: csv("reports.issuesCsv", "/reports/issues/csv", "Issues with type, state, priority and links, as CSV.", object({ status: string2().optional(), issueType: string2().optional(), priority: string2().optional(), ...zProjectFilter }), "issues.csv"),
  risksCsv: csv("reports.risksCsv", "/reports/risks/csv", "Risks with score, residual score and owner, as CSV.", object({ disposition: string2().optional(), minScore: exports_coerce.number().int().optional(), ...zProjectFilter }), "risks.csv"),
  executionMetrics: op({
    name: "reports.executionMetrics",
    method: "GET",
    path: "/reports/analytics/executions",
    summary: "Execution counts by status, average duration and completion rate.",
    input: object({ procedureId: exports_coerce.number().int().optional(), ...zProjectFilter, ...zWindow }),
    output: zExecutionMetrics,
    access: "signed-in",
    mcp: true
  }),
  issueMetrics: op({
    name: "reports.issueMetrics",
    method: "GET",
    path: "/reports/analytics/issues",
    summary: "Issue counts by state, type and priority.",
    input: object({ ...zProjectFilter, ...zWindow }),
    output: zIssueMetrics,
    access: "signed-in",
    mcp: true
  }),
  lifecycle: {
    get: op({
      name: "reports.lifecycle.get",
      method: "GET",
      path: "/settings/lifecycle",
      summary: "Whether the demo database is active or present.",
      input: zEmpty,
      output: zLifecycleState,
      access: "signed-in",
      mcp: false
    }),
    enterDemo: op({
      name: "reports.lifecycle.enterDemo",
      method: "POST",
      path: "/settings/demo/enter",
      summary: "Switch the instance to the separate demo database. Creates it on first entry.",
      input: zEmpty,
      output: zLifecycleState,
      access: "admin",
      mcp: false
    }),
    exitDemo: op({
      name: "reports.lifecycle.exitDemo",
      method: "POST",
      path: "/settings/demo/exit",
      summary: "Switch back to the real database and delete the demo database and its attachments.",
      input: zEmpty,
      output: zLifecycleState,
      access: "admin",
      mcp: false
    }),
    deleteDemo: op({
      name: "reports.lifecycle.deleteDemo",
      method: "DELETE",
      path: "/settings/demo",
      summary: "Delete the demo database file while it is not active.",
      input: zEmpty,
      output: zLifecycleState,
      access: "admin",
      mcp: false
    }),
    factoryReset: op({
      name: "reports.lifecycle.factoryReset",
      method: "POST",
      path: "/settings/factory-reset",
      summary: "Erase all data, attachments and the demo database. The instance returns to first-run setup.",
      input: object({ confirm: string2() }),
      output: zOk,
      access: "admin",
      humanOnly: true,
      mcp: false
    })
  }
};

// ../../OPAL/packages/shared/src/domains/requirements.ts
var REQUIREMENT_LIFECYCLE_STATES = ["draft", "preliminary", "baselined", "superseded", "cancelled"];
var REQUIREMENT_EDITABLE_STATES = ["draft", "preliminary"];
var REQUIREMENT_VERIFICATION_METHODS = ["analysis", "inspection", "demonstration", "test"];
var REQUIREMENT_ALLOCATION_STATUSES = ["open", "verified", "waived", "not_applicable"];
var REQUIREMENT_VERIFICATION_STATUSES = [
  "verified",
  "partial",
  "open",
  "unallocated",
  "not_applicable"
];
var REQUIREMENT_LINT_SEVERITIES = ["warn", "block_baseline"];
var zRequirementFinding = object({
  rule: string2(),
  name: string2(),
  severity: _enum(REQUIREMENT_LINT_SEVERITIES),
  message: string2(),
  span: tuple([number2().int(), number2().int()]).optional()
});
var zRequirement = object({
  id: number2().int(),
  reqNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  revision: number2().int(),
  lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
  title: string2(),
  statement: string2(),
  rationale: string2().nullable(),
  category: string2().nullable(),
  parentId: number2().int().nullable(),
  level: number2().int(),
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable(),
  tbd: boolean2(),
  tbr: boolean2(),
  tbrOwnerId: number2().int().nullable(),
  tbrDue: zTimestamp.nullable(),
  stale: boolean2(),
  baselinedAt: zTimestamp.nullable(),
  baselinedById: number2().int().nullable(),
  supersedesId: number2().int().nullable(),
  childrenCount: number2().int(),
  allocationCount: number2().int(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var text2 = string2().nullable().optional();
var zNullableId = number2().int().positive().nullable().optional();
var zRequirementCreate = object({
  projectId: zId,
  title: string2().trim().min(1).max(255),
  statement: string2().trim().min(1),
  rationale: text2,
  category: string2().max(50).nullable().optional(),
  parentId: zNullableId,
  level: number2().int().min(0).optional(),
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable().optional(),
  tbd: boolean2().default(false),
  tbr: boolean2().default(false),
  tbrOwnerId: zNullableId,
  tbrDue: zTimestamp.nullable().optional()
});
var zRequirementUpdate = object({
  id: zId,
  projectId: zId.optional(),
  title: string2().trim().min(1).max(255).optional(),
  statement: string2().trim().min(1).optional(),
  rationale: text2,
  category: string2().max(50).nullable().optional(),
  parentId: zNullableId,
  level: number2().int().min(0).optional(),
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable().optional(),
  tbd: boolean2().optional(),
  tbr: boolean2().optional(),
  tbrOwnerId: zNullableId,
  tbrDue: zTimestamp.nullable().optional(),
  lifecycleState: _enum(REQUIREMENT_EDITABLE_STATES).optional()
});
var zRequirementLintInput = object({
  statement: string2(),
  rationale: text2,
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable().optional(),
  tbd: boolean2().default(false),
  tbr: boolean2().default(false),
  tbrOwnerId: zNullableId,
  tbrDue: zTimestamp.nullable().optional()
});
var zRequirementLintResult = object({
  findings: array(zRequirementFinding),
  wouldBlockBaseline: boolean2()
});
var zRequirementTreePart = object({
  partId: number2().int(),
  name: string2(),
  status: _enum(REQUIREMENT_ALLOCATION_STATUSES)
});
var zRequirementTreeItem = object({
  id: number2().int(),
  reqNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  revision: number2().int(),
  lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
  title: string2(),
  statement: string2(),
  rationale: string2().nullable(),
  level: number2().int(),
  category: string2().nullable(),
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable(),
  tbd: boolean2(),
  tbr: boolean2(),
  stale: boolean2(),
  parentId: number2().int().nullable(),
  orphan: boolean2(),
  updatedAt: zTimestamp,
  lint: array(zRequirementFinding),
  parts: array(zRequirementTreePart),
  verification: _enum(REQUIREMENT_VERIFICATION_STATUSES)
});
var zRequirementTree = object({
  items: array(zRequirementTreeItem),
  total: number2().int(),
  queueCount: number2().int()
});
var zRequirementRef = object({ id: number2().int(), reqNumber: string2(), title: string2() });
var zRequirementSummary = object({
  total: number2().int(),
  byState: record(string2(), number2().int()),
  coverage: object({
    leaves: number2().int(),
    leavesAllocated: number2().int(),
    withVerificationMethod: number2().int()
  }),
  verification: record(_enum(REQUIREMENT_VERIFICATION_STATUSES), number2().int()),
  readyToBaseline: number2().int(),
  stale: array(zRequirementRef),
  overdueTbrs: array(zRequirementRef.extend({ owner: string2(), daysOver: number2().int(), tbrDue: zTimestamp })),
  stuckDrafts: array(zRequirementRef),
  asOf: zTimestamp
});
var zRequirementCheck = object({
  key: string2(),
  label: string2(),
  passed: boolean2(),
  severity: _enum(["hard", "warning"]),
  detail: string2().nullable()
});
var zRequirementReadiness = object({ ready: boolean2(), checks: array(zRequirementCheck) });
var zRequirementAllocation = object({
  id: number2().int(),
  partId: number2().int(),
  partName: string2(),
  internalPn: string2().nullable(),
  status: _enum(REQUIREMENT_ALLOCATION_STATUSES),
  notes: string2().nullable(),
  verifiedAt: zTimestamp.nullable(),
  verifiedBy: string2().nullable(),
  againstRevision: number2().int(),
  outdated: boolean2()
});
var zRequirementDossier = object({
  id: number2().int(),
  reqNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  revision: number2().int(),
  lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
  title: string2(),
  statement: string2(),
  rationale: string2().nullable(),
  category: string2().nullable(),
  level: number2().int(),
  parentId: number2().int().nullable(),
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable(),
  tbd: boolean2(),
  tbr: boolean2(),
  tbrOwnerId: number2().int().nullable(),
  tbrOwner: string2().nullable(),
  tbrDue: zTimestamp.nullable(),
  stale: boolean2(),
  baselinedAt: zTimestamp.nullable(),
  baselinedBy: string2().nullable(),
  supersedesId: number2().int().nullable(),
  predecessorRevision: number2().int().nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp,
  parentChain: array(zRequirementRef),
  children: array(object({
    id: number2().int(),
    reqNumber: string2(),
    title: string2(),
    lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
    level: number2().int(),
    stale: boolean2()
  })),
  allocations: array(zRequirementAllocation),
  verification: _enum(REQUIREMENT_VERIFICATION_STATUSES),
  revisions: array(object({
    id: number2().int(),
    revision: number2().int(),
    lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
    statement: string2(),
    baselinedAt: zTimestamp.nullable()
  })),
  baselineEvents: array(object({
    eventId: number2().int(),
    label: string2().nullable(),
    createdAt: zTimestamp,
    revision: number2().int()
  })),
  readiness: zRequirementReadiness.nullable(),
  lint: array(zRequirementFinding),
  canDelete: boolean2()
});
var zRequirementSegment = object({ op: _enum(["equal", "delete", "insert"]), text: string2() });
var zRequirementRedline = object({
  revA: number2().int(),
  revB: number2().int(),
  title: array(zRequirementSegment),
  statement: array(zRequirementSegment),
  rationale: array(zRequirementSegment)
});
var zRequirementQueueItem = object({
  id: number2().int(),
  projectId: number2().int(),
  reqNumber: string2(),
  revision: number2().int(),
  title: string2(),
  statement: string2(),
  rationale: string2().nullable(),
  level: number2().int(),
  verificationMethod: _enum(REQUIREMENT_VERIFICATION_METHODS).nullable(),
  stale: boolean2(),
  childrenCount: number2().int(),
  parts: array(string2()),
  chain: array(object({
    id: number2().int(),
    reqNumber: string2(),
    title: string2(),
    lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES)
  })),
  warnings: array(string2()),
  change: zRequirementRedline.nullable()
});
var zRequirementQueue = object({
  count: number2().int(),
  ids: array(number2().int()),
  items: array(zRequirementQueueItem)
});
var zRequirementEventSummary = object({
  id: number2().int(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  label: string2().nullable(),
  note: string2().nullable(),
  signedBy: string2().nullable(),
  createdAt: zTimestamp,
  locked: number2().int(),
  revised: number2().int()
});
var zRequirementEventItem = object({
  id: number2().int(),
  reqNumber: string2(),
  revision: number2().int(),
  title: string2(),
  statement: string2(),
  lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
  previousRevision: number2().int().nullable(),
  changed: array(string2()),
  diff: zRequirementRedline.nullable()
});
var zRequirementEventDetail = zRequirementEventSummary.extend({ items: array(zRequirementEventItem) });
var zRequirementBatchInput = object({
  ids: array(zId).min(1),
  label: string2().max(100).nullable().optional(),
  note: text2
});
var zRequirementBatchResult = object({
  eventId: number2().int(),
  label: string2().nullable(),
  baselined: array(object({ id: number2().int(), reqNumber: string2(), revision: number2().int() }))
});
var zRequirementPartRequirement = object({
  id: number2().int(),
  partId: number2().int(),
  requirementId: number2().int(),
  reqNumber: string2(),
  revision: number2().int(),
  title: string2(),
  statement: string2(),
  category: string2().nullable(),
  lifecycleState: _enum(REQUIREMENT_LIFECYCLE_STATES),
  tbd: boolean2(),
  tbr: boolean2(),
  stale: boolean2(),
  status: _enum(REQUIREMENT_ALLOCATION_STATUSES),
  notes: string2().nullable(),
  verifiedAt: zTimestamp.nullable(),
  verifiedBy: object({ id: number2().int(), name: string2() }).nullable(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zRequirementCatalogImport = object({
  created: array(string2()),
  skipped: array(string2())
});
var numberFilter = exports_coerce.number().int();
var zProjectScope = object({ projectId: zId.optional() });
var requirements = {
  lint: op({
    name: "requirements.lint",
    method: "POST",
    path: "/requirements/lint",
    summary: "Lint requirement fields as typed. Same engine the baseline gate enforces. Needs no stored row.",
    input: zRequirementLintInput,
    output: zRequirementLintResult,
    access: "signed-in",
    mcp: true
  }),
  tree: op({
    name: "requirements.tree",
    method: "GET",
    path: "/requirements/tree",
    summary: "Every current requirement as flat flow-down rows (nest by parentId) with parts, verification and lint. `projectId` narrows to one project.",
    input: zProjectScope,
    output: zRequirementTree,
    access: "signed-in",
    mcp: true
  }),
  summary: op({
    name: "requirements.summary",
    method: "GET",
    path: "/requirements/summary",
    summary: "Coverage, verification and staleness roll-up, plus what is red. `projectId` narrows to one project.",
    input: zProjectScope,
    output: zRequirementSummary,
    access: "signed-in",
    mcp: true
  }),
  queue: op({
    name: "requirements.queue",
    method: "GET",
    path: "/requirements/queue",
    summary: "The baseline queue: draft and preliminary rows whose hard checks all pass, with review context. `projectId` narrows to one project.",
    input: zProjectScope,
    output: zRequirementQueue,
    access: "signed-in",
    mcp: true
  }),
  baselines: op({
    name: "requirements.baselines",
    method: "GET",
    path: "/requirements/baselines",
    summary: "Baseline events, newest first. `projectId` narrows to one project.",
    input: zProjectScope,
    output: array(zRequirementEventSummary),
    access: "signed-in",
    mcp: true
  }),
  baselineEvent: op({
    name: "requirements.baselineEvent",
    method: "GET",
    path: "/requirements/baselines/:id",
    summary: "One baseline event: the locked revisions and what each changed.",
    input: object({ id: zId }),
    output: zRequirementEventDetail,
    access: "signed-in",
    mcp: true
  }),
  baselineBatch: op({
    name: "requirements.baselineBatch",
    method: "POST",
    path: "/requirements/baseline-batch",
    summary: "Baseline a set in one event. Every item is checked again first. One failure aborts the whole batch.",
    input: zRequirementBatchInput,
    output: zRequirementBatchResult,
    access: "signed-in",
    mcp: true,
    humanOnly: true
  }),
  importCatalog: op({
    name: "requirements.importCatalog",
    method: "POST",
    path: "/requirements/import",
    summary: "Import the organization requirement catalog into a project as level-0 draft requirements. Numbers already present are skipped.",
    input: object({ projectId: zId }),
    output: zRequirementCatalogImport,
    access: "admin",
    mcp: false
  }),
  catalog: op({
    name: "requirements.catalog",
    method: "GET",
    path: "/requirements/catalog",
    summary: "Catalog entries that are not yet requirements. Empty before the organization is set up.",
    input: zEmpty,
    output: array(zRequirementRef),
    access: "signed-in",
    mcp: false
  }),
  byNumber: op({
    name: "requirements.byNumber",
    method: "GET",
    path: "/requirements/number/:reqNumber",
    summary: "The current revision of a requirement by its REQ number.",
    input: object({ reqNumber: string2() }),
    output: zRequirement,
    access: "signed-in",
    mcp: true
  }),
  list: op({
    name: "requirements.list",
    method: "GET",
    path: "/requirements",
    summary: "List requirements. Superseded revisions are hidden unless asked for.",
    input: zPageInput.extend({
      projectId: zId.optional(),
      state: _enum(REQUIREMENT_LIFECYCLE_STATES).optional(),
      category: string2().optional(),
      level: numberFilter.optional(),
      parentId: zId.optional(),
      q: string2().optional(),
      includeSuperseded: _enum(["true", "false"]).transform((v) => v === "true").optional()
    }),
    output: zPage(zRequirement).extend({ total: number2().int() }),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "requirements.create",
    method: "POST",
    path: "/requirements",
    summary: "Create a draft requirement with the next REQ number.",
    input: zRequirementCreate,
    output: zRequirement,
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "requirements.get",
    method: "GET",
    path: "/requirements/:id",
    summary: "Get one requirement revision.",
    input: object({ id: zId }),
    output: zRequirement,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "requirements.update",
    method: "PATCH",
    path: "/requirements/:id",
    summary: "Edit a draft or preliminary requirement in place. A baselined row is immutable: revise it. Any edit clears the stale flag.",
    input: zRequirementUpdate,
    output: zRequirement,
    access: "signed-in",
    mcp: true
  }),
  delete: op({
    name: "requirements.delete",
    method: "DELETE",
    path: "/requirements/:id",
    summary: "Delete a draft or preliminary requirement that has no children and no part links. Others are cancelled or revised.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  baseline: op({
    name: "requirements.baseline",
    method: "POST",
    path: "/requirements/:id/baseline",
    summary: "Baseline one requirement and record a baseline event. Refused with the list of blockers when it is not ready.",
    input: object({ id: zId }),
    output: zRequirement,
    access: "signed-in",
    mcp: true,
    humanOnly: true
  }),
  revise: op({
    name: "requirements.revise",
    method: "POST",
    path: "/requirements/:id/revise",
    summary: "Create the next draft revision of a baselined requirement.",
    input: object({ id: zId }),
    output: zRequirement,
    access: "signed-in",
    mcp: true
  }),
  cancel: op({
    name: "requirements.cancel",
    method: "POST",
    path: "/requirements/:id/cancel",
    summary: "Cancel a requirement (terminal).",
    input: object({ id: zId }),
    output: zRequirement,
    access: "signed-in",
    mcp: true
  }),
  reaffirm: op({
    name: "requirements.reaffirm",
    method: "POST",
    path: "/requirements/:id/reaffirm",
    summary: "Clear the stale flag without an edit: the parent change does not invalidate this row.",
    input: object({ id: zId }),
    output: zRequirement,
    access: "signed-in",
    mcp: true,
    humanOnly: true
  }),
  dossier: op({
    name: "requirements.dossier",
    method: "GET",
    path: "/requirements/:id/dossier",
    summary: "Everything the requirement page shows: flow-down, parts, revisions, readiness, lint.",
    input: object({ id: zId }),
    output: zRequirementDossier,
    access: "signed-in",
    mcp: true
  }),
  redline: op({
    name: "requirements.redline",
    method: "GET",
    path: "/requirements/:id/redline",
    summary: "Word diff between two revisions of this number. Defaults to this revision against the one it supersedes.",
    input: object({ id: zId, revA: numberFilter.optional(), revB: numberFilter.optional() }),
    output: zRequirementRedline,
    access: "signed-in",
    mcp: true
  }),
  readiness: op({
    name: "requirements.readiness",
    method: "GET",
    path: "/requirements/:id/readiness",
    summary: "Baseline readiness as structured checks.",
    input: object({ id: zId }),
    output: zRequirementReadiness,
    access: "signed-in",
    mcp: true
  }),
  revisions: op({
    name: "requirements.revisions",
    method: "GET",
    path: "/requirements/:id/revisions",
    summary: "All revisions that share this requirement number, oldest first.",
    input: object({ id: zId }),
    output: array(zRequirement),
    access: "signed-in",
    mcp: true
  }),
  forPart: op({
    name: "requirements.forPart",
    method: "GET",
    path: "/requirements/parts/:partId",
    summary: "Requirements linked to a part.",
    input: object({ partId: zId }),
    output: array(zRequirementPartRequirement),
    access: "signed-in",
    mcp: true
  }),
  assign: op({
    name: "requirements.assign",
    method: "POST",
    path: "/requirements/parts/:partId",
    summary: "Link a requirement to a part by REQ number. The current revision is linked.",
    input: object({
      partId: zId,
      reqNumber: string2().trim().min(1),
      notes: text2
    }),
    output: zRequirementPartRequirement,
    access: "signed-in",
    mcp: true
  }),
  updateLink: op({
    name: "requirements.updateLink",
    method: "PATCH",
    path: "/requirements/allocations/:id",
    summary: "Set the status or notes of a part-requirement link.",
    input: object({
      id: zId,
      status: _enum(REQUIREMENT_ALLOCATION_STATUSES).optional(),
      notes: text2
    }),
    output: zRequirementPartRequirement,
    access: "signed-in",
    mcp: true
  }),
  verifyLink: op({
    name: "requirements.verifyLink",
    method: "POST",
    path: "/requirements/allocations/:id/verify",
    summary: "Mark a part-requirement link verified, by the caller, now.",
    input: object({ id: zId, notes: text2 }),
    output: zRequirementPartRequirement,
    access: "signed-in",
    mcp: true
  }),
  unassign: op({
    name: "requirements.unassign",
    method: "DELETE",
    path: "/requirements/allocations/:id",
    summary: "Remove a requirement link from a part.",
    input: object({ id: zId }),
    output: zOk,
    access: "signed-in",
    mcp: true
  })
};

// ../../OPAL/packages/shared/src/domains/risks.ts
var RISK_DISPOSITIONS = [
  "open",
  "mitigate",
  "watch",
  "research",
  "accepted",
  "closed",
  "realized"
];
var RISK_ISSUE_ROLES = ["mitigation", "research"];
var RISK_SEVERITIES = ["low", "medium", "high"];
var RISK_REFERENCE_TYPES = ["opal", "work_order"];
var RISK_SORT_KEYS = [
  "riskNumber",
  "title",
  "disposition",
  "score",
  "residualScore",
  "reviewed",
  "created"
];
var zScale = number2().int().min(1).max(5);
var zText2 = string2().nullable().optional();
var zRiskLinkedIssue = object({
  linkId: number2().int(),
  issueId: number2().int(),
  issueNumber: string2(),
  title: string2(),
  status: string2(),
  role: _enum(RISK_ISSUE_ROLES)
});
var zRiskReference = object({
  id: number2().int(),
  type: _enum(RISK_REFERENCE_TYPES),
  value: string2(),
  notes: string2().nullable()
});
var zRisk = object({
  id: number2().int(),
  riskNumber: string2(),
  projectId: number2().int(),
  projectCode: string2(),
  projectName: string2(),
  title: string2(),
  description: string2().nullable(),
  condition: string2().nullable(),
  departure: string2().nullable(),
  assetPartId: number2().int().nullable(),
  assetText: string2().nullable(),
  consequence: string2().nullable(),
  assetDisplay: string2().nullable(),
  assetPartNumber: string2().nullable(),
  assetPartName: string2().nullable(),
  statement: string2().nullable(),
  disposition: _enum(RISK_DISPOSITIONS),
  ownerId: number2().int().nullable(),
  ownerName: string2().nullable(),
  probability: number2().int(),
  impact: number2().int(),
  score: number2().int(),
  severity: _enum(RISK_SEVERITIES),
  residualProbability: number2().int().nullable(),
  residualImpact: number2().int().nullable(),
  residualScore: number2().int().nullable(),
  residualSeverity: _enum(RISK_SEVERITIES).nullable(),
  acceptedById: number2().int().nullable(),
  acceptedByName: string2().nullable(),
  acceptedAt: zTimestamp.nullable(),
  acceptanceRationale: string2().nullable(),
  watchObservable: string2().nullable(),
  watchThreshold: string2().nullable(),
  watchContingency: string2().nullable(),
  lastReviewedAt: zTimestamp.nullable(),
  lastReviewedById: number2().int().nullable(),
  lastReviewedByName: string2().nullable(),
  realizedIssueId: number2().int().nullable(),
  realizedIssueNumber: string2().nullable(),
  linkedIssues: array(zRiskLinkedIssue),
  references: array(zRiskReference),
  acceptanceInvalidated: boolean2(),
  createdAt: zTimestamp,
  updatedAt: zTimestamp
});
var zFlag2 = preprocess((v) => v === "1" || v === "true" ? true : v === "0" || v === "false" ? false : v, boolean2());
var zRiskFilters = object({
  q: string2().optional(),
  projectId: zId.optional(),
  disposition: _enum(RISK_DISPOSITIONS).optional(),
  severity: _enum(RISK_SEVERITIES).optional(),
  minScore: exports_coerce.number().int().min(1).max(25).optional(),
  ownerId: zId.optional(),
  probability: exports_coerce.number().int().min(1).max(5).optional(),
  impact: exports_coerce.number().int().min(1).max(5).optional(),
  residualProbability: exports_coerce.number().int().min(1).max(5).optional(),
  residualImpact: exports_coerce.number().int().min(1).max(5).optional(),
  active: zFlag2.optional()
});
var zRiskCreate = object({
  projectId: zId,
  title: string2().trim().min(1).max(255),
  description: zText2,
  condition: zText2,
  departure: zText2,
  assetPartId: zId.nullable().optional(),
  assetText: string2().max(255).nullable().optional(),
  consequence: zText2,
  ownerId: zId.nullable().optional(),
  probability: zScale.default(3),
  impact: zScale.default(3),
  residualProbability: zScale.nullable().optional(),
  residualImpact: zScale.nullable().optional(),
  watchObservable: string2().max(255).nullable().optional(),
  watchThreshold: string2().max(255).nullable().optional(),
  watchContingency: zText2
});
var zRiskUpdate = object({
  id: zId,
  projectId: zId.optional(),
  title: string2().trim().min(1).max(255).optional(),
  description: zText2,
  condition: zText2,
  departure: zText2,
  assetPartId: zId.nullable().optional(),
  assetText: string2().max(255).nullable().optional(),
  consequence: zText2,
  ownerId: zId.nullable().optional(),
  probability: zScale.optional(),
  impact: zScale.optional(),
  residualProbability: zScale.nullable().optional(),
  residualImpact: zScale.nullable().optional(),
  acceptanceRationale: zText2,
  watchObservable: string2().max(255).nullable().optional(),
  watchThreshold: string2().max(255).nullable().optional(),
  watchContingency: zText2
});
var zRiskLintFinding = object({
  rule: string2(),
  name: string2(),
  severity: _enum(["warn", "block_accept"]),
  message: string2(),
  span: tuple([number2().int(), number2().int()]).nullable()
});
var zRiskLintSegment = object({
  text: string2(),
  severity: _enum(["block", "warn"]).nullable(),
  findings: array(object({ rule: string2(), message: string2() }))
});
var zLintFields = object({
  condition: string2().nullable().optional(),
  departure: string2().nullable().optional(),
  consequence: string2().nullable().optional()
});
var zByField = (t) => object({ condition: t, departure: t, consequence: t });
var zRiskReadinessCheck = object({
  key: string2(),
  label: string2(),
  passed: boolean2(),
  severity: literal("hard"),
  detail: string2().nullable()
});
var zRiskReadiness = object({ ready: boolean2(), checks: array(zRiskReadinessCheck) });
var zRiskHistoryRow = object({
  at: zTimestamp,
  by: string2().nullable(),
  action: _enum(["create", "update"]),
  changes: array(object({
    field: string2(),
    from: union([string2(), number2()]).nullable(),
    to: union([string2(), number2()]).nullable()
  })),
  note: string2().nullable()
});
var zRiskMatrix = object({
  matrix: array(array(number2().int())),
  residualMatrix: array(array(number2().int())),
  labels: object({
    probability: array(string2()),
    impact: array(string2())
  }),
  totalRisks: number2().int()
});
var idParam = { id: zId };
var risks = {
  matrix: op({
    name: "risks.matrix",
    method: "GET",
    path: "/risks/matrix",
    summary: "Matrix counts of live risks: current and residual, by probability and impact.",
    input: object({ projectId: zId.optional() }),
    output: zRiskMatrix,
    access: "signed-in",
    mcp: true
  }),
  lint: op({
    name: "risks.lint",
    method: "POST",
    path: "/risks/lint",
    summary: "Lint scenario text before saving. Findings and underline runs per field. Nothing here blocks a save.",
    input: zLintFields,
    output: object({
      findings: zByField(array(zRiskLintFinding)),
      segments: zByField(array(zRiskLintSegment)),
      wouldBlockAccept: boolean2()
    }),
    access: "signed-in",
    mcp: true
  }),
  reviewStamp: op({
    name: "risks.reviewStamp",
    method: "POST",
    path: "/risks/review-stamp",
    summary: 'Stamp "reviewed now, by me" on the listed risks, or on every risk matching the filters. Human only.',
    input: zRiskFilters.extend({ riskIds: array(zId).min(1).optional() }),
    output: object({ stamped: number2().int(), reviewedAt: zTimestamp }),
    access: "signed-in",
    mcp: true,
    humanOnly: true
  }),
  list: op({
    name: "risks.list",
    method: "GET",
    path: "/risks",
    summary: "List risks. Default order: highest score first. `cursor` is an opaque offset.",
    input: zRiskFilters.extend({
      sort: _enum(RISK_SORT_KEYS).default("score"),
      dir: _enum(["asc", "desc"]).default("desc"),
      cursor: string2().optional(),
      limit: exports_coerce.number().int().min(1).max(500).default(50)
    }),
    output: object({
      items: array(zRisk),
      next: string2().nullable(),
      total: number2().int()
    }),
    access: "signed-in",
    mcp: true
  }),
  create: op({
    name: "risks.create",
    method: "POST",
    path: "/risks",
    summary: "Create a risk (disposition open). The risk number is generated.",
    input: zRiskCreate,
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  get: op({
    name: "risks.get",
    method: "GET",
    path: "/risks/:id",
    summary: "Get one risk with its statement, linked issues and references.",
    input: object(idParam),
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  update: op({
    name: "risks.update",
    method: "PATCH",
    path: "/risks/:id",
    summary: "Update a risk. Changing the scenario or score of an accepted risk withdraws the acceptance (the risk returns to open).",
    input: zRiskUpdate,
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  delete: op({
    name: "risks.delete",
    method: "DELETE",
    path: "/risks/:id",
    summary: "Delete a risk that was never accepted and never realized. Others are closed instead.",
    input: object(idParam),
    output: zOk,
    access: "signed-in",
    mcp: true
  }),
  readiness: op({
    name: "risks.readiness",
    method: "GET",
    path: "/risks/:id/readiness",
    summary: "Acceptance readiness checks. They are exactly what `risks.accept` enforces.",
    input: object(idParam),
    output: zRiskReadiness,
    access: "signed-in",
    mcp: true
  }),
  dispositionCheck: op({
    name: "risks.dispositionCheck",
    method: "GET",
    path: "/risks/:id/disposition-check",
    summary: "What blocks a disposition change, with live counts of open response issues.",
    input: object({ ...idParam, target: string2() }),
    output: object({
      target: string2(),
      blockers: array(string2()),
      openMitigations: number2().int(),
      openResearch: number2().int(),
      needsNote: boolean2()
    }),
    access: "signed-in",
    mcp: true
  }),
  history: op({
    name: "risks.history",
    method: "GET",
    path: "/risks/:id/history",
    summary: "Score, residual, disposition and owner changes from the audit log, newest first.",
    input: object(idParam),
    output: array(zRiskHistoryRow),
    access: "signed-in",
    mcp: true
  }),
  setDisposition: op({
    name: "risks.setDisposition",
    method: "POST",
    path: "/risks/:id/disposition",
    summary: "Change the disposition. A 409 names each unmet requirement. `accepted` is reachable only through `risks.accept`.",
    input: object({
      ...idParam,
      disposition: _enum(RISK_DISPOSITIONS),
      note: string2().nullable().optional(),
      realizedIssueId: zId.nullable().optional()
    }),
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  accept: op({
    name: "risks.accept",
    method: "POST",
    path: "/risks/:id/accept",
    summary: "Accept the risk: the signature. Needs a complete readiness panel. Human only.",
    input: object({ ...idParam, rationale: string2().nullable().optional() }),
    output: zRisk,
    access: "signed-in",
    mcp: true,
    humanOnly: true
  }),
  linkIssue: op({
    name: "risks.linkIssue",
    method: "POST",
    path: "/risks/:id/issues",
    summary: "Link an existing issue to the risk as mitigation or research work.",
    input: object({ ...idParam, issueId: zId, role: _enum(RISK_ISSUE_ROLES).default("mitigation") }),
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  spawnIssue: op({
    name: "risks.spawnIssue",
    method: "POST",
    path: "/risks/:id/issues/spawn",
    summary: "Create an issue and attach it. mitigation and research make a task and a link. realized makes a non-conformance and points the risk at it.",
    input: object({
      ...idParam,
      role: _enum([...RISK_ISSUE_ROLES, "realized"]),
      title: string2().trim().min(1).max(255),
      description: zText2
    }),
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  unlinkIssue: op({
    name: "risks.unlinkIssue",
    method: "DELETE",
    path: "/risks/:id/issues/:issueId",
    summary: "Remove a link between a risk and an issue. The issue is untouched.",
    input: object({ ...idParam, issueId: zId }),
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  addReference: op({
    name: "risks.addReference",
    method: "POST",
    path: "/risks/:id/references",
    summary: "Reference an OPAL number or a work order number from the risk.",
    input: object({
      ...idParam,
      type: _enum(RISK_REFERENCE_TYPES),
      value: string2().trim().min(1).max(20),
      notes: zText2
    }),
    output: zRisk,
    access: "signed-in",
    mcp: true
  }),
  removeReference: op({
    name: "risks.removeReference",
    method: "DELETE",
    path: "/risks/:id/references/:referenceId",
    summary: "Remove a reference from the risk.",
    input: object({ ...idParam, referenceId: zId }),
    output: zRisk,
    access: "signed-in",
    mcp: true
  })
};

// ../../OPAL/packages/shared/src/contracts.ts
var contracts = { auth, datasets, execution, inventory, issues, org, parts, platform, plugins, procedures, purchasing, reports, requirements, risks };
// ../../OPAL/packages/plugin-sdk/src/client.ts
class OpalApiError extends Error {
  status;
  code;
  constructor(status, code, message) {
    super(`${status} ${code}: ${message}`);
    this.status = status;
    this.code = code;
    this.name = "OpalApiError";
  }
}
function makeTransport(opalUrl, token, fetchFn = fetch) {
  return async (req) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (req.body !== undefined)
      headers["Content-Type"] = "application/json";
    const res = await fetchFn(`${opalUrl}/api${req.url}`, {
      method: req.method,
      headers,
      body: req.body === undefined ? undefined : JSON.stringify(req.body)
    });
    const text = await res.text();
    let body = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
    }
    if (!res.ok) {
      const b = body ?? {};
      throw new OpalApiError(res.status, b.error ?? "unknown", b.message ?? (text.slice(0, 200) || res.statusText));
    }
    return body;
  };
}
function makeApi(opalUrl, token, fetchFn) {
  return createClient(contracts, makeTransport(opalUrl, token, fetchFn));
}

// ../../OPAL/packages/plugin-sdk/src/sse.ts
class SseParser {
  buf = "";
  data = [];
  push(chunk) {
    this.buf += chunk;
    const out = [];
    let nl;
    while ((nl = this.buf.search(/\r\n|\n|\r/)) >= 0) {
      const m = /^(\r\n|\n|\r)/.exec(this.buf.slice(nl));
      if (m[0] === "\r" && nl + 1 === this.buf.length)
        break;
      const line = this.buf.slice(0, nl);
      this.buf = this.buf.slice(nl + m[0].length);
      if (line === "") {
        if (this.data.length)
          out.push(this.data.join(`
`));
        this.data = [];
      } else if (line.startsWith(":")) {} else {
        const i = line.indexOf(":");
        const field = i < 0 ? line : line.slice(0, i);
        let value = i < 0 ? "" : line.slice(i + 1);
        if (value.startsWith(" "))
          value = value.slice(1);
        if (field === "data")
          this.data.push(value);
      }
    }
    return out;
  }
}

// ../../OPAL/packages/plugin-sdk/src/plugin.ts
function log(...args) {
  const line = args.map((a) => typeof a === "string" ? a : a instanceof Error ? a.stack ?? a.message : safeJson(a)).join(" ");
  process.stdout.write(`${line.replace(/\r?\n/g, " | ")}
`);
}
function safeJson(v) {
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}
function need(env, name) {
  const v = env[name];
  if (v === undefined || v === "") {
    throw new Error(`@opal/plugin-sdk: environment variable ${name} is missing. Run the plugin through OPAL.`);
  }
  return v;
}
var sleep = (ms, signal) => new Promise((resolve) => {
  const t = setTimeout(resolve, ms);
  signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
});
function definePlugin(def, opts = {}) {
  const env = opts.env ?? process.env;
  const fetchFn = opts.fetch ?? fetch;
  const id = need(env, "OPAL_PLUGIN_ID");
  const opalUrl = need(env, "OPAL_URL").replace(/\/+$/, "");
  const token = need(env, "OPAL_TOKEN");
  const port = Number(need(env, "OPAL_PLUGIN_PORT"));
  const dataDir = need(env, "OPAL_PLUGIN_DATA");
  if (!Number.isInteger(port) || port < 0)
    throw new Error("@opal/plugin-sdk: OPAL_PLUGIN_PORT is not a port number.");
  let settings;
  try {
    settings = JSON.parse(need(env, "OPAL_SETTINGS"));
  } catch (e) {
    if (e instanceof SyntaxError)
      throw new Error("@opal/plugin-sdk: OPAL_SETTINGS is not valid JSON.");
    throw e;
  }
  const ctx = { id, api: makeApi(opalUrl, token, fetchFn), settings, dataDir, log, opalUrl };
  const app = new Hono2;
  app.get("/__health", (c) => c.text("ok"));
  def.routes?.(app, ctx);
  app.onError((err, c) => {
    log(`route error ${c.req.method} ${c.req.path}:`, err);
    return c.json({ error: "internal", message: "Plugin error" }, 500);
  });
  const server = Bun.serve({ hostname: "127.0.0.1", port, fetch: app.fetch });
  const abort = new AbortController;
  let reconciling = false;
  async function reconcile() {
    if (!def.reconcile || reconciling || abort.signal.aborted)
      return;
    reconciling = true;
    try {
      await def.reconcile.run(ctx);
    } catch (e) {
      log("reconcile failed:", e);
    } finally {
      reconciling = false;
    }
  }
  async function dispatch(data) {
    let event;
    try {
      event = JSON.parse(data);
    } catch {
      return;
    }
    if (!event || typeof event.type !== "string" || event.type === "heartbeat")
      return;
    const handler = def.events?.[event.type];
    if (!handler)
      return;
    try {
      await handler(event, ctx);
    } catch (e) {
      log(`handler ${event.type} failed:`, e);
    }
  }
  async function readStream() {
    const res = await fetchFn(`${opalUrl}/api/events/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      signal: abort.signal
    });
    if (!res.ok || !res.body)
      throw new Error(`event stream answered ${res.status}`);
    reconcile();
    const parser = new SseParser;
    const decoder = new TextDecoder;
    const reader = res.body.getReader();
    for (;; ) {
      const { done, value } = await reader.read();
      if (done)
        return;
      for (const data of parser.push(decoder.decode(value, { stream: true })))
        await dispatch(data);
    }
  }
  async function eventLoop() {
    let delay = 1000;
    while (!abort.signal.aborted) {
      const t0 = Date.now();
      try {
        await readStream();
      } catch (e) {
        if (abort.signal.aborted)
          break;
        log("event stream:", e instanceof Error ? e.message : e);
      }
      if (abort.signal.aborted)
        break;
      delay = Date.now() - t0 > 30000 ? 1000 : Math.min(delay * 2, 30000);
      await sleep(delay, abort.signal);
    }
  }
  let timer;
  let loop = Promise.resolve();
  const ready = (async () => {
    await def.start?.(ctx);
    if (def.reconcile)
      timer = setInterval(() => void reconcile(), def.reconcile.everyMinutes * 60000);
    if (def.events || def.reconcile)
      loop = eventLoop();
  })();
  ready.catch((e) => log("start failed:", e));
  let stopped;
  const stop = () => stopped ??= (async () => {
    abort.abort();
    if (timer)
      clearInterval(timer);
    await server.stop(true);
    await ready.catch(() => {});
    await loop.catch(() => {});
  })();
  if (opts.signals !== false) {
    process.once("SIGTERM", () => {
      stop().finally(() => process.exit(0));
    });
  }
  return { ctx, port: server.port ?? port, ready, stop };
}
// ../../OPAL/packages/plugin-sdk/src/html.ts
var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c]);
}

class SafeHtml {
  value;
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}
function part(v) {
  if (v instanceof SafeHtml)
    return v.value;
  if (Array.isArray(v))
    return v.map(part).join("");
  if (v === null || v === undefined || v === false)
    return "";
  return escapeHtml(v);
}
function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += part(v) + strings[i + 1];
  });
  return new SafeHtml(out);
}
// ../../OPAL/packages/plugin-sdk/src/panel.ts
var CSS = `
:root{--background:oklch(1 0 0);--foreground:oklch(0.145 0 0);--card:oklch(1 0 0);--primary:oklch(0.546 0.245 262.881);--primary-foreground:oklch(0.985 0 0);--muted:oklch(0.97 0 0);--muted-foreground:oklch(0.45 0 0);--border:oklch(0.922 0 0);--input:oklch(0.922 0 0);--ok:oklch(0.448 0.119 151.328);--warn:oklch(0.473 0.137 46.201);--error:oklch(0.505 0.213 27.518);--info:oklch(0.488 0.243 264.376);--radius:4px;color-scheme:light}
:root[data-theme=dark]{--background:#0a0a0a;--foreground:#e0e0e0;--card:#141414;--primary:#4a9eff;--primary-foreground:#0a0a0a;--muted:#1e1e1e;--muted-foreground:#a3a3a3;--border:#333;--input:#444;--ok:#4ade80;--warn:#fbbf24;--error:#f87171;--info:#4a9eff;color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;background:transparent}
body{font:13px/1.4 'IBM Plex Sans Variable','IBM Plex Sans',ui-sans-serif,system-ui,sans-serif;color:var(--foreground);padding:8px}
h1,h2,h3{font-size:13px;font-weight:600;margin:0 0 6px}
p{margin:0 0 6px}
a{color:var(--primary)}
code,.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px}
.muted{color:var(--muted-foreground)}
table{width:100%;border-collapse:collapse;margin:0 0 8px}
th,td{text-align:left;padding:3px 8px;border-bottom:1px solid var(--border);vertical-align:top}
th{font-weight:500;color:var(--muted-foreground);font-size:12px}
.badge{display:inline-block;padding:0 6px;border:1px solid var(--border);border-radius:var(--radius);font-size:12px;line-height:18px;background:var(--muted)}
.badge.ok{color:var(--ok);border-color:var(--ok)}
.badge.warn{color:var(--warn);border-color:var(--warn)}
.badge.error{color:var(--error);border-color:var(--error)}
.badge.info{color:var(--info);border-color:var(--info)}
button,.button{font:inherit;padding:2px 10px;border:1px solid var(--input);border-radius:var(--radius);background:var(--card);color:var(--foreground);cursor:pointer;text-decoration:none;display:inline-block}
button:hover,.button:hover{background:var(--muted)}
button.primary{background:var(--primary);border-color:var(--primary);color:var(--primary-foreground)}
button:disabled{opacity:.5;cursor:default}
input,select,textarea{font:inherit;padding:2px 6px;border:1px solid var(--input);border-radius:var(--radius);background:var(--card);color:var(--foreground)}
`;
var SCRIPT = `
(function(){
var q=new URLSearchParams(location.search);
var params={};q.forEach(function(v,k){params[k]=v});
var pt=q.get('pt')||'';
var id=PLUGIN_ID;
window.opal={params:params,fetch:function(path,init){
init=init||{};var h=new Headers(init.headers||{});h.set('X-Opal-Panel',pt);
var p=String(path);if(p[0]!=='/')p='/'+p;
return fetch('/plugins/'+encodeURIComponent(id)+p,Object.assign({},init,{headers:h}));}};
var last=-1;
function post(){var h=Math.ceil(document.documentElement.getBoundingClientRect().height);
if(h===last)return;last=h;parent.postMessage({type:'opal-panel-height',height:h},'*');}
addEventListener('load',post);addEventListener('resize',post);
if(window.ResizeObserver)new ResizeObserver(post).observe(document.documentElement);
post();
})();
`;
function panelPage(opts) {
  const theme = opts.theme === "dark" ? "dark" : "light";
  const id = opts.pluginId ?? process.env.OPAL_PLUGIN_ID ?? "";
  const idJs = JSON.stringify(id).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
<style>${CSS}</style>
</head>
<body>
${String(opts.body)}
<script>${SCRIPT.replace("PLUGIN_ID", idJs)}</script>
</body>
</html>
`;
}
// ../../OPAL/packages/plugin-sdk/src/hmac.ts
import { createHmac, timingSafeEqual } from "crypto";
function verifyHmac(secret, body, signature, algo = "sha256") {
  if (!signature)
    return false;
  let sig = signature.trim().toLowerCase();
  if (sig.startsWith(`${algo}=`))
    sig = sig.slice(algo.length + 1);
  if (!/^[0-9a-f]+$/.test(sig) || sig.length % 2)
    return false;
  const want = createHmac(algo, secret).update(body).digest();
  const got = Buffer.from(sig, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}
// src/kaneo.ts
class KaneoError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class Kaneo {
  apiKey;
  fetchFn;
  base;
  constructor(url, apiKey, fetchFn = fetch) {
    this.apiKey = apiKey;
    this.fetchFn = fetchFn;
    this.base = url.replace(/\/+$/, "");
  }
  async call(method, path, body) {
    let res;
    for (let attempt = 0;; attempt++) {
      res = await this.fetchFn(`${this.base}/api${path}`, {
        method,
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          ...body !== undefined ? { "content-type": "application/json" } : {}
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      if (res.status !== 429 || attempt >= 4)
        break;
      const after = Number(res.headers.get("retry-after"));
      await Bun.sleep((after > 0 ? after : 2 ** attempt * 2) * 1000);
    }
    const text = await res.text();
    if (!res.ok)
      throw new KaneoError(res.status, `Kaneo ${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  }
  taskUrl(task, workspaceId) {
    return `${this.base}/dashboard/workspace/${workspaceId}/project/${task.projectId}/task/${task.id}`;
  }
  workspaces() {
    return this.call("GET", "/workspace");
  }
  projects(workspaceId) {
    return this.call("GET", `/project?workspaceId=${encodeURIComponent(workspaceId)}`);
  }
  project(id) {
    return this.call("GET", `/project/${encodeURIComponent(id)}`);
  }
  columns(projectId) {
    return this.call("GET", `/column/${encodeURIComponent(projectId)}`);
  }
  task(id) {
    return this.call("GET", `/task/${encodeURIComponent(id)}`);
  }
  createTask(projectId, t) {
    return this.call("POST", `/task/${encodeURIComponent(projectId)}`, t);
  }
  setStatus(id, status) {
    return this.call("PUT", `/task/status/${encodeURIComponent(id)}`, { status });
  }
  setTitle(id, title) {
    return this.call("PUT", `/task/title/${encodeURIComponent(id)}`, { title });
  }
  setPriority(id, priority) {
    return this.call("PUT", `/task/priority/${encodeURIComponent(id)}`, { priority });
  }
  setDescription(id, description) {
    return this.call("PUT", `/task/description/${encodeURIComponent(id)}`, { description });
  }
  async board(projectId) {
    const out = new Map;
    for (let page = 1;; page++) {
      const p = await this.call("GET", `/task/tasks/${encodeURIComponent(projectId)}?page=${page}&limit=100`);
      const all = [...(p.data.columns ?? []).flatMap((c) => c.tasks ?? []), ...p.data.plannedTasks ?? [], ...p.data.archivedTasks ?? []];
      for (const t of all)
        out.set(t.id, t);
      if (page >= (p.pagination?.totalPages ?? 1))
        return out;
    }
  }
  activity(workspaceId) {
    return this.call("GET", `/activity/workspace/${encodeURIComponent(workspaceId)}`);
  }
  comments(taskId) {
    return this.call("GET", `/comment/${encodeURIComponent(taskId)}`);
  }
  addComment(taskId, content) {
    return this.call("POST", `/comment/${encodeURIComponent(taskId)}`, { content });
  }
  setWebhook(projectId, webhookUrl, secret) {
    return this.call("POST", `/generic-webhook-integration/project/${encodeURIComponent(projectId)}`, {
      webhookUrl,
      secret,
      events: {
        taskStatusChanged: true,
        taskPriorityChanged: true,
        taskTitleChanged: true,
        taskCommentCreated: true,
        taskDeleted: true
      }
    });
  }
}

// src/state.ts
import { Database } from "bun:sqlite";
import { join } from "path";
var fromRaw = (r) => ({
  kind: r.kind,
  opalId: r.opal_id,
  taskId: r.task_id,
  projectId: r.project_id,
  workspaceId: r.workspace_id,
  url: r.url,
  pushed: JSON.parse(r.pushed),
  lastOpalComment: r.last_opal_comment,
  syncedAt: r.synced_at
});

class State {
  db;
  constructor(dir) {
    this.db = new Database(join(dir, "kaneo.db"), { create: true, strict: true });
    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run(`CREATE TABLE IF NOT EXISTS task (
			kind TEXT NOT NULL, opal_id INTEGER NOT NULL, task_id TEXT NOT NULL UNIQUE,
			project_id TEXT NOT NULL, workspace_id TEXT NOT NULL, url TEXT NOT NULL,
			pushed TEXT NOT NULL, last_opal_comment INTEGER NOT NULL DEFAULT 0, synced_at TEXT NOT NULL,
			PRIMARY KEY (kind, opal_id))`);
    this.db.run(`CREATE TABLE IF NOT EXISTS seen_comment (
			task_id TEXT NOT NULL, comment_id TEXT NOT NULL, PRIMARY KEY (task_id, comment_id))`);
  }
  get(kind, opalId) {
    const r = this.db.query("SELECT * FROM task WHERE kind = ? AND opal_id = ?").get(kind, opalId);
    return r ? fromRaw(r) : undefined;
  }
  byTask(taskId) {
    const r = this.db.query("SELECT * FROM task WHERE task_id = ?").get(taskId);
    return r ? fromRaw(r) : undefined;
  }
  all(kind) {
    const rows = kind ? this.db.query("SELECT * FROM task WHERE kind = ?").all(kind) : this.db.query("SELECT * FROM task").all();
    return rows.map(fromRaw);
  }
  save(row) {
    this.db.query(`INSERT INTO task (kind, opal_id, task_id, project_id, workspace_id, url, pushed, last_opal_comment, synced_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT (kind, opal_id) DO UPDATE SET task_id = excluded.task_id, project_id = excluded.project_id,
				 workspace_id = excluded.workspace_id, url = excluded.url, pushed = excluded.pushed,
				 last_opal_comment = excluded.last_opal_comment, synced_at = excluded.synced_at`).run(row.kind, row.opalId, row.taskId, row.projectId, row.workspaceId, row.url, JSON.stringify(row.pushed), row.lastOpalComment, row.syncedAt);
  }
  drop(kind, opalId) {
    this.db.query("DELETE FROM task WHERE kind = ? AND opal_id = ?").run(kind, opalId);
  }
  seen(taskId, commentId) {
    return !!this.db.query("SELECT 1 FROM seen_comment WHERE task_id = ? AND comment_id = ?").get(taskId, commentId);
  }
  markSeen(taskId, commentId) {
    this.db.query("INSERT OR IGNORE INTO seen_comment (task_id, comment_id) VALUES (?, ?)").run(taskId, commentId);
  }
}

// src/sync.ts
var DEFAULT_ISSUE_COLUMNS = {
  pending: "to-do",
  in_work: "in-progress",
  in_review: "in-review",
  done: "done",
  void: "done"
};
var DEFAULT_WO_COLUMNS = {
  cut: "to-do",
  in_work: "in-progress",
  completed: "done",
  aborted: "done"
};
var TO_KANEO_PRIORITY = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "urgent",
  normal: "medium",
  urgent: "urgent"
};
var TO_OPAL_PRIORITY = {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "critical"
};
var MARK = /^\*\*[^*\n]+\*\* \u00B7 (OPAL|Kaneo)\n/;
var marked = (who, from, body) => `**${who}** \xB7 ${from}

${body}`;
var issueState = (i) => i.status === "void" ? "void" : i.ticketState;

class Sync {
  api;
  kaneo;
  state;
  config;
  pluginUserId;
  log;
  locks = new Map;
  constructor(api, kaneo, state, config, pluginUserId, log) {
    this.api = api;
    this.kaneo = kaneo;
    this.state = state;
    this.config = config;
    this.pluginUserId = pluginUserId;
    this.log = log;
  }
  locked(key, fn) {
    const prev = this.locks.get(key) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    const tail = run.catch(() => {
      return;
    });
    this.locks.set(key, tail);
    tail.then(() => {
      if (this.locks.get(key) === tail)
        this.locks.delete(key);
    });
    return run;
  }
  opalLink(path) {
    return this.config.publicUrl ? `${this.config.publicUrl.replace(/\/+$/, "")}${path}` : "";
  }
  issue(id) {
    return this.locked(`issue:${id}`, () => this.issuePass(id));
  }
  async issuePass(id) {
    const issue = await this.api.issues.get({ id });
    const projectId = this.config.issueProjects[issue.projectCode];
    let row = this.state.get("issue", id);
    if (!row) {
      if (!projectId || issue.status === "void")
        return;
      row = await this.createTask("issue", id, projectId, {
        title: `${issue.issueNumber} ${issue.title}`,
        priority: TO_KANEO_PRIORITY[issue.priority] ?? "medium",
        status: this.config.issueColumns[issueState(issue)],
        description: this.describe(issue.description, `/issues/${id}`),
        label: issue.issueNumber
      });
    }
    await this.pullIssue(row, issue);
    await this.pushIssue(row, await this.api.issues.get({ id }));
    await this.comments(row);
  }
  async pullIssue(row, issue) {
    const task = await this.kaneo.task(row.taskId);
    const prefix = `${issue.issueNumber} `;
    if (task.title !== row.pushed.title) {
      const title = task.title.startsWith(prefix) ? task.title.slice(prefix.length).trim() : task.title.trim();
      if (title && title !== issue.title)
        await this.api.issues.update({ id: issue.id, title });
    }
    if (task.priority !== row.pushed.priority) {
      const p = TO_OPAL_PRIORITY[task.priority];
      if (p && p !== issue.priority)
        await this.api.issues.update({ id: issue.id, priority: p });
    }
    if (task.status !== row.pushed.status) {
      const refused = await this.moveIssue(issue, task);
      if (refused)
        await this.kaneo.addComment(row.taskId, marked("OPAL", "OPAL", refused));
    }
    row.pushed = { title: task.title, priority: task.priority, status: task.status };
    this.save(row);
  }
  async moveIssue(issue, task) {
    const target = Object.entries(this.config.issueColumns).find(([state, col]) => col === task.status && state !== "void")?.[0];
    const from = issueState(issue);
    if (!target || target === from)
      return null;
    try {
      if (from === "pending" && target === "in_work")
        await this.api.issues.start({ id: issue.id });
      else if (from === "in_work" && target === "in_review")
        await this.api.issues.review({ id: issue.id });
      else if (from === "in_review" && target === "in_work")
        await this.api.issues.returnFromReview({ id: issue.id, comment: "Moved back to work in Kaneo." });
      else if (target === "done")
        return `${issue.issueNumber} closes in OPAL only: sign-off needs a person.`;
      else
        return `${issue.issueNumber} cannot move from ${from} to ${target}.`;
      return null;
    } catch (e) {
      return `${issue.issueNumber} did not move: ${e.message}`;
    }
  }
  async pushIssue(row, issue) {
    const want = {
      title: `${issue.issueNumber} ${issue.title}`,
      priority: TO_KANEO_PRIORITY[issue.priority] ?? "medium",
      status: this.config.issueColumns[issueState(issue)]
    };
    await this.push(row, want);
  }
  workOrder(id) {
    return this.locked(`wo:${id}`, () => this.woPass(id));
  }
  async woPass(id) {
    const wo = await this.api.execution.get({ id });
    const projectId = this.config.workOrderProjects[wo.projectCode];
    const number = wo.woNumber;
    const want = {
      title: `${number} ${wo.procedureName}`,
      priority: TO_KANEO_PRIORITY[wo.priority] ?? "medium",
      status: this.config.workOrderColumns[wo.status]
    };
    let row = this.state.get("wo", id);
    if (!row) {
      if (!projectId)
        return;
      row = await this.createTask("wo", id, projectId, {
        ...want,
        description: this.describe(null, `/executions/${number}`),
        label: number
      });
    }
    const task = await this.kaneo.task(row.taskId);
    row.pushed = { title: task.title, priority: task.priority, status: task.status };
    await this.push(row, want);
    await this.comments(row);
  }
  describe(body, path) {
    const link = this.opalLink(path);
    return [body ?? "", link ? `[Open in OPAL](${link})` : ""].filter(Boolean).join(`

`);
  }
  async createTask(kind, opalId, projectId, t) {
    const project = await this.kaneo.project(projectId);
    const task = await this.kaneo.createTask(projectId, {
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status
    });
    const url = this.kaneo.taskUrl(task, project.workspaceId);
    const row = {
      kind,
      opalId,
      taskId: task.id,
      projectId,
      workspaceId: project.workspaceId,
      url,
      pushed: { title: task.title, priority: task.priority, status: task.status },
      lastOpalComment: 0,
      syncedAt: new Date().toISOString()
    };
    this.save(row);
    await this.api.plugins.links.set({
      entityType: kind === "issue" ? "issue" : "execution",
      entityId: opalId,
      externalId: task.id,
      url,
      label: task.number != null ? `${project.slug}-${task.number}` : project.name
    });
    this.log(`created task ${task.id} for ${kind} ${t.label}`);
    return row;
  }
  async push(row, want) {
    if (want.title !== row.pushed.title)
      await this.kaneo.setTitle(row.taskId, want.title);
    if (want.priority !== row.pushed.priority)
      await this.kaneo.setPriority(row.taskId, want.priority);
    if (want.status !== row.pushed.status)
      await this.kaneo.setStatus(row.taskId, want.status);
    row.pushed = want;
    this.save(row);
  }
  async comments(row) {
    const opal = row.kind === "issue" ? await this.api.issues.listComments({ id: row.opalId }) : await this.api.execution.listComments({ id: row.opalId });
    for (const c of opal) {
      if (c.id <= row.lastOpalComment)
        continue;
      const author = "user" in c ? c.user : c.author;
      if (author?.id !== this.pluginUserId && !MARK.test(c.body)) {
        const sent = await this.kaneo.addComment(row.taskId, marked(author?.name ?? "OPAL", "OPAL", c.body));
        this.state.markSeen(row.taskId, sent.id);
      }
      row.lastOpalComment = c.id;
      this.save(row);
    }
    for (const k of await this.kaneo.comments(row.taskId)) {
      if (this.state.seen(row.taskId, k.id))
        continue;
      this.state.markSeen(row.taskId, k.id);
      if (MARK.test(k.content))
        continue;
      const body = marked(k.user?.name ?? "Kaneo", "Kaneo", k.content);
      const made = row.kind === "issue" ? await this.api.issues.addComment({ id: row.opalId, body }) : await this.api.execution.addComment({ id: row.opalId, body });
      row.lastOpalComment = Math.max(row.lastOpalComment, made.id);
      this.save(row);
    }
  }
  save(row) {
    row.syncedAt = new Date().toISOString();
    this.state.save(row);
  }
  async task(taskId) {
    const row = this.state.byTask(taskId);
    if (!row)
      return;
    await (row.kind === "issue" ? this.issue(row.opalId) : this.workOrder(row.opalId));
  }
  lastPoll = null;
  async all() {
    const since = this.lastPoll;
    this.lastPoll = new Date().toISOString();
    const kaneoIds = new Set([...Object.values(this.config.issueProjects), ...Object.values(this.config.workOrderProjects)]);
    const board = new Map;
    const workspaces = new Set;
    for (const id of kaneoIds) {
      for (const [taskId, t] of await this.kaneo.board(id))
        board.set(taskId, t);
      workspaces.add((await this.kaneo.project(id)).workspaceId);
    }
    const commented = new Set;
    if (since) {
      for (const ws of workspaces)
        for (const a of await this.kaneo.activity(ws))
          if (a.type === "comment" && a.createdAt > since)
            commented.add(a.taskId);
    }
    const stale = (row, want) => {
      if (!row || !since)
        return true;
      const t = board.get(row.taskId);
      const same = (a, b) => a.title === b.title && a.priority === b.priority && a.status === b.status;
      return commented.has(row.taskId) || !same(want, row.pushed) || t !== undefined && !same(t, row.pushed);
    };
    let synced = 0;
    const projects = (await this.api.org.projects.list({ limit: 500 })).items;
    const idOf = new Map(projects.map((p) => [p.code, p.id]));
    for (const code of Object.keys(this.config.issueProjects)) {
      const projectId = idOf.get(code);
      if (!projectId) {
        this.log(`issue project ${code} not found in OPAL`);
        continue;
      }
      for await (const i of pages((cursor) => this.api.issues.list({ projectId, cursor, limit: 200 }))) {
        const row = this.state.get("issue", i.id);
        const want = {
          title: `${i.issueNumber} ${i.title}`,
          priority: TO_KANEO_PRIORITY[i.priority] ?? "medium",
          status: this.config.issueColumns[issueState(i)]
        };
        if (row ? stale(row, want) : i.status !== "void") {
          synced++;
          await this.guard(`issue ${i.issueNumber}`, () => this.issue(i.id));
        }
      }
    }
    for (const code of Object.keys(this.config.workOrderProjects)) {
      const projectId = idOf.get(code);
      if (!projectId) {
        this.log(`work order project ${code} not found in OPAL`);
        continue;
      }
      for await (const w of pages((cursor) => this.api.execution.list({ projectId, cursor, limit: 200 }))) {
        const want = {
          title: `${w.woNumber} ${w.procedureName}`,
          priority: TO_KANEO_PRIORITY[w.priority] ?? "medium",
          status: this.config.workOrderColumns[w.status]
        };
        if (stale(this.state.get("wo", w.id), want)) {
          synced++;
          await this.guard(`work order ${w.woNumber}`, () => this.workOrder(w.id));
        }
      }
    }
    this.log(`poll: ${synced} synced, ${board.size} Kaneo tasks read`);
  }
  async guard(what, fn) {
    try {
      await fn();
    } catch (e) {
      this.log(`${what}: ${e.message}`);
    }
  }
}
async function* pages(get) {
  let cursor;
  do {
    const page = await get(cursor);
    yield* page.items;
    cursor = page.next ?? undefined;
  } while (cursor);
}

// src/plugin.ts
var sync = null;
var state = null;
var kaneo = null;
function json(v, fallback) {
  if (v == null || v === "")
    return fallback;
  if (typeof v === "object")
    return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return fallback;
  }
}
function configOf(s) {
  const columns = json(s.statusColumns, {});
  return {
    issueProjects: json(s.issueProjects, {}),
    workOrderProjects: json(s.workOrderProjects, {}),
    issueColumns: { ...DEFAULT_ISSUE_COLUMNS, ...columns.issue },
    workOrderColumns: { ...DEFAULT_WO_COLUMNS, ...columns.workOrder },
    publicUrl: typeof s.publicUrl === "string" && s.publicUrl ? s.publicUrl : null
  };
}
async function registerWebhooks(ctx, config) {
  const secret = ctx.settings.webhookSecret;
  if (!config.publicUrl || typeof secret !== "string" || !secret || !kaneo)
    return;
  const url = `${config.publicUrl.replace(/\/+$/, "")}/hooks/${ctx.id}/task`;
  const projects = new Set([...Object.values(config.issueProjects), ...Object.values(config.workOrderProjects)]);
  for (const p of projects) {
    try {
      await kaneo.setWebhook(p, url, secret);
      ctx.log(`webhook set on Kaneo project ${p}`);
    } catch (e) {
      ctx.log(`webhook on Kaneo project ${p}: ${e.message}`);
    }
  }
}
var ISSUE_ENTITIES = new Set(["issue", "issue_comment"]);
var WO_ENTITIES = new Set(["execution", "execution_comment"]);
var plugin_default = definePlugin({
  async start(ctx) {
    const config = configOf(ctx.settings);
    kaneo = new Kaneo(String(ctx.settings.url), String(ctx.settings.apiKey));
    state = new State(ctx.dataDir);
    const me = await ctx.api.auth.me({});
    sync = new Sync(ctx.api, kaneo, state, config, me.id, ctx.log);
    await registerWebhooks(ctx, config);
  },
  events: {
    async record_changed(event) {
      const d = event.data;
      if (!sync || !d.entity || !d.id)
        return;
      if (ISSUE_ENTITIES.has(d.entity)) {
        const id = d.entity === "issue" ? d.id : d.refs?.issueId;
        if (id)
          await sync.guard(`issue ${id}`, () => sync.issue(id));
      } else if (WO_ENTITIES.has(d.entity)) {
        const id = d.entity === "execution" ? d.id : d.refs?.executionId;
        if (id)
          await sync.guard(`work order ${id}`, () => sync.workOrder(id));
      }
    }
  },
  reconcile: {
    everyMinutes: 5,
    async run() {
      await sync?.all();
    }
  },
  routes(app, ctx) {
    app.post("/hooks/task", async (c) => {
      const secret = ctx.settings.webhookSecret;
      const body = await c.req.text();
      if (typeof secret !== "string" || !secret || !verifyHmac(secret, body, c.req.header("x-kaneo-signature"))) {
        return c.json({ error: "bad signature" }, 401);
      }
      const taskId = JSON.parse(body).task?.id;
      if (taskId && sync)
        sync.guard(`task ${taskId}`, () => sync.task(taskId));
      return c.json({ ok: true });
    });
    const panel = (kind, param) => async (c) => {
      const id = Number(c.req.query(param));
      const theme = c.req.query("theme");
      const row = state?.get(kind, id);
      const body = row ? html`<table>
						<tr><th>Task</th><td><a class="mono" href="${row.url}" target="_blank" rel="noopener">${row.pushed.title}</a></td></tr>
						<tr><th>Column</th><td class="mono">${row.pushed.status}</td></tr>
						<tr><th>Priority</th><td class="mono">${row.pushed.priority}</td></tr>
						<tr><th>Synced</th><td class="mono">${row.syncedAt.slice(0, 16).replace("T", " ")} UTC</td></tr>
					</table>
					<p><button id="sync">SYNC</button></p>` : html`<p class="muted">No task.</p><p><button id="sync">SYNC</button></p>`;
      const script = html`<script>
				document.getElementById('sync').onclick = async (e) => {
					e.target.disabled = true;
					await window.opal.fetch('/sync?${param}=${String(id)}', { method: 'POST' });
					location.reload();
				};
			</script>`;
      return c.html(panelPage({ title: "Kaneo", theme, body: html`${body}${script}` }));
    };
    app.get("/panel/issue", panel("issue", "issue"));
    app.get("/panel/execution", panel("wo", "execution"));
    app.get("/options/projects", async (c) => {
      if (!kaneo)
        return c.json({ items: [] });
      const spaces = await kaneo.workspaces();
      const items = [];
      for (const w of spaces)
        for (const p of await kaneo.projects(w.id))
          items.push({ value: p.id, label: `${spaces.length > 1 ? `${w.name} / ` : ""}${p.name} (${p.slug})` });
      items.sort((a, b) => a.label.localeCompare(b.label));
      return c.json({ items });
    });
    app.post("/sync", async (c) => {
      if (!sync)
        return c.json({ error: "not started" }, 503);
      const issue = Number(c.req.query("issue"));
      const wo = Number(c.req.query("execution"));
      if (issue)
        await sync.guard(`issue ${issue}`, () => sync.issue(issue));
      if (wo)
        await sync.guard(`work order ${wo}`, () => sync.workOrder(wo));
      return c.json({ ok: true });
    });
  }
});
export {
  plugin_default as default
};
