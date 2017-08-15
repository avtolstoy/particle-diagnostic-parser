## Usage

### Class instance:

```js
const DiagnosticParser = require('particle-diagnostic-parser').DiagnosticParser;
const sample = '[{"t":"app_thread","i":2,"c":{"a":"0x80a01b5","x":"blank.cpp:47"}]';

let p = new DiagnosticParser();

p.expand(sample).then((result) => {
  console.log(util.inspect(result, { depth: null }));
});
```

### Convenient wrapper

```js
const parser = require('particle-diagnostic-parser').parser;
const sample = '[{"t":"app_thread","i":2,"c":{"a":"0x80a01b5","x":"blank.cpp:47"}]';

parser(sample).then((result) => {
  console.log(util.inspect(result, { depth: null }));
});
```

### Expanded format example
```js
[ { thread: 'app_thread',
    id: 2,
    checkpoint: { address: '0x80a01b5', text: 'blank.cpp:47' },
    stacktrace: 
     [ { address: '0x808c6a2' },
       { address: '0x806831c' },
       { address: '0x80a01cc' },
       { address: '0x80a01b2' },
       { address: '0x80a0090' },
       { address: '0x8067afe' },
       { address: '0x8064cbe' },
       { address: '0x8067bf2' },
       { address: '0x8069cc2' },
       { address: '0x808c740' } ] },
  { thread: 'std::threa',
    id: 7,
    checkpoint: { address: '0x8068693' },
    stacktrace: 
     [ { address: '0x8083476' },
       { address: '0x807469a' },
       { address: '0x80633b2' },
       { address: '0x8064a28' },
       { address: '0x8064cb6' },
       { address: '0x8064cd8' },
       { address: '0x8064cde' },
       { address: '0x8064cd8' },
       { address: '0x80633e2' } ] },
  { thread: 'IDLE',
    id: 3,
    stacktrace: [ { address: '0x80835b4' } ] },
  { thread: 'tcpip_thre',
    id: 12,
    stacktrace: 
     [ { address: '0x8083476' },
       { address: '0x8091852' },
       { address: '0x80889be' },
       { address: '0x80860da' } ] } ]

```

### Passing a resolver function
```js
const Addr2Line = require('addr2line').Addr2Line;
const DiagnosticParser = require('particle-diagnostic-parser').DiagnosticParser;

const sample = '[{"t":"app_thread","i":2,"c":{"a":"0x80a01b5","x":"blank.cpp:47"}]';

const resolver = new Addr2Line(['/path/to/bin1.elf', '/path/to/bin2.elf']);
const parser = new DiagnosticParser(resolver);

// Object returned by the resolver function is merged (using Object.assign) with an
// Object containing `address` field.
function resolve(addr) {
  return resolver.resolve(addr);
}

parser.expand(sample).then((result) => {
  console.log(util.inspect(result, { depth: null }));
});

```

### Expanded and resolved example
```
[ { thread: 'app_thread',
    id: 2,
    checkpoint: 
     { address: '0x80a01b5',
       text: 'blank.cpp:47',
       function: 'loop',
       filename: 'blank.cpp',
       line: 47 },
    stacktrace: 
     [ { address: '0x808c6a2',
         function: 'host_rtos_delay_milliseconds',
         filename: 'wwd_rtos.c',
         line: 280 },
       { address: '0x806831c',
         function: 'system_delay_pump(unsigned long, bool)',
         filename: 'system_task.cpp',
         line: 490 },
       { address: '0x80a01cc',
         function: 'loop',
         filename: 'blank.cpp',
         line: 48 },
       { address: '0x80a01b2',
         function: 'loop',
         filename: 'blank.cpp',
         line: 47 },
       { address: '0x80a0090',
         function: 'module_user_loop',
         filename: 'user_part_export.c',
         line: 76 },
       { address: '0x8067afe',
         function: 'app_loop(bool)',
         filename: 'main.cpp',
         line: 535 },
       { address: '0x8064cbe',
         function: 'ActiveObjectBase::run()',
         filename: 'active_object.cpp',
         line: 55 },
       { address: '0x8067bf2',
         function: 'ActiveObjectCurrentThreadQueue::start()',
         filename: 'active_object.h',
         line: 410 },
       { address: '0x8069cc2',
         function: 'wiced_dct_unlock',
         filename: 'dct_hal.c',
         line: 59 },
       { address: '0x808c740',
         function: 'application_thread_main',
         filename: 'wiced_rtos.c',
         line: 155 } ] } ]
```
