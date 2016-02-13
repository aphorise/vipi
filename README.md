# `V`isitor `IP` `I`nfo (`vipi`)
###### Relevant [**licenses**] should be properly considered in commercial and none free use cases / environments.

`vipi` is a [**`Node.js`**] utility leveraging [_`Maxmind`_] *__GeoIP__* *DB* as well [**`npm maxmind`**] to provide known info of each `IP`'s:
 - Location (Country, City, etc)
 - Time Zones
 - [**ASN**]

`vipi` is a standalone command-line-interface (CLI) utility and it may also serve as a HTTP server / web daemon.

The intent with this utility is to provide dual log stores that are in **C**omman-**L**og-**F**ormat ([**CLF**]) and JSON contextual to application and user requirements. Session specific information can be stored and read to an automatically named file and or any other specificed file.

Available functionality and features - by way of CLI arguments / parameters or query-strings (get-parameters) in daemon mode are documented herein.

## Installation

### npm 

Using as a `npm` an `OS` with `Node.js` already installed.

```shell
npm install -g vipi	# global install
npm install vipi	# use in your project
```


### shell (`bash`, `dash`, `sh`)

Bare-bone installation via `shell` (`curl` or `wget`) is possible where `node.js` or `npm` is not installed:

```shell
# download `n` node.js version manager via `wget` or `curl`
wget https://github.com/tj/n/archive/master.zip ;
# curl -L https://github.com/tj/n/archive/master.zip -o master.zip
# ... next unzip & install: 
unzip master.zip && cd n-master && sudo make install && sudo n 5.5.0 & cd .. && rm -rf n-master  
sudo npm install -g vipi
vipi --help
# should get help page
```


## Usage

Once installed `vipi` can be used as a standalone command or further extended as module in your `Node.js` script / project.

### `shell` / Command Line Interface (CLI)

Once installed you may run in *_`shell`_*

```shell
vipi	# // brief help & options
man vipi	#// for manual
```

Example lookup uses:

```shell
vipi 208.67.222.222		# single IP lookup
vipi 208.67.222.222 208.67.220.220	# multi IP lookups
vipi 8.8.8.8 8.8.4.4 -cd	# include distance between pairs
```

Custom & automatic saving of JSON Object & String CLF key(s) for queried IP:

```shell
vipi 208.67.222.222 -sa -skc='200 "GET / HTTP/1.1"'
# Key string to save for IP entry in Auto-Save CLF logs
```

```shell
vipi 208.67.222.222 -sa -sko='{"x":9}'
# Key JSON Object string for IP entry in Auto-Save OBJ logs
```

```shell
vipi 208.67.222.222 -sf=S3141_user -skc='200 "GET / HTTP/1.1" -sko='{"x":9}'
# log OBJ & CLF to specified file 'S3141_user' session file(s)
```

Logs are savd to the specified absolute or relative path from which execution occured (`pwd` / `cwd`).


### `daemon` / HTTP Server

To execute `vipi` as web daemon either `-d` / `--daemon`  or `-dp` / `--dipport` options are required such as:

```shell
vipi -d				# // default mode
vipi -dp=127.0.0.1:65534	# // custom IP:PORT binding
```

Default daemon options allow for read, write and return to be freely available; thus post launch - visiting the address of the instance in a browser without any option ( or with `!_help` `||` `!_h` parameter) should yield a brief of usage and available parameters. Eg:

```shell
curl 127.0.0.1:59999	# will output:
```

```
|\-------------------------/|
| ==== Visitor IP Info ==== |
|/_________________________\|
	vipi - v0.0.2

Usage (?!_=...):
	http://127.0.0.1:59999/?!_=ua		# use the inquiring address instead of ip.
	http://127.0.0.1:59999/?!_=208.67.222.222	# query & get results in text/plain

(&) Quiry String / Get-Parameters:
	!_as,	!_asnumber		Includes ASN number of IP queried.
	!_cd,	!_cdistance		Calculate & Include approximate distances in Kilometres between IPs pairs.
	!_df=,	!_deletefile=	Delete obj & clf named file(s).
	!_da,	!_deleteall		Deletes all clf & obj file(s) resetting to new.
	!_h,	!_help			Shows this help page.
	!_js,	!_json			Return content-type: 'application/json' instead of 'text/plain'.
	!_ls,	!_listsaves		Lists all available user obj json files.
	!_nu,	!_noua			Include requesting users agent in save.
	!_nr,	!_noreturn		No output or return.
	!_nc,	!_noclf			Include requesting users agent in save.
	!_ra,	!_readauto		Return content-type: 'application/json'
	!_rf=,	!_readfile=		Contents of log file to read & return.
	!_sua,	!_saveua		Include requesting users agent in save.
	!_tp,	!_textplain		Return content-type: 'text/plain'.
	!_sa,	!_saveauto		Save to file named using date: 'IP [DATE] KEY' (KEY optional) in .clf & .json file.
	!_sf=,	!_savefile=		Save like -sa: using specified file prefix name for .clf & .json saves.
	!_skc=,	!_skclf=		Save KEY clf string URL-Encoded string eg: '200 "GET / HTTP/1.1"' to save.
	!_sko=,	!_skobj=		Save KEY object json string URL-Encoded eg '{"eg":1}' to save.
	!_tz,	!_timezone		Includes time-zone of IP location queried.
	!_xi,	!_xinfo			Show OS / Node.js / Maxmind DB related info & exit.
```

