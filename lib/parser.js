const util = require('util');
const Promise = require('bluebird');
const CustomError = require('./error');

class DiagnosticParserError extends CustomError {
  constructor(message) {
    super(message);
  }
};

function execPromise(args, opts) {
  opts = opts || {};
  return new Promise((resolve, reject) => {
    const proc = exec(args, opts, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      } else {
        return resolve({stdout: stdout, stderr: stderr});
      }
    });
  });
};

const conversionMap = {
  t: 'thread',
  i: 'id',
  c: 'checkpoint',
  a: 'address',
  x: 'text',
  s: 'stacktrace'
};

class DiagnosticParser {
  constructor(resolver) {
    this._resolver = resolver || null;
  }

  expand(data) {
    return new Promise((resolve, reject) => {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      const err = new DiagnosticParserError("Format error");

      if (!(data instanceof Array)) {
        throw err;
      }

      let result = [];

      Promise.map(data, (thread, idx) => {
        let obj = {};
        this._convertKeys(thread, obj);
        let all = [];
        if (this._resolver !== null) {
          if ('checkpoint' in obj) {
            if (!(obj.checkpoint instanceof Object)) {
              throw err;
            }
            if ('address' in obj.checkpoint) {
              all.push(Promise.resolve(this._resolver(obj.checkpoint.address))
              .then((res) => {
                Object.assign(obj.checkpoint, res || {});
              })
              .catch((err) => {
                // Ignore
                return;
              }));
            }
          }
        }
        if ('stacktrace' in obj) {
          if (!(obj.stacktrace instanceof Array)) {
            throw err;
          }

          obj.stacktrace.forEach((v, sidx) => {
            obj.stacktrace[sidx] = {address: v};
            if (this._resolver !== null) {
              all.push(Promise.resolve(this._resolver(v))
              .then((res) => {
                Object.assign(obj.stacktrace[sidx], res || {});
              })
              .catch((err) => {
                // Ignore
                return;
              }));
            }
          });
        }
        return Promise.all(all).then((res) => {
          result[idx] = obj;
        });
      }).then((res) => {
        resolve(result);
      });
    });
  }

  _convertKeys(from, to) {
    Object.keys(from).forEach((k) => {
      if (k in conversionMap) {
        to[conversionMap[k]] = from[k];
        if (from[k] instanceof Object && !(from[k] instanceof Array)) {
          to[conversionMap[k]] = this._convertKeys(from[k], {});
        }
      }
    });
    return to;
  }

  static parser(data, resolver) {
    let p = new DiagnosticParser(resolver);
    return p.expand(data);
  }
};

module.exports = {
  DiagnosticParser: DiagnosticParser,
  parser: DiagnosticParser.parser
};
