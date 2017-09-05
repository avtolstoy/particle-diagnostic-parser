try {
  var parser = require('particle-diagnostic-parser').DiagnosticParser;
} catch (e) {
  var parser = require('../lib/parser').DiagnosticParser;
}
const util = require('util');
const Addr2Line = require('/home/avtolstoy/dev/particle/addr2line/lib/addr2line').Addr2Line;
const Promise = require('bluebird');
const os = require('os');
const printf = require('printf');

function formatFileLine(file, line) {
  if (file && line) {
    return util.format('%s:%d', file, line);
  }
  return '??';
};

function traceEntry(idx, address, func, fileline, chkpt) {
  let str = printf('#%-2s 0x%08x in %s at %s', idx, parseInt(address), func, fileline);
  if (chkpt) {
    str += printf('(chekpoint: %s)', chkpt);
  }
  return str;
};

function dump(data) {
  return new Promise((resolve, reject) => {
    let str = '';
    data.forEach((thread) => {
      str += util.format('Thread: %s [%d] %s', thread.thread, thread.id, os.EOL);
      if ('checkpoint' in thread) {
        str += traceEntry('C',
                          thread.checkpoint.address,
                          thread.checkpoint.function || '??',
                          formatFileLine(thread.checkpoint.filename, thread.checkpoint.line),
                          thread.checkpoint.text);
        str += os.EOL;
      }
      if ('stacktrace' in thread) {
        thread.stacktrace.forEach((sitem, idx) => {
          str += traceEntry(idx,
                            sitem.address,
                            sitem.function || '',
                            formatFileLine(sitem.filename, sitem.line));
          str += os.EOL;
        });
      }
      str += os.EOL;
    });
    resolve(str);
  });
};

const resolver = new Addr2Line(process.argv.slice(2), {prefix: 'arm-none-eabi-', basenames: true});
const p = new parser((addr) => {
  return resolver.resolve(addr).catch((e) => {
    console.log(e);
  });
});

let diagData = '';

process.stdin.setEncoding('utf-8');
process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    diagData += chunk;
  }
});

process.stdin.on('end', () => {
  p.expand(diagData).then((res) => {
    dump(res).then((res) => {
      console.log(res);
    });
  });
});
