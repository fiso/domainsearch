# domainsearch

A commandline tool that searches a given dictionary file for possible domain
names created by simply inserting a dot in the word. By default, it will search
all existing top-level domains, but you can also provide a list of domains to
search.

Optionally, you can also have the tool check for dns availability, using the
`--verify` parameter.

## Basic usage
`node domainsearch.js dictionaryfile`

## Parameters

- `--dictionary, -d` — Specify the dictionary file to use
- `--domains, -D` — Specify a comma-separated list of top-level domains to search (for example 'ga, it, net')
- `--verify` — Check if the domains are available for registration
- `--sort` — Alphabetically sort the output

### Examples
To search all existing top-level domains for Swedish words, without verification:
`node domainsearch.js dictionaries/swedish.dic`

To search all existing top-level domains for Swedish words, with verification:
`node domainsearch.js dictionaries/swedish.dic --verify`

To search only a few top-level domains for Swedish words, without verification:
`node domainsearch.js dictionaries/swedish.dic --domains 'ga, se, zippo'`
