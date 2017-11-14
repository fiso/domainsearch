#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const fs = require('fs');
const dns = require('dns');
const select = require('node-select').select;
const path = require('path');

const optionDefinitions = [
  { name: 'dictionary', alias: 'd', type: String, defaultOption: true, description: 'filename of dictionary file' },
  { name: 'word', alias: 'w', type: String, defaultValue: '', description: 'single word to use, instead of dictionary' },
  { name: 'domains', alias: 'D', type: String, description: 'comma-separated list of specific top-level domains to search (leave blank to use default list)' },
  { name: 'alldomains', alias: 'a', type: Boolean, defaultValue: false, description: 'include all existing top-level domains, and not only ones that are known to be available for registration' },
  { name: 'verify', alias: 'V', type: Boolean, defaultValue: false, description: 'verify domain availability via dns lookup' },
  { name: 'sort', alias: 's', type: Boolean, defaultValue: false, description: 'sort output alphabetically' },
  { name: 'include-nonsplit', alias: 'i', type: Boolean, defaultValue: false, description: 'for a word like "delicious", look for available top domains like "delicious.com", and not just clever constructs like "delicio.us"' },
  { name: 'exclude-xn', alias: 'x', type: Boolean, defaultValue: false, description: 'exclude domains that start with XN--' },
  { name: 'help', alias: 'h', type: Boolean, defaultValue: false, description: 'show this help text' },
  { name: 'version', alias: 'v', type: Boolean, defaultValue: false, description: 'print version number' },
];

const options = select(null, () => {
  try {
    return commandLineArgs(optionDefinitions);
  } catch (e) {
    if (e.message) {
      console.error(e.message);
    }

    return optionDefinitions.reduce((options, entry) => {
      if (typeof entry.defaultValue !== 'undefined') {
        options[entry.name] = entry.defaultValue;
      }
      return options;
    }, {});
  }
});

function usage () {
  console.log('Usage: domainsearch [dictionaryfile] [options]');
  console.log('       OR');
  console.log('       domainsearch -w [word] [options]');
  console.log('');
  console.log('Options:');
  function rightPad (str, len, pad) {
    let newStr = str;
    while (newStr.length < len) {
      newStr += pad;
    }
    return newStr;
  }

  optionDefinitions.forEach((option) => {
    console.log(`  ${rightPad(`-${option.alias}, --${option.name}`, 26, ' ')} ${option.description}`);
  });
}

if (options.version) {
  console.log(require('./package.json').version);
  process.exit();
}

if (options.help) {
  usage();
  process.exit();
}

if (!options.dictionary && !options.word) {
  console.error("Missing required parameters — one of 'dictionary' or 'word'");
  usage();
  process.exit(1);
}

if (!options.domains) {
  options.domains = String(fs.readFileSync(options.conservative ?
      `${__dirname}${path.sep}tlds_conservative.txt` :
      `${__dirname}${path.sep}tlds.txt`))
    .split('\n')
    .filter((domain) => !(options['exclude-xn'] && domain.indexOf('XN--') > -1))
    .map((domain) => domain.trim().toLocaleLowerCase())
    .filter((domain) => Boolean(domain))
    .map((domain) => domain.toLocaleLowerCase());
} else {
  options.domains = options.domains
    .split(',')
    .map((domain) => domain.trim().toLocaleLowerCase())
    .filter((domain) => Boolean(domain));
}

const dictionary = select(null, () => {
    if (options.dictionary) {
      let file = '';
      try {
        file = String(fs.readFileSync(options.dictionary));
      } catch (e) {
        try {
          file = String(fs.readFileSync(`${__dirname}${path.sep}${options.dictionary}`));
        } catch (e) {
          console.error(`Error accessing file ${options.dictionary}`);
          process.exit(1);
        }
      }

      return file
        .split('\n')
        .slice(1);
    } else if (options.word) {
      return [options.word];
    }
  })
  .map((word) => {
    return word.toLocaleLowerCase();
  })
  .map((word) => {
    const slashPos = word.indexOf('/');
    if (slashPos === -1) {
      return word;
    }
    
    return word.substring(0, slashPos);
  }).filter((word) => word.length > 0);

const candidates = dictionary
  .reduce((list, word) => {
    options.domains.forEach((domain) => {
      if (options['include-nonsplit']) {
        list.push(`${word}.${domain}`);
      }
      if (word.substr(-domain.length) === domain &&
        word.length > domain.length) {
        list.push(word.substring(0, word.length - domain.length) + '.'
          + domain);
      }
    });
    return list;
  }, []);

if (options.verify) {
  const verified = [];

  console.warn(`> Verifying ${candidates.length} ${pluralize(candidates.length, 'candidate', 'candidates')}…`);
  let lastRetry = -1;

  function verify (candidates) {
    const retry = [];
    const promises = candidates.map((candidate) => {
      return new Promise((resolve, reject) => {
        dns.resolve4(candidate, (result) => {
          if (result && result.errno) {
            if (result.errno === dns.NOTFOUND) {
              if (options.sort) {
                process.stderr.write('.');
                verified.push(candidate);
              } else {
                console.log(candidate);
              }
            } else if (result.errno === dns.TIMEOUT) {
              if (options.sort) {
                process.stderr.write('.');
              }
              retry.push(candidate);
            } else {
              console.error(`\n${candidate} ${result.errno}`);
            }
          }
          resolve();
        });
      });
    });
  
    Promise.all(promises)
      .then(() => {
        if (options.sort) {
          process.stderr.write('\n');
        }

        if (retry.length > 0) {
          if (lastRetry !== -1 && retry.length === lastRetry) {
            console.error(`> Retrying appears to be stuck. Terminating.`);
            console.error('> The following domains failed permanently:');
            console.error(retry);
            if (options.sort) {
              printOutput(verified);
            }
          } else {
            console.warn(`> ${retry.length} ${pluralize(retry.length, 'request', 'requests')} timed out, retrying…`);
            lastRetry = retry.length;
            verify(retry);
          }
        } else if (options.sort) {
          printOutput(verified);
        }
      });
  }

  verify(candidates);
} else {
  printOutput(candidates);
}

function pluralize (value, singular, plural) {
  return Number(value) > 1 ? plural : singular;
}

function printOutput (result) {
  if (options.sort) {
    console.log(result
      .sort()
      .join('\n'));
  } else {
    console.log(result
      .join('\n'));
  }
}