Requests made to the server are by way of **Quiry-String**(s) / **Get-Parameter**(s) which are prefixed with **`!_`**. When in default non-referral mode - the `!_=` parameter is used to pass the `IP` being queried.

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222'	# will output:
```

```shell
[{"ip":"208.67.222.222","date":"2016-02-04T11:40:01.984Z","location":{"countryCode":"US","countryName":"United States","region":"CA","city":"San Francisco","postalCode":"94107","latitude":37.7697,"longitude":-122.39330000000001,"dmaCode":807,"areaCode":415,"metroCode":807,"continentCode":"NA","regionName":"California"},"ua":"curl/7.38.0","timeZone":"America/Los_Angeles","asn":"AS36692 OpenDNS, LLC"}]
```

Multiple `IP`'s may also be passed in sequence using multiple `!_=` values or using a single comma (`,`) separated value such as:

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222,8.8.8.8'	# two (2x) IPs comma separated
curl '127.0.0.1:59999/?!_=208.67.222.222&!_=8.8.8.8'	# serialised.
```

In daemon mode GeoIP DB files are written at the path of exceution in the *directory*: **`vipi_dbs`**.

A JSON Object key and CLF string key can be as passed as [**Percent-Encoded**] (URL-Encoded) strings which can be saved with each lookup `ip` where save features have been enabled. For example doing:

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222&!_skc=200%20%22GET%20%2F%20HTTP%2F1.1%22'
# OBJ Key = '{"x":9}' - Object saved for this entry in JSON logs
```

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222&!_sko=%7B%22x%22%3A9%7D'
# CLF Key = '200 "GET / HTTP/1.1"' - String saved for this entry in CLF logs
```

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222&!_sko=%7B%22x%22%3A9%7D&!_skc=200%20%22GET%20%2F%20HTTP%2F1.1%22'
# Save both CLF & OBJ keys.
```


#### Collector / Silent `daemon`

Semi or fully silent daemon mode(s) are possible with the  `-dn...` & `-dx...` set of parameters where they be act as collectors; a use case may be:.
 
```
vipi -d -dno -dnr -dnw -dur -dxa -dsa	# // only collects auto saving & ignoring all !_ parameters.
```


### `Node.js` & `npm`

Using `vipi` as an `npm` module is also possible though the original [**`npm maxmind`**] is recommended instead.  
This module ships with the following available methods / functions:

| function | parameters & description |
| ------------- |:-------------:|
| `.lookup(IPs, true, false)` | (1st) String or Array of `IP`, (2nd) distance calculation of pairs, (3rd) benchmark mode. |
| `.enableupdates(Hours)` | Enables automatic update checks every 24 Hours where no value is passed |

Simple example:

```
var mVIPI = require("vipi");
var aReturn = mVIPI.lookup(["208.67.222.222","208.67.220.220"]);
mVIPI.enableupdates();
console.log("IP Details:\n", aReturn);
```


#### Error Handeling

Any error(s) incured in the lookup process result in a `String` return containing `ERROR:` in CLI / Daemon modes or an array containing the same value when used as an array.
Other quiried requests which do not result in an error are not returned; this should *NOT* prevent or stop the logging of the successfuly quireid `IP`'s in damon modes.


----


## Notes

### Performance

A performance of `~` `100,000` to `300,000` lookups per second can be expected in non-daemon / http modes with most modern (2015) `x64` computers subject to available resources including the `node.js` version, hardware specification such as `DDR` as well as other architectural consideration.
Daemon / http mode - are limited by the asynchronous and single process nature of node and as such and any concurrency beyond `100,000` is highly unlikely and advised; 
for greater concurrent volumes of lookups consider load-balancing / running multiple version of the service.


### Benchmarking

The author of [**`GoAccess`**] \([_@allinurl_]\) - had appropriatly asked whether the acclaimed numbers herein have been tested; an example benchmark case has subsequently been included in [`vipi_benchmark.js`].  
The included benchmark performs a linar ordered lookup of over `100,000` IP which goes to demonstrate the expected number of looks that may be expected from the host computer on which `vipi` is executed.  
Two example x64 architecture which are over a decade (10 years) apart in age are shown below:

#### Older Hardware 2004 Era
```sh
cat /proc/cpuinfo && sudo dmidecode --type 17 # or 'hwinfo' 
# CPU - Model: Intel(R) Xeon(TM) CPU 3.60GHz
#  Clock: 3591 MHz
#  L1 Cache: 16 kb
#  L2 Cache: 1024 kb
# ------- 
# MEMORY - Type: DDR2 - ECC RAM
#  Speed: 400 MHz
# -------

