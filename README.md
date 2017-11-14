# domainsearch

A commandline tool that searches a given dictionary file for possible domain
names created by simply inserting a dot in the word. By default, it will search
all existing top-level domains, but you can also provide a list of domains to
search.

Optionally, you can also have the tool check for dns availability, using the
`--verify` parameter. It will retry queries that time out, until they're all
queried, or if the same list of domains keep giving timeouts, whichever comes
first.

## Installation
`npm install -g domainsearch`

## Basic usage
`domainsearch dictionaryfile` or `domainsearch --word myword`

## Parameters

One of either dictionary or word must be given.

- `--dictionary, -d` — Specify the dictionary file to use
- `--word, -w` — Don't use a dictionary, but rather just use one specific word
- `--domains, -D` — Specify a comma-separated list of top-level domains to search (for example 'ga, it, net')
- `--verify, -V` — Check if the domains are available for registration
- `--sort, -s` — Alphabetically sort the output
- `--alldomains, -a` — Include all existing top-level domains, and not only ones that are known to be available for registration
- `--include-nonsplit, -i` — For the word "delicious", look for available top domains like "delicious.com", and not just clever constructs like "delicio.us"
- `--exclude-xn, -x` — Exclude domains that start with XN--

### Examples
To search all existing top-level domains for Swedish words, without verification:
`domainsearch dictionaries/swedish.dic --alldomains`

To search all existing top-level domains for Swedish words, with verification:
`domainsearch dictionaries/swedish.dic --verify --alldomains`

To search only a few top-level domains for Swedish words, without verification:
`domainsearch dictionaries/swedish.dic --domains 'ga, se, zippo'`

To search the entire english dictionary for available [word.domain] domains,
excluding domains that start with XN--, verify availability, only look at top level
domains that are possible to register, sort the output and store it in `us.txt`:
`domainsearch dictionaries/usenglish.dic --verify --exclude-xn --sort > us.txt`

Be aware a big search like this takes something like 40 minutes to complete.