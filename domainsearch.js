const commandLineArgs = require('command-line-args');
const fs = require('fs');
const dns = require('dns');
const select = require('node-select').select;

const optionDefinitions = [
  { name: 'dictionary', alias: 'd', type: String, defaultOption: true },
  { name: 'word', alias: 'w', type: String, defaultValue: '' },
  { name: 'domains', alias: 'D', type: String },
  { name: 'conservative', alias: 'c', type: Boolean, defaultValue: true },
  { name: 'verify', alias: 'V', type: Boolean, defaultValue: false },
  { name: 'sort', alias: 's', type: Boolean, defaultValue: false },
  { name: 'include-nonsplit', alias: 'i', type: Boolean, defaultValue: false },
  { name: 'exclude-xn', alias: 'x', type: Boolean, defaultValue: false },
];

const options = select(null, () => {
  try {
    return commandLineArgs(optionDefinitions);
  } catch (e) {
    return {};
  }
});

if (!options.dictionary && !options.word) {
  console.error("Missing required parameters — one of 'dictionary' or 'word'");
  process.exit();
}

if (!options.domains) {
  options.domains = String(fs.readFileSync(options.conservative ?
      'tlds_conservative.txt' : 'tlds.txt'))
    .split('\n')
    .filter((tld) => !(options['exclude-xn'] && tld.indexOf('XN--') > -1))
    .map((tld) => tld.toLocaleLowerCase());
} else {
  options.domains = options.domains
    .split(',')
    .map((domain) => domain.trim().toLocaleLowerCase())
    .filter((domain) => Boolean(domain));
}

const dictionary = select(null, () => {
    if (options.dictionary) {
      return String(fs.readFileSync(options.dictionary))
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

  console.warn(`> Verifying ${candidates.length} candidates…`);

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
          console.warn(`> ${retry.length} requests timed out, retrying…`);
          verify(retry);
        } else if (options.sort) {
          printOutput(verified);
        }
      });
  }

  verify(candidates);
} else {
  printOutput(candidates);
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
