try {
  var parser = require('particle-diagnostic-parser').DiagnosticParser;
} catch (e) {
  var parser = require('../lib/parser').DiagnosticParser;
}
const util = require('util');
const Addr2Line = require('addr2line').Addr2Line;
const Promise = require('bluebird');
const os = require('os');
const Table = require('cli-table');

const checkpointTableHead = ['Addr', 'Text', 'Source', 'Function'];
const stackTraceTableHead = ['Addr', 'Source', 'Function'];

function formatFileLine(file, line) {
  if (file && line) {
    return util.format('%s:%d', file, line);
  }
  return '';
};

function dump(data) {
  return new Promise((resolve, reject) => {
    let str = '';
    data.forEach((thread) => {
      str += util.format('Thread: %s [%d] %s', thread.thread, thread.id, os.EOL);
      if ('checkpoint' in thread) {
        str += 'Checkpoint:' + os.EOL;
        let table = new Table({ head: checkpointTableHead });
        table.push([thread.checkpoint.address,
                    thread.checkpoint.text || '',
                    formatFileLine(thread.checkpoint.filename, thread.checkpoint.line),
                    thread.checkpoint.function || '']);
        str += table.toString() + os.EOL;
      }
      if ('stacktrace' in thread) {
        str += 'Stacktrace:' + os.EOL;
        let table = new Table({ head: stackTraceTableHead });
        thread.stacktrace.forEach((sitem) => {
          table.push([sitem.address,
                      formatFileLine(sitem.filename, sitem.line),
                      sitem.function || '']);
        });
        str += table.toString() + os.EOL;
      }
      str += os.EOL;
    });
    resolve(str);
  });
};

const resolver = new Addr2Line(process.argv.slice(2), {prefix: 'arm-none-eabi-', basenames: true});
const p = new parser((addr) => {
  return resolver.resolve(addr);
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
