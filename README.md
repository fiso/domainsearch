# domainsearch

A commandline tool that searches a given dictionary file for possible domain
names created by simply inserting a dot in the word. By default, it will search
all existing top-level domains, but you can also provide a list of domains to
search.

Optionally, you can also have the tool check for dns availability, using the
`--verify` parameter.

## Usage
`node domainsearch.js dictionaryfile [comma-separated list of top-level domains] [--verify]`

### Examples
To search all existing top-level domains for Swedish words, without verification:
`node domainsearch.js dictionaries/swedish.dic`

To search all existing top-level domains for Swedish words, with verification:
`node domainsearch.js dictionaries/swedish.dic --verify`

To search only a few top-level domains for Swedish words, without verification:
`node domainsearch.js dictionaries/swedish.dic --domains 'ga, se, zippo'`

### Where can I get more dictionary files?
They're everywhere, just google for them. I found mine at https://github.com/titoBouzout/Dictionaries