vipi_benchmark
 
# Doing lookups of:  100000  IPs ...
# Completed approximatly: 300000 operations (location, timezone & asn lookups)
# IP READ Time in Seconds: 0.16299986839294434
# LOOKUP Time in Seconds: 6.851000070571899
# TOTAL execution Time: 7.014999866485596
# EXPECTED lookups a sec: 14596.40913295923
```

#### Modern Hardware 2015 Era
```sh
cat /proc/cpuinfo && sudo dmidecode --type 17 ; # or 'hwinfo' 
# CPU - Model: Intel(R) Core(TM) i7-5820K CPU @ 3.30GHz
#  Clock: 3591 MHz
#  L1 Cache: 64 kb
#  L2 Cache: 256 kb
#  L3 Cache: 2560 kb
# ------- 
# MEMORY - Type: DDR4 - NON-ECC RAM
#  Speed: 2400 MHz

vipi_benchmark

# Doing lookups of:  100000  IPs ...
# Completed approximately: 300000 operations (location, timezone & asn lookups) 
# IP READ Time in Seconds: 0.06599998474121094 
# LOOKUP Time in Seconds: 1.502000093460083 
# TOTAL execution Time: 1.569000005722046 
# EXPECTED lookups a sec: 66577.89199575545
```


### http / daemon testing

The daemon / http mode can be tested using [`ab`] tool. For example to perform `10,000` concurrent requests:

```sh
sudo su ; # execute as root
ulimit -a ; # check user limits
ulimit -n 1000000 ; # set as high
ab -n 10000 -c 10000 'http://127.0.0.1:59999/?!_=208.67.222.222&!_nr'
# ...
# Concurrency Level:      10000
# Time taken for tests:   2.651 seconds
# Complete requests:      10000
# Failed requests:        0
# Total transferred:      1590000 bytes
# HTML transferred:       50000 bytes
# Requests per second:    3772.14 [#/sec] (mean)
# Time per request:       2651.013 [ms] (mean)
# Time per request:       0.265 [ms] (mean, across all concurrent requests)
# Transfer rate:          585.71 [Kbytes/sec] received
# Connection Times (ms)
#              min  mean[+/-sd] median   max
# Connect:        0  277 400.0     87    1004
# Processing:    13  243 269.8    128    1617
# Waiting:       13  243 269.8    128    1617
# Total:         15  521 430.2    505    2617
# ...
```

This type of testing is limited by the servomechanism of `loopback` (`127.0.0.1`); use of (non-loopback) adaptors may yield greater performances.


###### _This product includes GeoLite2 data created by MaxMind, available from_ [_`Maxmind`_].


### Version
0.0.2


License
----
GPLv3

  [**licenses**]: <http://dev.maxmind.com/geoip/geoip2/geolite2/>
  [**`Node.js`**]: <https://nodejs.org/en/>
  [**`npm maxmind`**]: <https://github.com/runk/node-maxmind>
  [_`Maxmind`_]: <https://www.maxmind.com/en/home>
  [**ASN**]: <https://en.wikipedia.org/wiki/Autonomous_system_%28Internet%29>
  [**CLF**]: <https://en.wikipedia.org/wiki/Common_Log_Format>
  [**Percent-Encoded**]: <https://en.wikipedia.org/wiki/Percent-encoding>
  [**`GoAccess`**]: <http://goaccess.io/>
  [_@allinurl_]: <https://github.com/allinurl>
  [`vipi_benchmark.js`]: <https://github.com/vigour-io/vipi/blob/master/vipi_benchmark.js>
  [`ab`]: <https://httpd.apache.org/docs/2.4/programs/ab.html>
  