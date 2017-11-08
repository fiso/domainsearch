const commandLineArgs = require('command-line-args');
const fs = require('fs');
const dns = require('dns');

const optionDefinitions = [
  { name: 'dictionary', alias: 'd', type: String, defaultOption: true },
  { name: 'domains', alias: 'D', type: String },
  { name: 'verify', alias: 'V', type: Boolean, defaultValue: false },
  { name: 'sort', alias: 's', type: Boolean, defaultValue: false },
];

let options = {};
try {
  options = commandLineArgs(optionDefinitions);
} catch (e) {
  
}

if (!options.dictionary) {
  console.log("Missing required parameter 'dictionary'");
  process.exit();
}

if (!options.domains) {
  options.domains = String(fs.readFileSync('tlds.txt'))
    .split('\n')
    .map((tld) => tld.toLocaleLowerCase());
} else {
  options.domains = options.domains
    .split(',')
    .map((domain) => {
      return domain.trim().toLocaleLowerCase();
    })
    .filter((domain) => {
      return Boolean(domain);
    });
}

const dictionary = String(fs.readFileSync(options.dictionary))
  .split('\n')
  .slice(1)
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
      if (word.substr(-domain.length) === domain) {
        list.push(word.substring(0, word.length - domain.length) + '.'
          + domain);
      }
    });
    return list;
  }, []);

if (options.verify) {
  const verified = [];
  const promises = candidates.map((candidate) => {
    return new Promise((resolve, reject) => {
      dns.resolve4(candidate, (result) => {
        if (result && result.errno === dns.NOTFOUND) {
          if (options.sort) {
            verified.push(candidate);
          } else {
            console.log(candidate);
          }
        }
        resolve();
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      if (options.sort) {
        printOutput(verified);
      }
    });
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
