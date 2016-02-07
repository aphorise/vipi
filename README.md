# `V`isitor `IP` `I`nfo (`vipi`)
###### Relevant [**licenses**] should be properly considered in commercial and none free use cases / environments.

`vipi` is a [**`Node.js`**] utility leveraging [_`Maxmind`_] *__GeoIP__* *DB* files as well [**`npm maxmind`**] to  provide known info of each `IP`'s:
 - Location (Country, City, etc)
 - Time Zones
 - [**ASN**]

`vipi` is a standalone command-line-interface (CLI) utility and it may also serve as a HTTP server / web daemon mode.

The intent with this utility is to provide dual log stores in **C**omman-**L**og-**F**ormat ([**CLF**]) and **JSON** contextual to application and user requirements. Session specific information can be stored and read using automatically named files and or to other another stipulated filename.

All available functionality and features that are by way of CLI options / arguments. or query-strings (get-parameters) in daemon mode, are documented herein.

## Installation
### npm 
Using as a `npm` an `OS` with `Node.js` already installed.

```shell
npm install -g vipi	# global install
npm install vipi	# use in your project
```
### shell (`bash`, `dash`, `sh`)
Bare-bone installation via `shell` (`curl` or `wget`) in case of no `node.js` or `npm`:

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

Once installed `vipi` can be used as a standalone command to execute or further extended as module in your `Node.js` script / project.

### `shell` / Command Line Interface (CLI)

Once installed you may run in *_`shell`_*

```shell
vipi	# // brief help & options
man vipi	#// for manual
```

Example lookup uses:

```shell
vipi 208.67.222.222	# single IP lookup
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

Logs are saved to the absolute specified or relative path from which execution occured (`pwd` / `cwd`).


### `daemon` / HTTP Server

To execute `vipi` as web daemon either `-d` / `--daemon`  or `-dp` / `--dipport` options:are required such as:

```shell
vipi -d		# // default mode
vipi -dp=127.0.0.1:65534	# // custom IP:PORT binding
```

Default daemon options allow for read, write and return to be freely available; thus post launch - visiting the address of the instance in a browser without any option ( or with `!_help` `||` `!_h` parameter) should yield a brief of usage and available parameters. Eg:

```shell
curl 127.0.0.1:59999 	# will output:
```

```
|\-------------------------/|
| ==== Visitor IP Info ==== |
|/_________________________\|
	vipi - v0.0.1

Usage (?!_=...):
	http://127.0.0.1:59999/?!_=ua		# use the inquiring address instead of ip.
	http://127.0.0.1:59999/?!_=208.67.222.222		# query & get results in text/plain

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

Requests made to the server are by way of **Quiry-String**(s) / **Get-Parameter**(s) which are prefixed with **`!_`**. When in default non-referral mode(s) - the `!_=` parameter is used to pass the `IP` being quired.

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222' 	# will output:
```

```shell
[{"ip":"208.67.222.222","date":"2016-02-04T11:40:01.984Z","location":{"countryCode":"US","countryName":"United States","region":"CA","city":"San Francisco","postalCode":"94107","latitude":37.7697,"longitude":-122.39330000000001,"dmaCode":807,"areaCode":415,"metroCode":807,"continentCode":"NA","regionName":"California"},"ua":"curl/7.38.0","timeZone":"America/Los_Angeles","asn":"AS36692 OpenDNS, LLC"}]
```

Multiple `IP`'s may also be passed in sequence using multiple `!_=` values or using a single comma (`,`) seperated value such as:

```shell
curl '127.0.0.1:59999/?!_=208.67.222.222,8.8.8.8' 	# two (2x) IPs comma separated
curl '127.0.0.1:59999/?!_=208.67.222.222&!_=8.8.8.8' 	# serialised.
```


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

Semi or fully silent collector daemon mode(s) are possible with the  `-dn...` & `-dx...` set of parameters; a use case may be:.

 
```
vipi -d -dno -dnr -dnw -dur -dxa	# // only collects - ignoring !_ parameters.
```


### `Node.js` & `npm`

Using `vipi` as an `npm` module is also possible. It ships with the following available methods / functions:

| function | Description |
| ------------- |:-------------:|
| `.lookup(IPs, true)` | Performs lookup based on String to Array of `IP`'s passed, the 2nd parameter where passed enables distance calculations between pairs. |
| `.enableupdates(Hours)` | Enables automatic update checks every 24 Hours where no value is passed |

Simple example:

```
var mVIPI = require("vipi");
var aIPS = mVIPI.lookup(["208.67.222.222","208.67.220.220"]);
mVIPI.enableupdates();
console.log("IP Details:\n", aIPS);
```


#### Error Handeling
Any error(s) incured in the lookup process result in a `String` return containing `ERROR:`.
Other quiried requests which do not result in an error are not returned or indicated in any manner; this does *NOT* prevent or stop the logging of the quireid `IP`'s that were succesfull.


----

### Notes
A performance of `~` `100,000` to `300,000` lookups per second can be expected in most `x64` environments subject to the available resources including the `node.js` version `DDR` specs as well as other architectural consideration. For greater concurrent volume of lookups considered load-balancing / running multiple version of the service.

_This product includes GeoLite2 data created by MaxMind, available from_ [_`Maxmind`_].

### Version
0.0.1


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
