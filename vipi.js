#!/usr/bin/env node
var UID = undefined; /**shorthand undefined*/
var EOL="\n"; var TAB="\t";
var f_SysT1=Date.now()/1000; //start time for measuring init times
var sPROJECT="vipi";
var sVERSION = "v0.0.2";
var bQuiet = false;
var bNoReturn = false; /* MODE: -dno || --dnooutput (7) */
var mVIPIFS, mVIPIFILES, mMAX, mMAXTZ, mPATH, mFS, mHTTP, mURL, mOS, mPS; // npm module references
try
{
	mPATH = require("path");
	mOS = require("os");
	mFS = require("fs");
	mURL = require("url");
	mMAX = require("maxmind");
	mMAXTZ = require("maxmind/lib/time_zone");
	mVIPIFILES = require("./vipi_files");
	mPS = require("child_process");
	exports = module.exports =
	{
		"lookup" : lookup, "enableupdates" : enableupdates,
		"quiet" : bQuiet, "noreturn" : bNoReturn
	};
}
catch (e){ console.log("\nERROR: loading: "+sPROJECT+"\n"+e.toString()+"\nDid you NPM install? - Or are you loading DB files from correct path?"); }

/** Regular Expression IndexOf for Arrays or String
 * Iterates array & returns the index(s) of matches as an array or single integer position; otherwise -1 if not found.
 * @param reg RegEx reg regular expression to test with. E.g. /-ba/gim
 * @return Array|Number position of all occurrence(s) or -1 means not found anywhere. */
Object.defineProperty(Array.prototype, 'indexOfAll',
{
	value: function indexOfAll(reg)
	{
		var a2Return = [];
		for (var i in this) { if (this.hasOwnProperty(i)) {if(this[i].toString().match(reg)){ a2Return.push(i);} } }
		var iL = a2Return.length;
		return (0 === iL) ? Number(-1) : (1 === iL) ? Number(a2Return[0]) : a2Return;
	}
});

/** Zero pads numeric value to required length.
 * @param num Number|String the meric value to be padded.
 * @param size Number the required length
 * @param signed true|false optional indicator for +/- signed
 * @return String padded value with or without sign
 * */
function pad(num, size, signed) { var s = num+""; while (s.length < size) s = "0" + s; return signed ? s : (s > 0 ? "+"+s : "-"+s);}

/** 3 Lettered Zero (0) base array of months. */
var aMonths = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

/** var mNET = require("net"); could use net.isIP(), net.isIPv4() & net.isIPv6() instead of regex */
/* IP:PORT regex for minimal expected addresses */
var rgxIP = /^([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])$/;
var rgxIPPORT = /^([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])\.([1-9]?\d|1\d\d|2[0-4]\d|25[0-5]):([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;
var rgxIPv6 = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(([0-9A-Fa-f]{1,4}:)(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:)))(%.+)?\s*$/;
var rgxIPv6PORT = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(([0-9A-Fa-f]{1,4}:)(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}))|:)))(%.+)?\s*:([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

/** Checks if shell is colour capable. */
function isTerminal()
{	//noinspection JSUnresolvedVariable
	return Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM);
}

/** true|false whether enviroment output (eg stdio) supports colours */
var bTTY = isTerminal();

/** strip TTY ANSI colours for no TTY */
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); }

/** Colour strings: Byte escaped (shell) or Stripped for HTTP plain mode - may be extended for HTML colours. */
/**Red*/var sCR=""; /**Cyan*/ var sCC=""; /**Dark Gray*/ var sCDG=""; /**Green*/ var sCG="";
/**Natural*/ var sCN=""; /**Natural Bold*/ var sCNB=""; /**Purple*/ var sCP="";
/**Yellow*/var sCY=""; /**White*/ var sCW=""; /**Red BG + White Text*/ var sCRBG="";
function setColours()
{
	/**Red*/ sCR=sRaw("\033[31m"); /**Cyan*/ sCC=sRaw("\033[36m");
	/**Dark Gray*/ sCDG=sRaw("\033[90m"); /**Green*/ sCG=sRaw("\033[32m");
	/**Natural*/ sCN=sRaw("\033[0m"); /**Natural Bold*/ sCNB=sRaw("\033[1m");
	/**Purple*/ sCP=sRaw("\033[35m"); /**Yellow*/ sCY=sRaw("\033[33m");
	/**White*/ sCW=sRaw("\x1b[37m"); /** Red BG + White Text*/ sCRBG=""+sRaw("\033[41");
}
setColours();

/** general log substitute for console.log and response to HTTP client as well as process exit support */
function log(msg, exit, res)
{
	if (!bHTTP){ if (!bQuiet) {console.log(msg);} }
	else
	{
		if (UID !== res)
		{
			if (false === res.hasheaderset)
			{	//noinspection JSUnresolvedFunction
				res.writeHead(200, oRHeader); res.hasheaderset = true;
			}
			//noinspection JSUnresolvedFunction
			res.end(bNoReturn ? 0 : msg);
		}
		else { if (!bQuiet){ console.log(msg); } }
	}
	if (UID !== exit) {process.exit(1);}
	///process.on('exit', function() { process.exit(UID === exit ? 0 : exit); });
}
var sVOBJ = "_vipi.obj";
var sVCLF = "_vipi.clf";
var sUOBJ = "_user.obj";
var sUCLF = "_user.clf";
var sDB = process.cwd()+"/vipi_dbs/";
var aDBs = ["GeoIPASNum.dat", "GeoIPASNumv6.dat", "GeoLiteCity.dat", "GeoLiteCityv6.dat", "GeoIP.dat", "GeoIPv6.dat"];
var aDBsVs = ["0", "0", "0", "0", "0", "0"];
var sArgs = ""; /** string presentation of arguments */
var sUage= "";
var bHTTP=false;
var sIP = "127.0.0.1";
var sPORT = "59999";

var aH = process.argv;

/** CLI specific arrays */
var aObjSaveKeys = [];
var aClfSaveKeys = [];

var iArgsIn = 0;
var IPs = [];
var aIPs = [];
var oHTTP;
var sFileDefaultObj = "";
var oRHeader = {};

var bJson = false; /* MODE: -djs" || --djson (6) */
var bReadAccess = true; /* MODE: -dnr || --dnoread (8) */
var bWriteAccess = true; /* MODE: -dnw || --dnowrite (9) */
var bLogToFile = true; /* MODE: -dsa || --dsaveauto (10) */
var bLogAll = true; /* MODE: -dur || --dsaverefering (16) */
var bDeleteAccess = true; /* MODE: -dad || --dallowdelete (4) */
var bNoASN = false; /* MODE: -dxa ||--dxasnumber (11) */
var bNoLocation = false; /* MODE: -dxl || --dxlocation (12) */
var bNoTimeZone = false; /* MODE: -dxt || --dxtimezone(13) */
var bNoIPQuiry = false; /* MODE: -dxq" || --dxquiry (14) */
var bNoUA = false; /* MODE: -dxu" || --dxua (15) */
var bNoCLF = false; /* MODE: -nc || --noclf (17) */
var sDBPath;	/* Custome DB PATHS */

var sL = sCNB + "\n@========================================@" + sCN; /* Line for TUI */
var sMsgWelcome = sCG + "\nSTARTED " + sCN+sCNB + sPROJECT + " " + sVERSION + sCN + " @ " + new Date();
var sMsgInit = sCP + "System ININT " + sCN+sCNB + "in: " + sCG + "%s" + sCN + " seconds";
var sEXITs = ["exit", "SIGHUP", "SIGUSR1", "SIGTERM", "SIGPIPE", "SIGINT", "SIGBREAK", "SIGWINCH", "uncaughtException"];
var args =
[
/*0*/[["-h", " --help", "/?"], TAB+"Shows this screen."],
/*1*/[["-as", "--asnumber", "/as"], "Includes ASN number of IP queried."],
/*2*/[["-b=", "--backups=", "/b="], "DB (default: ./dbs) directory / path to store all MaxMind files."],
/*3*/[["-cd", "--cdistance", "/cd"], "Calculate & Include approximate distances in Kilometres between two IPs."],
/*4*/[["-d", "--daemon", "/d"], "Daemon HTTP mode on "+sIP+":"+sPORT+" by default."],
/*5*/[["-dad", "--dadelete", "/dad"], "(daemon) Allow deletion CLF & JSON files."],
/*6*/[["-dp=", "--dipport=", "/dp="], "(daemon) IP:PORT address of the adaptor to bind to."],
/*7*/[["-djs", "--djson", "/djs"], "(daemon) 'application/json' Content-Type instead of default 'text/plain'."],
/*8*/[["-dno", "--dnoutput", "/dno"], "(daemon) No output or return for any query ignoring all parameters."],
/*9*/[["-dnr", "--dnread", "/dnr"], "(daemon) No Read Access ignoring !_rf / !_ra options."],
/*10*/[["-dnw", "--dnwrite", "/dnw"], "(daemon) No write or !_skc, !_sko or !_sf functionality."],
/*11*/[["-dsa", "--dsaveauto", "/dsa"], "(daemon) Save to automatic date schemed filename (yyyy-mm-dd_mmm) for .clf & .json file."],
/*12*/[["-dxa", "--dxasn", "/dxa"], "(daemon) Exclude ASN from queries or saves by default."],
/*13*/[["-dxl", "--dxlocate", "/dxl"], "(daemon) Exclude Location info from queries or saves by default."],
/*14*/[["-dxt", "--dxtime", "/dxt"], "(daemon) Exclude timezone from queries or saves by default."],
/*15*/[["-dxq", "--dxquiry", "/dxq"], "(daemon) Used with -dur to disable !_= functionality for ip lookup string."],
/*16*/[["-dxu", "--dxua", "/dxu"], "(daemon) Exclude User-Agents from queries or saves by default."],
/*17*/[["-dur", "--duserefer", "/dur"], "(daemon) Use details from referal / dialling cURL."],
/*18*/[["-nc", "--noclf", "/nc"], "(daemon & cli) Disables CLF related saves with -sa & -sf parameters."],
/*19*/[["-nu", "--noupdates", "/nu"], "No Maxmind DB updates use existing backup files / path."],
/*20*/[["-sa", "--saveauto", "/sa"], "Save to file named using date: 'IP [DATE] KEY' (KEY optional) in .clf & .json file."],
/*21*/[["-sf=", "--savefile=", "/sf="], "Save like -sa: using specified file prefix name for .clf & .json saves."],
/*22*/[["-skc=", "--skclf=", "/skc="], "Save KEY clf string shell-escaped string eg: '200 \"GET / HTTP/1.1\"' to save."],
/*23*/[["-sko=", "--skobj=", "/sko="], "Save KEY object json string shell-escaped eg '{\"eg\":1}' to save."],
/*24*/[["-tz", "--timezone", "/tz"], "Includes time-zone of IP location queried."],
/*25*/[["-udb", "--updatedb", "/udb"], "Update Maxmind DB's."],
/*26*/[["-q", "--quiet", "/q"], TAB+"Quiet mode with no error or default header output."],
/*27*/[["-v", "--version", "/v"], "Output version information & exit."],
/*28*/[["-xi", "--xinfo", "/xi"], "Show OS / Node.js / Maxmind DB related info & exit."]
];
/** Header String appropraitely set for CLI & HTTP Plain mode. Can be extended for HTML as well.*/
function stringHeader()
{
	var sR = "";
	sR+= sCDG+"|\\¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯/|"+EOL+sCN;
	sR+= sCDG+"| ==== "+sCNB+sCY+"Visitor"+sCNB+sCC+" IP"+sCG+" Info"+sCN+sCDG+" ==== |"+EOL;
	sR+= sCDG+"|/_________________________\\|"+EOL+sCN;
	sR+= sCN+TAB+sCNB+sCW+sPROJECT+sCN+" - "+sCDG+sVERSION+EOL+sCN;
	return sR;
}
/** HTTP deamon mode header string adjuster for quiry-string parameter addition and removal of non-related args.*/
function appHeaderString()
{	// adjust colours to current mode.? offset to init // setColours();
	sArgs ="";
	sUage = EOL + stringHeader();
	if (bHTTP)
	{
		var cpya = JSON.parse(JSON.stringify(args));
		var a1 = cpya.splice(20, 5);
		a1.push(args[args.length-1]);
		args = a1;
		args.unshift([["-tp", "--textplain", "/tp"], "Return content-type: 'text/plain'."]);
		args.unshift([["-sua", "--saveua", "/sua"], "Include requesting users agent in save."]);
		args.unshift([["-rf=", "--readfile=", "/rf="], "Contents of log file to read & return."]);
		args.unshift([["-ra", "--readauto", "/ra"], "Return content-type: 'application/json'"]);
		args.unshift([["-nc", "--noclf", "/nc"], "Include requesting users agent in save."]);
		args.unshift([["-nr", "--noreturn", "/nr"], "No output or return."]);
		args.unshift([["-nu", "--noua", "/nu"], TAB+"Include requesting users agent in save."]);
		args.unshift([["-ls", "--listsaves", "/ls"], "Lists all available user obj json files."]);
		args.unshift([["-js", "--json", "/j"], TAB+"Return content-type: 'application/json' instead of 'text/plain'."]);
		args.unshift([["-h", "--help", "/h"], TAB+"Shows this help page."]);
		args.unshift([["-da", "--deleteall", "/da"], "Deletes all clf & obj file(s) resetting to new."]);
		args.unshift([["-df=", "--deletefile=", "/df="], "Delete obj & clf named file(s)."]);
		args.unshift([["-cd", "--cdistance", "/cd"], "Calculate & Include approximate distances in Kilometres between IPs pairs."]);
		args.unshift([["-as", "--asnumber", "/as"], "Includes ASN number of IP queried."]);
//		a1.push([["-", "--E", "/" ], "Example"]);
	}

	for (var iX=0; iX < args.length; ++iX)
	{
		if (bHTTP)
		{
			args[iX][0][0] = args[iX][0][0].replace(/-/g, "!_");
			args[iX][0][1] = args[iX][0][1].replace(/--/g, "!_");
		}
		sArgs+=TAB+args[iX][0][0]+", "+args[iX][0][1]+(bHTTP?"":", "+args[iX][0][2])+TAB+args[iX][1]+TAB+" "+EOL;
		sArgs = sArgs.replace(/shell-escaped/g, "URL-Encoded");
	}

	if (bHTTP)
	{
		sUage+= EOL+"Usage (?!_=...):"+EOL;
		sUage+= TAB+"http://"+sCNB+sIP+":"+sPORT+sCN+"/?!_=ua"+TAB+TAB+"# use the inquiring address instead of ip."+EOL;
		sUage+= TAB+"http://"+sCNB+sIP+":"+sPORT+sCN+"/?!_=208.67.222.222"+TAB+TAB+"# quiry & get results in text/plain"+EOL;
		sUage+= TAB+"http://"+sCNB+sIP+":"+sPORT+sCN+"/?!_=208.67.222.222,8.8.8.8,8.8.4.4"+TAB+"# multiple ip loolup."+EOL;
		sUage+= TAB+"http://"+sCNB+sIP+":"+sPORT+sCN+"/?!_=8.8.8.8&!_sa&!_sko=%7B%7D"+TAB+"# Auto save queried IP + key to file."+EOL;
		sUage+= EOL+"(&) Quiry String / Get-Parameters:"+EOL+sArgs+EOL;
	}
	else
	{
		sUage+= EOL+"Usage:"+EOL;
		sUage+= TAB+sCNB+sPROJECT+sCN+" [options] 208.67.222.222 "+EOL;
		sUage+= EOL+"Options:"+EOL+sArgs;
	}

	if (bHTTP)
	{
		sUage = sUage.replace(/, /g, ","+TAB+" ");
		sUage = sUage.replace(/¯/g, "-");
	}
	else{ sUage+= EOL+"See: "+TAB+sCW+sCNB+"man "+sPROJECT+sCN+TAB+"# for full details"+EOL; }
}

function showHelp(msgExtra, iExitCode, res)
{
	if (UID === sUage || "" === sUage) { appHeaderString(); }
	log(sUage+ ((UID !== msgExtra)?msgExtra:""), iExitCode, res);
}

/** closure callback that reads tail of file to extrapolate version info */
function cbcFileDBRead(sFile)
{
	return function (err, bytesRead, sTail)
	{
		var sVer = sTail.toString();
		var aClean = sVer.split(" Copyright (c) ")[0].split(" ");
		aDBsVs[aDBs.indexOf(sFile)] = "GEO"+aClean[0].split("GEO")[1]+" "+aClean[1]+" "+aClean[2]+" "+aClean[3];
	};
}
/** closure callback open file for subsequent read of tail */
function cbcFileReadTail(sFile, iFileSize)
{
	return function(err, fd)
	{
		var sTail = new Buffer(81);
		var iB = iFileSize-88;
		//noinspection JSUnresolvedFunction
		mFS.read(fd, sTail, 0, 81, iB, cbcFileDBRead(sFile));
	};
}
/** closure callback to get FileStatus for DB related reads */
function cbcFileStat(sFile)
{
	return function(err, stats)
	{
		if (err) { log(sCR+"ERROR:"+sCN+" unable to get DB version for :"+sFile+" "+sCDG+err.toString()+sCN); return ; }
		var iFileSize = stats["size"];
		//var fd =
		mFS.open(sFile, "r", cbcFileReadTail(sFile, iFileSize));
	};
}
/** asynchronously read all DB files */
function UpdateDBVersions()
{	/* async invoke all reads needed to get files */
	for (var iX=0; iX < aDBs.length; ++iX)
	{	//noinspection JSUnresolvedFunction
		mFS.stat(aDBs[iX], cbcFileStat(aDBs[iX]));
	}
}
/** Returns All Version info for Maxmind files which should have already been gathered */
function ReturnMaxMindDBVersions()
{
	var sReturn = [];
	for (var iX=0; iX < aDBs.length; ++iX)
	{
		var x = aDBs[iX].split("/")[aDBs[iX].split("/").length-1];
		var oP=[];
		oP.push(x);
		oP.push(aDBsVs[iX]);
		sReturn.push(oP);
	}
	return sReturn;
}

/** @return {string} */
function XInfo()
{
	/* TSR MODE get this async for later use */
	var sDbs = ReturnMaxMindDBVersions();
	//noinspection JSUnresolvedVariable
	var sReturn = "node.js: "+process.versions.node + EOL;
	//noinspection JSUnresolvedVariable
	sReturn+= "v8: "+process.versions.v8 + EOL;
	//noinspection JSValidateTypes,JSUnresolvedFunction
	sReturn+=mOS.type()+" ("+mOS.platform()+") "+mOS.release()+EOL;
	//noinspection JSUnresolvedFunction,JSUnresolvedVariable
	sReturn+="CPU: " + mOS.cpus().length+"x "+mOS.cpus()[0].model+" "+mOS.cpus()[0].speed+" MHz"+EOL;
	//noinspection JSUnresolvedFunction
	sReturn+="memory-all: "+mOS.totalmem()+" (bytes)"+EOL;
	//noinspection JSUnresolvedFunction
	sReturn+="Memory-free: "+mOS.freemem()+" (bytes)"+EOL;
	sReturn+=sDbs.join(EOL)+EOL;
	return sReturn;
}

/** Quit / Ending Message to display for time taken, etc. @param Number integer exit code. */
function clDestruct(iCode)
{	/* on definable exit codes show msg */
	return function(i)
	{
		var sQUIT = "";
		if (UID === iCode) return ;
		if (0 !== iCode && 0 !== i)
		{
			bTTY = isTerminal();
			setColours();
			sQUIT= 0 !== iCode ? EOL+"EXITING with: "+sCC+sEXITs[iCode]+sCN+" code: "+sCC+iCode : ""+sCN;
			sQUIT+=EOL+"TSR "+sCNB+"Time"+sCN+" in Seconds: " +sCNB+(Date.now()/1000-f_SysT1).toString()+sCN;
		}
		if (!bQuiet && bHTTP) { log(sQUIT); }
		process.exit(0);
	}
}

/** approximate seperation between to IP's based on locations */
function calculateDistances(aRet)
{
	for (var iX=0; iX < aRet.length; ++iX)
	{
		if (0 === iX%2)
		{
			if (UID !== aRet[iX + 1])
			{
				var sKm = aRet[iX].location.distance(aRet[iX+1].location);
				aRet[iX].distance = { "km" : sKm, "to_ip" : aRet[iX+1].ip };
				aRet[iX+1].distance = { "km" : sKm, "to_ip" : aRet[iX].ip };
			}
		}
	}
}

/**---------------------------------------
 * MAIN: Initialiser Function.
 * loads former files collected on last run
 * or before stop. @param Object request.
 *---------------------------------------*/
function initLoad()
{
	var a2Check = [];
	var iX; // GENERAL COUNTER
	var sPathSaveFile;
	var bNewDBPath = false;

	for (iX = 0; iX < sEXITs.length; ++iX) { process.on(sEXITs[iX], clDestruct(iX) ); }

	/* where -v || --version || /? is present */
	if (-1 !== aH.indexOf("-v") || -1 !== aH.indexOf("--version") || -1 !==aH.indexOf("/v")) { log(sVERSION, 0); }

	if (2 === aH.length && !module.parent){ showHelp("", 0); }
	/* where '-h' or '--help' or '/?' is present */
	if (-1 !== aH.indexOf("-h") || -1 !== aH.indexOf("--help") || -1 !==aH.indexOf("/?")) { showHelp("", 0); }

	for (iX=2; iX < aH.length; ++iX)
	{
		// IPv4 or IPv6 for match ealier - if not then gibberish so exit
		if ( rgxIP.test(aH[iX]) || rgxIPv6.test(aH[iX]) )
		{
			a2Check.push({ "ip": aH[iX], "v6": rgxIPv6.test(aH[iX])});
			continue;
		}

		var iBeforeCheck = iArgsIn;
		for (var iY=0; iY < args.length; ++iY)
		{
			var sArgument = aH[iX];

			/* check for equal (=) type arguments */
			if (-1 !== sArgument.indexOf("="))
			{
				sArgument = aH[iX].split("=")[0]+"=";
				if (sArgument === "-b=" || sArgument === "--backups=" || sArgument === "/b=")
				{
					sDBPath = aH[iX].split("=")[1];
					if (UID === sDBPath)
					{ log(sCR+EOL+sArgument+sCN+" <- is empty! MUST refernce valid path eg: -b=/home/user/vipi_db/"+EOL, 11); }
					else
					{
						if ("/" !== sDBPath[sDBPath.length-1])
						{	//noinspection JSUnresolvedVariable
							sDBPath+="/";
						}
						sDB = sDBPath; // set path for DB to whats prefered.
					}
					++iArgsIn; break;
				}
				else if (sArgument === "-sf=" || sArgument === "--savefile=" || sArgument === "/sf=")
				{
					sPathSaveFile = aH[iX].split("=")[1];
					if (UID === sPathSaveFile)
					{ log(sCR+EOL+sArgument+sCN+" <- is empty! MUST refernce valid file eg: -sf=visitor_id1.json"+EOL, 13); }
					++iArgsIn; break;
				}
				else if (sArgument === "-skc=" || sArgument === "--skclf=" || sArgument === "/skc=")
				{
					var sKeyClf = aH[iX].split("=")[1];
					if (UID === sKeyClf)
					{ log(sCR+EOL+sArgument+sCN+" <- is empty! MUST contain valid string."+EOL, 13); }
					aClfSaveKeys.push(sKeyClf);
					++iArgsIn; break;
				}
				else if (sArgument === "-sko=" || sArgument === "--skobj=" || sArgument === "/sko=")
				{
					var sKeyObj = aH[iX].split("=")[1];
					if (UID === sKeyObj || "" === sKeyObj)
					{ log(EOL+sArgument+sCN+" <- is empty! MUST contain valid object json string."+EOL, 14); }

					try
					{
						var oKeyObj = JSON.parse(sKeyObj);
						if ( "object" !== typeof(oKeyObj) || null === oKeyObj )
						{ log(sCR+EOL+"ERROR: "+sCN+sArgument+"'"+sCNB+sKeyObj+sCN+"' is NOT a valid JSON object."+EOL, 15); }
						aObjSaveKeys.push(oKeyObj);
						++iArgsIn; break;
					}
					catch(e) { log(sCR+EOL+"ERROR: "+sCN+sArgument+"'"+sCNB+sKeyObj+sCN+"' is NOT a valid JSON object."+EOL, 16); }
				}
				else if (sArgument === "-dp=" || sArgument === "--dipport=" || sArgument === "/dp=")
				{
					var sExts = aH[iX].split("=")[1];
					if (UID === sExts)
					{ log(sCR+EOL+sArgument+sCN+" <- is empty! MUST reference a valid IP:PORT of an adaptor to bind to."+EOL, 17); }
					else
					{	// check whether valid IPv4 or IPv6 address is passed
						var bIPv4 = rgxIPPORT.test(sExts);
						var bIPv6 = rgxIPv6PORT.test(sExts);
						if (!bIPv4 && !bIPv6)
						{
							log(sCR+EOL+"Invalid Address: "+ sCN + sCNB + sExts + sCN + " <- Require VALID IPv4 or IPv6."+EOL+sCN, 18);
						}
						sPORT = sExts.split(":")[sExts.split(":").length-1];

						if (!bIPv6) { sIP = sExts.split(":").splice(0, sExts.split(":").length-1).join(""); }
						else { sIP = sExts.substring(0, sExts.indexOf(":"+sPORT)); }
						args[6].push(true);

					}
					++iArgsIn; break;
				}
				else { log(EOL+sCR+sArgument+sCN + sCNB + "<- equative argument not supported!\n"+sCN, 19); }
			}

			if (-1 !== args[iY][0].indexOf(sArgument)) { args[iY].push(true); ++iArgsIn; break; }
		}

		if (iBeforeCheck === iArgsIn)
		{	//process.argv.splice(2, 7, 0)
			log(EOL+"Invalid parameter: '"+sCR+sCNB+ process.argv.splice(2, 7, 0)+sCN+"'"+EOL, 1);
		}
	}

	/* MODE: -nu && --dbu CLASHING Update & no update flags*/
	if (UID !== args[25][2] && UID !== args[19][2])
	{
		var msg = sCR+EOL+"Invalid / Clashing options: "+sCN+sCNB+args[25][0]+ " , " +args[19][0] + sCN + "; can NOT be in NO-Update & Update modes at once."+EOL+sCN;
		log(msg, 20);
	}

	/* MODE: -q || --quiet (18) */
	if (UID !== args[26][2]) { bQuiet = true; }

	try
	{	//noinspection JSUnresolvedFunction
		mFS.accessSync(sDB);
		//noinspection JSUnresolvedFunction
		var files = mFS.readdirSync(sDB);
		var Found = files.indexOfAll(".dat.gz");
		if ("object" === typeof(Found) && UID !== Found.length)
		{
			if (6 !== Found.length) { bNewDBPath = true; }
			else
			{
				if
				(
					!(
						-1<files.indexOf(aDBs[0]) || -1<files.indexOf(aDBs[1])||-1<files.indexOf(aDBs[2]) ||
						-1<files.indexOf(aDBs[3])|| -1<files.indexOf(aDBs[4]) || -1<files.indexOf(aDBs[5])
					)
				)
				{ bNewDBPath = true; }
			}
		}
		else { bNewDBPath = true; }
	}
	catch(e)
	{	// in CLI mode with single lookups
		if (!(a2Check.length !== 0 && UID === args[4][2] && UID === args[6][2] && UID === sDBPath))
		{
			if (!(3 === aH.length && UID !== args[25][2]) || (UID !== args[4][2] || UID !== args[6][2]))
			{
				try
				{ //noinspection JSUnresolvedFunction
					mFS.mkdirSync(sDB);
					bNewDBPath = true;
				}
				catch(e2)
				{
					log(sCR+EOL+sDB+sCN+" <- Maxmind DB Path is not valid or accessible!"+EOL+sCDG+e.toString()+sCN, 12);
				}
			}
		}
	}

	// when not in deamon modes and not using custom paths use default dbs shipped with module.
	if (a2Check.length !== 0 && UID === args[4][2] && UID === args[6][2] && UID === sDBPath || (3 === aH.length && UID !== args[25][2]))
	{
		sDB= __dirname+"/vipi_dbs/";
	}

	for (iX=0; iX < aDBs.length; ++iX) { aDBs[iX] = sDB+aDBs[iX]; }

	try
	{	/* MODE: -d || --daemon || -dp || --dipport modes (3,4) */
		if (UID !== args[4][2] || UID !== args[6][2]) { log(stringHeader()+sMsgWelcome); }

		// Custom path & noupdate disabled by default.
		if (UID !== args[25][2] || (UID === args[19][2] && bNewDBPath && UID !== sDBPath) || (UID !== args[4][2] || UID !== args[6][2]))
		{
			var sExec = "vipi_files -i "+sDB;
			if (bQuiet) { sExec+=" -q"; }
			var psOptions = { stdio: [0, 1, process.stdout], cwd : process.cwd(), env: {"LC_ALL":"C"} };
			try
			{	//noinspection JSUnresolvedFunction
				mPS.execSync(sExec, psOptions);
				if (UID !== args[4][2] || UID !== args[6][2] || UID !== sDBPath || (3 === aH.length && UID !== args[25][2]))
				{
					log("Successfully installed / updated files at path: "+sDB);
				}
			}
			catch(e)
			{
				bQuiet = false;
				log(EOL+sCR+"ERROR: "+sCN+"Could not initiate DB files at: "+sDBPath+EOL+sCDG+e.toString()+sCN, 13);
			}
		}

		/* MODE: Update / Custome install only */
		if (UID === args[19][2] && (3 === aH.length || (4 === aH.length && UID !== sDBPath)))
		{
			if (UID !== args[4][2] && UID !== args[6][2] ) { log("\nInstalled / Updated Files to: "+sDB+EOL); }
		}

		if (0 !== a2Check.length || (UID !== args[4][2] || UID !== args[6][2]) || module.parent)
		{
			//noinspection JSUnresolvedFunction
			mMAX.init(aDBs, {"indexCache": true, "checkForUpdates": true});
			if (UID !== sDBPath) { log(EOL+"Using custom DB path: "+sDB+EOL); }
		}
	}
	catch(err)
	{
		bQuiet = false;
		log(EOL+sCR+"ERROR: "+sCN+"loading Maxmind DB iles!"+EOL+sCDG+err.toString()+EOL+sCN, 20);
	}

	if ( 3 === aH.length && UID !== args[2][2] ){ log(EOL+"Succesfully tested Maxmind DB loading from custom path: "+sCNB+sDBPath+sCN+EOL, 0); }

	/* MODE: -tz || --timezone (27) */ // if (UID !== args[27][2]) { bNoTimeZone = false; }
	/* MODE: -asn || --asnumber (2) */ // if (UID !== args[1][2]) { bNoASN = false; }

	/* MODE: -xi | --xinfo modes (20) */
	if (UID !== args[28][2]){ UpdateDBVersions(); setTimeout(function (){ log(EOL+XInfo(), 0); }, 48); }

	if (0 < a2Check.length)
	{
		var aRet = [];
		for (iX=0; iX < a2Check.length; ++iX)
		{
			var oRet = {};
			oRet.ip = a2Check[iX].ip;
			oRet.date = new Date();

			if (a2Check[iX].v6)
			{	//noinspection JSUnresolvedFunction
				oRet.location = mMAX.getLocationV6(a2Check[iX].ip);
			}
			else
			{	//noinspection JSUnresolvedFunction
				oRet.location = mMAX.getLocation(a2Check[iX].ip);
			}

			if (null === oRet.location || UID === oRet.location)
			{	/* Dont write ... return. */
				log(sCR+"ERROR: "+sCN+a2Check[iX].ip+sCNB+" invalid address."+EOL+sCN, UID, 1);
			}

			if (!bNoASN)
			{	//noinspection JSUnresolvedFunction
				oRet.asn = (a2Check[iX].v6) ? mMAX.getOrganizationV6(oRet.ip) : mMAX.getOrganization(oRet.ip);
			}

			if (!bNoTimeZone)
			{	//noinspection JSUnresolvedVariable
				oRet.timeZone = mMAXTZ(oRet.location.countryCode, oRet.location.region);
				if (UID === oRet.timeZone) { oRet.timeZone="unrecognised-timezone"; }
			}

			if (UID !== typeof(aObjSaveKeys[iX])) { oRet.keyobject = aObjSaveKeys[iX]; }
			if (UID !== typeof(aClfSaveKeys[iX])) { oRet.keyclf = aClfSaveKeys[iX]; }
			aRet.push(oRet);
		}

		/* MODE: -cd || --cdistance (2) */
		if (UID !== args[3][2]) { calculateDistances(aRet); }

		/* MODE: -sa || --saveauto (19) | -sf || --savefile (20) */
		if (UID !== args[20][2] || (UID !== args[21][2]))
		{
			var aCLF = [];

			if (0 < aRet.length)
			{
				aCLF = [aRet.length+1];
				for (iX=0; iX < aRet.length; ++iX)
				{
					var dX = aRet[iX].date;
					var sDate = dX.getDate() + "/" + aMonths[dX.getMonth()]+ "/" + dX.getFullYear();
					sDate+= ":" + dX.getHours() + ":" + pad(dX.getMinutes(), 2, true) + ":" + pad(dX.getSeconds(), 2, true);
					sDate+= " " + pad(dX.getTimezoneOffset()/60*-100, 4, false);
					if (UID !== a2Check[iX].keyclf) { aRet[iX].keyclf = a2Check[iX].keyclf; }

					var sCLF = aRet[iX].keyclf ? " " + aRet[iX].keyclf : "";
					//noinspection JSUnresolvedVariable
					var sLocation = UID !== aRet[iX].location ?
					" \"" + aRet[iX].location.countryCode + "/" + aRet[iX].location.city+"/" +
					aRet[iX].location.latitude + "/" +aRet[iX].location.longitude+"\""
						: "";
					aCLF[iX] = aRet[iX].ip + " ["+sDate+"]" + sCLF;
					aCLF[iX]+= UID !== aRet[iX].ua ? " \"" + aRet[iX].ua +"\"" : "";
					aCLF[iX]+= UID !== sLocation ? sLocation : "";
					aCLF[iX]+= UID !== aRet[iX].timeZone ? " \""+aRet[iX].timeZone+"\"" : "";
					aCLF[iX]+= UID !== aRet[iX].asn ? " \""+aRet[iX].asn+"\"" : "";
					aCLF[iX]+= "\n";
				}
			}
			// -sa || --saveauto
			if (UID !== args[20][2])
			{
				if (!args[17][2]) { writeCLFFile(aCLF); }
				/** remove keyclf as its redundant in object */
				for (iY=0; iY < aRet.length; ++iY) { delete(aRet[iY].keyclf); }
				writeOBJFile(aRet);
			}
			else
			{
				if (!args[18][2]) { writeCLFFile(aCLF, sPathSaveFile); }
				/** remove keyclf as its redundant in object */
				for (iY=0; iY < aRet.length; ++iY) { delete(aRet[iY].keyclf); }
				writeOBJFile(aRet, sPathSaveFile);
			}
		}
		bQuiet = false;
		// REMOVE EXIT CODE FOR COMBINED MODE
		log(JSON.stringify(aRet, null, "  "));
	}

	/* MODE: -d || --daemon || -dp || --dipport modes (3,4) */
	if (UID !== args[4][2] || UID !== args[6][2] )
	{
		bHTTP = true;
		bTTY = false; //appHeaderString();
		/** MODE: -dad" || --dallowdelete */
		bDeleteAccess = UID !== args[5][2];
		/** MODE: -dnw || --dnowrite */
		bWriteAccess = UID === args[10][2];
		/** MODE: -dsa || --dsaveauto */
		bLogToFile = UID !== args[11][2];
		/** MODE: -dur || --dsaverefering */
		bLogAll = UID !== args[17][2];
		/** MODE: -dnr || --dnoread */
		bReadAccess = UID === args[9][2];
		/** MODE: -dxq || --dxquiry */
		bNoIPQuiry = UID !== args[15][2];
		try
		{
			mHTTP = require("http");
			//noinspection JSUnresolvedFunction
			oHTTP = mHTTP.createServer(HttpHandle).listen(sPORT, sIP);
			oHTTP.on("error", function(e)
			{
				bHTTP = false;
				if ("EACCES" === e.code || "EADDRINUSE" === e.code)
				{
					log(sCR+"ERROR:"+sCN+" Can not bind to requested: "+sCNB+sIP+":"+sPORT+sCN+EOL+sCDG+e.toString()+sCN, 1);
				}
			});
			UpdateDBVersions();

			if (UID === args[19][2]) { enableupdates(); }

			if (!bQuiet)
			{
				var fSecs=Date.now()/1000-f_SysT1;
				console.log(sMsgInit, fSecs, sL);
				//noinspection JSUnusedAssignment
				bTTY = isTerminal();
				setColours();
				log("Server running at "+sCW+sCNB+"http://"+sIP+sCN+":"+sCNB+sCW+sPORT+"/"+sCN);
				bTTY=false;
				setColours();
			}
		}
		catch (e) { log(e.toString()); }
	}
}

function HttpHandle(req, res)
{	/* 200 back if requested method is not GET /... */
	res.hasheaderset = false;
	//noinspection JSUnresolvedVariable
	var _GET = mURL.parse(req.url,true).query;

	/* MODE: -djs || --djson - OVERLOOK RIGHTS */
	bJson = (UID === _GET["!_js"] && UID === _GET["!_json"]) ? UID !== args[6][2] : true ;
	if (bJson) { bJson = (UID === _GET["!_pt"] && UID === _GET["!_plaintext"]) ? UID !== args[6][2] : false ; }
	/* MODE: -dno || --dnooutput - OVERLOOK RIGHTS */
	bNoReturn = UID === _GET["!_nr"] && UID === _GET["!_noreturn"] ? UID !== args[8][2] : true;
	/* MODE: -nc || --noclf (9) */
	bNoCLF = UID !== bWriteAccess ? !(UID === _GET["!_nc"] && UID === _GET["!_noclf"]) : UID !== args[18][2];
	/* MODE: -dxa ||--dxasnumber (11) */
	bNoASN = bWriteAccess ? !(UID === _GET["!_as"] && UID === _GET["!_asnumber"]) : UID !== args[12][2];
	/* MODE: -dxl || --dxlocation (12) */
	bNoLocation = bWriteAccess ? !(UID === _GET["!_l"] && UID === _GET["!_location"]) : UID !== args[13][2];
	/* MODE: -dxt || --dxtimezone(13) */
	bNoTimeZone = bWriteAccess ? !(UID === _GET["!_tz"] && UID === _GET["!_timezone"]) : UID !== args[14][2];
	/* MODE: -dxu" || --dxua (15) */
	bNoUA = bWriteAccess ? !(UID === _GET["!_ua"] && UID === _GET["!_useragent"]) : UID !== args[16][2];
	/** indicate all deletion action */
	var bDeleteAll = bDeleteAccess && (UID !== _GET["!_da"] || UID !== _GET["!_deleteall"]);

	var bOUTPUT = false;
	var bObjFileWrite = false;
	var aCLF = [];
	var iX, iY=0; //GENERAL COUNTERS

	var a2s;
	IPs = bNoIPQuiry ? UID : _GET["!_"];
	aIPs = [];
	var a2Check = [];
	/** CLI specific arrays */
	aObjSaveKeys = [];

	var xff = req.headers["x-forwarded-for"];
	var xc = req.headers["x-client"];

	oRHeader =
	{
		"Content-Type": bJson ? "application/json" : "text/plain",
		"Cache-Control": "no-cache", "Transfer-Encoding": "chunked", "Connection": "close"
	};

	if (UID !== req.headers["host"])
	{
		sIP = req.headers["host"];
		var iPortPos = sIP.lastIndexOf(":"+sPORT);
		if (-1 !== iPortPos && (sPORT.length === sIP.length-(iPortPos+1))) { sIP = sIP.substring(0, iPortPos); }
	}

	if ("GET" !== req.method)
	{	/* reduce header chunk indicator not needed. */
		res.hasheaderset = true;
		//noinspection JSUnresolvedFunction
		res.removeHeader("transfer-encoding");
		res.end(0);
	}

	/* default GET / then show help. */
	if (!bNoReturn && 0 === Object.keys(_GET).length || (!bLogAll && (UID !== _GET["!_h"] || UID !== _GET["!_help"])))
	{
		showHelp(UID, UID, res); return;
	}

	/* !_xi or !_xinfo return enviroment info discarding all else. */
	if (bReadAccess && UID !== _GET["!_xi"] || UID !== _GET["!_xinfo"])
	{
		var sReturn = XInfo();
		delete(oRHeader["Transfer-Encoding"]);
		oRHeader["Content-Length"] = sReturn.length;
		log(sReturn, UID, res);
		return ;
	}

	/* !_ls or !_listsaves pass to function to return listing. */
	if (bReadAccess && UID !== _GET["!_ls"] || UID !== _GET["!_listsaves"]) { returnFilesList(res); return ; }

	if (bReadAccess && UID !== _GET["!_ra"] || UID !== _GET["!_readauto"])
	{
		if ("" !== _GET["!_ra"] && "" !== _GET["!_readauto"])
		{
			log(sCR+"ERROR: "+sCN+sCNB+"!_ra="+_GET["!_ra"]+sCN+" <- equative argument not valid."+EOL, UID, res);
		}
		else if (UID !== _GET["!_rf"] || UID !== _GET["!_readfile"])
		{
			log(sCR+"ERROR: "+sCN+"Can not have both !_rf & !_ra"+EOL, UID, res);
		}
		else { bOUTPUT = bReadAccess; }
	}

	if (bReadAccess && UID !== _GET["!_rf"] || UID !== _GET["!_readfile"])
	{
		if
		(
			("" === _GET["!_rf"] || "string" !== typeof(_GET["!_rf"])) &&
			("" === _GET["!_readfile"] || "string" !== typeof(_GET["!_readfile"]))
		)
		{
			log(sCR+"ERROR: "+sCN+"MUST provide filename with !_rf of log eg !_rf=bla.log"+EOL, UID, res);
		}
		else { bOUTPUT = bReadAccess; }
	}

	if (bWriteAccess && UID !== _GET["!_sa"] || UID !== _GET["!_saveauto"])
	{
		if ("" !== _GET["!_sa"] && "" !== _GET["!_saveauto"] )
		{
			log(sCR+"ERROR: "+sCN+"!_sa=... <- equative argument not valid."+EOL, UID, res);
		}
		else { bLogToFile = bWriteAccess; }
	}

	if (bWriteAccess && UID !== _GET["!_sf"] || UID !== _GET["!_savefile"])
	{
		if
		(
			("" === _GET["!_sf"] || "string" !== typeof(_GET["!_sf"])) &&
			("" === _GET["!_savefile"] || "string" !== typeof(_GET["!_savefile"]))
		)
		{
			log(sCR+"ERROR: "+sCN+"MUST provide filename with !_sf of log eg !_sf=SESSION-ID"+EOL, UID, res);
		}
		else { bObjFileWrite = bWriteAccess; }
	}

	if (bDeleteAll && ( bOUTPUT && ( UID === _GET["!_nr"] && UID === _GET["!_noreturn"])))
	{
		log(sCR+"ERROR: "+sCN+"Can not DELETE-ALL & perform other operations inline."+EOL, UID, res);
	}

	if (bLogAll)
	{
		if ((UID === IPs || "" === IPs) && true !== bOUTPUT)
		{
			if (UID === xff && UID === xc)
			{	//noinspection JSUnresolvedVariable
				IPs = req.connection.remoteAddress;
			}
			else { IPs = UID === xc ? xff : xc; }
		}
	}

	if ((UID === IPs || "" === IPs) && true !== bOUTPUT)
	{ log(sCR+"ERROR: "+sCN+"Can not have blank / empty request. IP's eg: !_=8.8.8.8", UID, res); }
	/* single or comma separated */
	else if ("string" === typeof(IPs))
	{
		if ("ua" === IPs)
		{
			if (UID === xff && UID === xc)
			{	//noinspection JSUnresolvedVariable
				IPs = req.connection.remoteAddress;
			}
			else { IPs = UID === xc ? xff : xc; }
		}

		if (-1 !== IPs.indexOf(","))
		{
			a2s = IPs.split(",");
			for (iX=0; iX < a2s.length; ++iX)
			{
				if (rgxIP.test(a2s[iX]) || rgxIPv6.test(a2s[iX]))
				{
					a2Check.push({ "ip": a2s[iX], "v6": rgxIPv6.test(a2s[iX])});
				}
				else { log(sCR+"ERROR: "+sCN+sCNB+a2s[iX]+sCN+" invalid IPv4/IPv6 address."+EOL, UID, res); }
			}
		}
		else
		{	//noinspection JSCheckFunctionSignatures
			if (rgxIP.test(IPs) || rgxIPv6.test(IPs))
			{	//noinspection JSCheckFunctionSignatures
				a2Check.push({"ip": IPs, "v6": rgxIPv6.test(IPs)});
			}
			else { log(sCR+"ERROR: "+sCN+sCNB+IPs+sCN+" invalid IPv4/IPv6 address."+EOL, UID, res); }
		}
	}
	else if ("object" === typeof(IPs))
	{
		for (var iI in IPs)
		{
			if (!IPs.hasOwnProperty(iI)) { continue; }
			if (rgxIP.test(IPs[iI]) || rgxIPv6.test(IPs[iI]))
			{
				a2Check.push({"ip":IPs[iI], "v6": rgxIPv6.test(IPs[iI])});
			}
			else
			{
				log("ERROR: "+IPs[iI]+" invalid IPv4/IPv6 address."+EOL, UID, res);
			}
		}
	}

	if (bWriteAccess && UID !== _GET["!_skc"] || UID !== _GET["!_skclf"])
	{
		if (0 === a2Check.length)
		{
			log(sCR+"ERROR:"+sCN+" MUST specify IP address with !_=... currently: !_ is invalid or empty."+EOL, UID, res);
		}
		else
		{
			var SKs = UID !== _GET["!_skc"] ? _GET["!_skc"] : _GET["!_savekeyclf"];
			if (("" === SKs || ("string" !== typeof(SKs)) && "object" !== typeof(SKs)))
			{ log(sCR+"ERROR:"+sCN+" MUST provide key value eg: !_skc=something"+EOL, UID, res); }
			else
			{
				if ("string" === typeof(SKs))
				{
					if (-1 !== SKs.indexOf(","))
					{
						a2s = SKs.split(",");
						for (iX=0; iX < a2s.length; ++iX)
						{
							if (UID !== a2Check[iX]) { a2Check[iX].keyclf = decodeURIComponent(a2s[iX]); }
							else { log(sCR+"ERROR: "+sCN+sCNB+a2s[iX]+sCN+" key invalid to index: "+iX+EOL, UID, res); }
						}
					}
					else { a2Check[0].keyclf = decodeURIComponent(SKs); }
				}
				else
				{
					a2s = SKs;
					for (iX=0; iX < a2s.length; ++iX)
					{
						if (UID !== a2Check[iX]) { a2Check[iX].keyclf = decodeURIComponent(a2s[iX]); }
						else { log(sCR+"ERROR: "+sCN+sCNB+a2s[iX]+sCN+" key invalid to index: "+iX+EOL, UID, res); }
					}
				}
			}
		}
	}

	if (bWriteAccess && UID !== _GET["!_sko"] || UID !== _GET["!_skobj"])
	{
		if (0 === a2Check.length)
		{
			log(sCR+"ERROR:"+sCN+" MUST specify IP address with !_=... currently: !_ is invalid or empty."+EOL, UID, res);
		}
		else
		{
			var SKo = UID !== _GET["!_sko"] ? _GET["!_sko"] : _GET["!_skobj"];
			if (("" === SKo || ("string" !== typeof(SKo)) && "object" !== typeof(SKo)))
			{ log(sCR+"ERROR:"+sCN+" MUST provide key value eg: !_skc=something"+EOL, UID, res); }

			if ("string" === typeof(SKo))
			{
				if (-1 !== SKo.indexOf(","))
				{
					a2s = SKo.split(",");
					for (iX=0; iX < a2s.length; ++iX)
					{
						if (UID !== a2Check[iX]) { a2Check[iX].keyobject = a2s[iX]; }
						else { log(sCR+"ERROR: "+sCN+sCNB+a2s[iX]+sCN+" key invalid to index: "+iX+EOL, UID, res); }
					}
				}
				else { a2Check[0].keyobject = SKo; }
			}
			else
			{
				a2s = SKo;
				for (iX=0; iX < a2s.length; ++iX)
				{
					if (UID !== a2Check[iX]) { a2Check[iX].keyobject = a2s[iX]; }
					else { log(sCR+"ERROR: "+sCN+sCNB+a2s[iX]+sCN+" key invalid to index: "+iX+EOL, UID, res); }
				}
			}
		}
	}

	/* Do Lookup storing !_sk, !_sa or !_sf if applicable */
	var aRet = [];
	for (iX=0; iX < a2Check.length; ++iX)
	{
		var oRet = {};
		oRet.ip = a2Check[iX].ip;
		oRet.date = new Date();

		if (a2Check[iX].v6)
		{	//noinspection JSUnresolvedFunction
			oRet.location = mMAX.getLocationV6(a2Check[iX].ip);
		}
		else
		{	//noinspection JSUnresolvedFunction
			oRet.location = mMAX.getLocation(a2Check[iX].ip);
		}

		if (null === oRet.location)
		{	/* Dont write ... return. */
			log(sCR+"ERROR: "+sCN+sCNB+a2Check[iX].ip+sCN+" invalid address."+EOL, UID, res);
			break;
		}

		if
		(
			UID !== _GET["!_sua"] || UID !== _GET["!_saveua"] || !bNoUA &&
			((bWriteAccess && (UID === _GET["!_nu"] && UID === _GET["!_noua"])) || !bWriteAccess)
		)
		{
			oRet.ua = UID === req.headers["user-agent"] ? "" : req.headers["user-agent"];
		}
		else
		{
			if (!bNoUA && bWriteAccess && (UID === _GET["!_nu"] && UID === _GET["!_noua"]))
			{
				oRet.ua = UID === oRet.ua ? "" : oRet.ua;
			}
		}

		if (!bNoTimeZone || (bWriteAccess && (UID !== _GET["!_tz"] || UID !== _GET["!_timezone"])))
		{	//noinspection JSUnresolvedVariable
			oRet.timeZone = mMAXTZ(oRet.location.countryCode, oRet.location.region);
			if (UID === oRet.timeZone) { oRet.timeZone="unrecognised-timezone"; }
		}

		if (!bNoASN || (bWriteAccess && (UID !== _GET["!_as"] || UID !== _GET["!_asnumber"])))
		{	//noinspection JSUnresolvedFunction
			oRet.asn = (a2Check[iX].v6) ? mMAX.getOrganizationV6(oRet.ip) : mMAX.getOrganization(oRet.ip);
		}

		if (a2Check[iX].keyobject)
		{
			try
			{
				oRet.keyobject = JSON.parse(decodeURIComponent(a2Check[iX].keyobject));
				if ("object" !== typeof(oRet.keyobject) || null === oRet.keyobject)
				{ log(sCR+"ERROR: "+sCN+sCNB+a2Check[iX].keyobject+sCN+" is NOT a valid JSON object."+EOL, UID, res); }
				// else { aObjSaveKeys.push(oRet.keyobject); }
			}
			catch(e)
			{
				log(sCR+"ERROR: "+sCN+sCNB+a2Check[iX].keyobject+sCN+" is NOT a valid JSON object."+EOL, UID, res);
				break;
			}
		}

		if (bNoLocation) { delete(oRet.location); }
		if (a2Check[iX].keyclf) { oRet.keyclf = a2Check[iX].keyclf; }

		aRet.push(oRet);
	}

	if (bWriteAccess && (UID === _GET["!_cd"] || UID === _GET["!_cdistance"])) { calculateDistances(aRet); }

	if (0 < aRet.length && (bLogToFile || bWriteAccess || bObjFileWrite))
	{
		aCLF = [aRet.length+1];
		for (iX=0; iX < aRet.length; ++iX)
		{
			var dX = aRet[iX].date; //console.log("%s/%s/%s:%s:%s:%s %s", dX.getDate(), aMonths[dX.getMonth()], dX.getFullYear(), dX.getHours(), dX.getMinutes(), dX.getSeconds(), pad(dX.getTimezoneOffset()/60*-100, 4) );
			var sDate = dX.getDate() + "/" + aMonths[dX.getMonth()]+ "/" + dX.getFullYear();
			sDate+= ":" + dX.getHours() + ":" + pad(dX.getMinutes(), 2, true) + ":" + pad(dX.getSeconds(), 2, true);
			sDate+= " " + pad(dX.getTimezoneOffset()/60*-100, 4, false);
			if (UID !== a2Check[iX].keyclf) { aRet[iX].keyclf = a2Check[iX].keyclf; }

			var sCLF = aRet[iX].keyclf ? " " + aRet[iX].keyclf : "";
			//noinspection JSUnresolvedVariable
			var sLocation = UID !== aRet[iX].location ?
			" \"" + aRet[iX].location.countryCode + "/" + aRet[iX].location.city+"/" +
			aRet[iX].location.latitude + "/" +aRet[iX].location.longitude+"\""
				: "";
			aCLF[iX] = aRet[iX].ip + " ["+sDate+"]" + sCLF;
			aCLF[iX]+= UID !== aRet[iX].ua ? " \"" + aRet[iX].ua +"\"" : "";
			aCLF[iX]+= UID !== sLocation ? sLocation : "";
			aCLF[iX]+= UID !== aRet[iX].timeZone ? " \""+aRet[iX].timeZone+"\"" : "";
			aCLF[iX]+= UID !== aRet[iX].asn ? " \""+aRet[iX].asn+"\"" : "";
			aCLF[iX]+= "\n";
		}
	}

	if (bDeleteAll || (bDeleteAccess && (UID !== _GET["!_df"] || UID !== _GET["!_deletefile"])) )
	{
		if (bDeleteAll)
		{
			if (bNoReturn) { deleteOBJFile(UID); log("", UID, res); }
			else
			{
				if (!bOUTPUT){ deleteOBJFile(res); }
				else { deleteOBJFile(UID); }
			}
		}
		else
		{
			var toDel = UID !== _GET["!_df"] ? _GET["!_df"] : _GET["!_deletefile"];
			deleteOBJFile(res, toDel);
		}
	}
	else
	{	// CUSTOME LOGS FOR USER DEFINED SESSIONS
		if (0 < aRet.length && bWriteAccess && bObjFileWrite)
		{
			if (UID === _GET["!_nc"] && UID === _GET["!_noclf"] && !bNoCLF)
			{ writeCLFFile(aCLF, (UID !== _GET["!_sf"] ? _GET["!_sf"] : _GET["!_savefile"]) + sUCLF); }
			/** remove keyclf as its redudant in object */
			if (UID !== _GET["!_sko"] || UID !== _GET["!_skobj"]) { for (iY=0; iY < aRet.length; ++iY) { delete(aRet[iY].keyclf); }}
			writeOBJFile(aRet, (UID !== _GET["!_sf"] ? _GET["!_sf"] : _GET["!_savefile"]) + sUOBJ);
		}
		if (0 < aRet.length && bLogToFile)
		{
			if (!bWriteAccess) { writeCLFFile(aCLF); }
			else { if (UID === _GET["!_nc"] && UID === _GET["!_noclf"] && !bNoCLF) { writeCLFFile(aCLF); } }

			/** remove keyclf as its redundant in object */
			for (iY=0; iY < aRet.length; ++iY) { delete(aRet[iY].keyclf); }
			writeOBJFile(aRet); // if (UID !== _GET["!_sko"] || UID !== _GET["!_skobj"]) { }
		}
		if (UID !== aRet[0] && UID !== aRet[0].keyclf) { for (iY=0; iY < aRet.length; ++iY) { delete(aRet[iY].keyclf); } }

		// where there are no-return parameters
		if (0 < aRet.length && !bNoReturn)
		{
			if (!bOUTPUT) { log( (0 < aRet.length) ? JSON.stringify(aRet) : "", UID, res); }
			else
			{
				if (UID !== _GET["!_ra"] || UID !== _GET["!_readauto"]) { returnOBJAutoFile(res); }
				else { returnOBJFile(res, (UID !== _GET["!_rf"] ? _GET["!_rf"] : _GET["!_readfile"]) + sUOBJ); }
			}
		}
		else
		{
			if (bNoReturn) { log("", UID, res); }
			else
			{
				if (!bOUTPUT && 0 === aRet.length) { showHelp(UID, UID, res); }
				else
				{
					if (UID !== _GET["!_ra"] || UID !== _GET["!_readauto"]) { returnOBJAutoFile(res); }
					else if (UID !== _GET["!_rf"] || UID !== _GET["!_readfile"])
					{
						returnOBJFile(res, (UID !== _GET["!_rf"] ? _GET["!_rf"] : _GET["!_readfile"]) + sUOBJ);
					}
					else
					{
						if (!bDeleteAccess && ( UID !== _GET["!_df"] && UID !== _GET["!_deletefile"]))
						{ log( (0 < aRet.length) ? JSON.stringify(aRet)+EOL : "", UID, res); }
					}
				}
			}
		}
	}
}

/** Deletes JSON save sessions files based on the requested file or all available files.*/
function deleteOBJFile(res, file)
{
	var iX=0; //GEMERAL COUNTER
	try
	{	//noinspection JSUnresolvedFunction
		mFS.readdir(process.cwd(), function (err, files)
		{
			if (null !== err) { log ("ERROR: "+err.toString(), UID, res); }
			else
			{	/* log("Files list in current path "); log(files); */
				var FoundOBJ = files.indexOfAll(UID === file ? sVOBJ : file+sUOBJ);
				var FoundCLF = files.indexOfAll(UID === file ? sVCLF : file+sUCLF);
				var FoundOBJUser = -1;
				var FoundCLFUser = -1;
				if (UID === file)
				{
					FoundOBJUser = files.indexOfAll(sUOBJ);
					FoundCLFUser = files.indexOfAll(sUCLF);
				}
				if (-1 === FoundCLF && -1 === FoundOBJ && -1 === FoundCLFUser && -1 === FoundOBJUser )
				{
					log("No matching file(s) to delete.", UID, res);
				}
				else
				{
					var aDelete=[];
					if ("number" === typeof(FoundOBJ) && -1 !== FoundOBJ) { aDelete.push(files[FoundOBJ]); }
					if ("number" === typeof(FoundCLF) && -1 !== FoundCLF) { aDelete.push(files[FoundCLF]); }
					if ("number" === typeof(FoundOBJUser) && -1 !== FoundOBJUser) { aDelete.push(files[FoundOBJUser]); }
					if ("number" === typeof(FoundCLFUser) && -1 !== FoundCLFUser) { aDelete.push(files[FoundCLFUser]); }

					if ("object" === typeof(FoundOBJ))
					{
						for (iX=0; iX < FoundOBJ.length; ++iX) { aDelete.push(files[FoundOBJ[iX]]); }
					}
					if ("object" === typeof(FoundCLF))
					{
						for (iX=0; iX < FoundCLF.length; ++iX) { aDelete.push(files[FoundCLF[iX]]); }
					}
					if ("object" === typeof(FoundOBJUser))
					{
						for (iX=0; iX < FoundOBJUser.length; ++iX) { aDelete.push(files[FoundOBJUser[iX]]); }
					}
					if ("object" === typeof(FoundCLFUser))
					{
						for (iX=0; iX < FoundCLFUser.length; ++iX) { aDelete.push(files[FoundCLFUser[iX]]); }
					}

					for (iX=0; iX < aDelete.length; ++iX)
					{
						try
						{	//noinspection JSUnresolvedFunction
							mFS.unlink(aDelete[iX], clDelete(aDelete.toString(), aDelete.length-1 === iX ? res : UID));
						}
						catch(err) { log("ERROR: "+err.toString()); }
					}
				}
			}
		});
	}
	catch (e2) { log(e2.toString()); log ("ERROR: could not get path - "+e2.toString(), UID, res); }
}

/** closure function for deleting a set.*/
function clDelete(sFiles, res)
{
	return function(e)
	{ log( (null !== e && UID !== e) ? "ERROR: deleting: "+ e.toString(): "Deleted file(s): "+sFiles, UID, res); };
}

/** List available JSON files related to user save sessions.*/
function returnFilesList(res)
{
	try
	{	//noinspection JSUnresolvedFunction
		mFS.readdir(".", function (e, files)
		{
			if (null !== e) { log (e.toString(), UID, res); }
			else
			{
				var aToReturn = [];
				var Found = files.indexOfAll(sUOBJ);
				if (-1 === Found) { aToReturn = "No User-Save files available."; }
				else if ("number" === typeof(Found)) { aToReturn.push(files[Found]); }
				else
				{
					for (var iX=0; iX < Found.length; ++iX) { aToReturn.push(files[Found]); }
				}
				delete(oRHeader["Transfer-Encoding"]);
				oRHeader["Content-Length"] = JSON.stringify(aToReturn).length;
				log(JSON.stringify(aToReturn), UID, res);
			}
		});
	}
	catch (ec2) { log("ERROR: could not obtain listing of user files.", UID, res); }
}

/** outputs as response the request JSON file if present - otherwise an error message */
function returnOBJFile(res, sFile)
{
	try
	{	//noinspection JSUnresolvedFunction
		mFS.readFile(sFile, { "encoding" : "utf8" }, function(e2, d2)
		{
			if (null !== e2) { log("ERROR: "+sFile+ " could not be returned."+EOL+ e2.toString(), UID, res); }
			else
			{
				var sReturn = "";
				if (d2.length-1 === d2.lastIndexOf(",")) { sReturn = d2.substr(0, d2.length-1)+"]"; }
				else if (d2.length-2 === d2.lastIndexOf(",")) { sReturn = d2.substr(0, d2.length-2)+"]"; }
				else { sReturn = d2; }
				log(sReturn, UID, res);
			}
		});
	}
	catch (ec2) { log("ERROR: "+sFile+ " could not be returned.", UID, res); }
}

/** outputs auto-save session JSON if any are available. */
function returnOBJAutoFile(res)
{
	if ("" === sFileDefaultObj)
	{	//noinspection JSUnresolvedFunction
		mFS.readdir(process.cwd(), function (e, files)
		{
			if (null !== e) { log ("ERROR: "+e.toString(), UID, res); }
			else
			{	/* log("Files list in current path "); log(files); */
				var Found = files.indexOfAll(sVOBJ);
				if (-1 === Found) { log("No Auto-Save files to provide.", UID, res); }
				else if ("number" === typeof(Found)) { returnOBJFile(res, files[Found]); }
				else { returnOBJFile(res, files[Found[Found.length-1]]); }
			}
		});
	}
	else
	{
		try
		{	//noinspection JSUnresolvedFunction
			mFS.readFile(sFileDefaultObj, { "encoding" : "utf8" }, function(err, data)
			{
				if (null !== err)
				{	//noinspection JSUnresolvedFunction
					mFS.readdir(".", function (e, files)
					{
						if (null !== e) { log (e.toString(), UID, res); }
						else
						{
							var Found = files.indexOfAll(sVOBJ);
							if (-1 === Found) { log("No Auto-Save files to provide.", UID, res); }
							else if ("number" === typeof(Found))
							{	/** ASSES SINGLE FILE FOUND */
								if (sFileDefaultObj === files.indexOfAll[Found])
								{ log("No Auto-Save schemed file available to provide.", UID, res); }
								else { returnOBJFile(res, files.indexOfAll[Found]); }
							} /** TAKE LAST ENTRY */
							else { returnOBJFile(res, files[Found[Found.length-1]]); }
						}
					});
				}
				else
				{
					var sReturn = "";
					if (data.length-1 === data.lastIndexOf(",")) { sReturn = data.substr(0, data.length-1)+"]"; }
					else if (data.length-2 === data.lastIndexOf(",")) { sReturn = data.substr(0, data.length-2)+"]"; }
					else { sReturn = data; }
					// if ("]" !== sReturn[sReturn.length-1] || "]" !== sReturn[sReturn.length-2]) { sReturn+="]"; }
					log(sReturn, UID, res);
				}
			});
		}
		catch(e) { log("ERROR: reading file: "+sFileDefaultObj+" "+e.toString(), UID, res); }
	}
}

/** Writes JSON Object to specified file or to auto-save. */
function writeOBJFile(aRet, file)
{
	var dX = new Date();
	var sFile = UID === file ? dX.getFullYear()+"-"+pad(dX.getMonth()+1, 2, true)+"-"+dX.getDate()+"_"+aMonths[dX.getMonth()].toLowerCase() : file ;
	sFile+= UID === file ? sVOBJ : sUOBJ;
	if (UID !== file && sFile !== sFileDefaultObj) { sFileDefaultObj = sFile; }
	var sDate = " @:"+new Date()+" for: "+aRet+EOL;
	try
	{	//noinspection JSUnresolvedFunction
		mFS.stat(sFile, function(e, stats)
		{
			var iStart = (null === e || UID === e) ? stats.size-2 : 0;
			if ( 0 > iStart) { iStart = 0; }
			if (0 === iStart)
			{	//noinspection JSUnresolvedFunction
				mFS.appendFile(sFile, JSON.stringify(aRet, null, "\t"), "utf8", function (err)
				{ if (err) { log("ERROR: err -- "+err.toString()); } });
			}
			else
			{	//noinspection JSUnresolvedFunction
				var fsObj = mFS.createWriteStream(sFile, { start: iStart, "flags" : "r+" });
				var sTXT = JSON.stringify(aRet, null, "\t");
				fsObj.write(iStart === 0 ? sTXT : ","+sTXT.substr(1), 0, function(e3)
				{
					if (null !== e3 && UID !== e3) { log("ERROR: could not append files: "+e3.toString()); }
					// else { /!*log("Successfully appended to: "+sFile);*!/ }
				});
			}
		});
	}
	catch(err){ log("ERROR: could not append OBJ file: "+sFile+sDate+err.toString()); }
}

/** Writes CLF to specified file or to auto-save. */
function writeCLFFile(aCLF, file)
{
	var dX = new Date();
	var sFile = UID === file ? dX.getFullYear()+"-"+pad(dX.getMonth()+1, 2, true)+"-"+dX.getDate()+"_"+aMonths[dX.getMonth()].toLowerCase() : file;
	sFile+= UID === file ? sVCLF : sUCLF;
	var sDate = " @:"+new Date()+" for: "+aCLF+EOL;
	try
	{	//noinspection JSUnresolvedFunction
		mFS.appendFile(sFile, aCLF, "utf8", function(e)
		{
			if (null !== e && UID !== e) { log("ERROR: could not append files: "+sFile+sDate+e.toString()); } //else { /*log("Successfully appended to: "+sFile);*/ }
		});
	}
	catch (err) { log(err.toString()); log("ERROR: could not append to CLF file: "+sFile+sDate+err.toString()); }
}

/**
 * Public module function
 * @return {Array}
 */
function lookup(sIP, bCheckDistance, bReturn)
{
	var a2Check = [];
	if ("string" === typeof(sIP))
	{
		if (-1 !== sIP.indexOf(","))
		{
			var a2s = sIP.split(",");
			for (var iX=0; iX < a2s.length; ++iX)
			{
				if (rgxIP.test(a2s[iX]) || rgxIPv6.test(a2s[iX]))
				{ a2Check.push({ "ip": a2s[iX], "v6": rgxIPv6.test(a2s[iX])}); }
				else
				{
					log(sCR+"ERROR: "+sCN+sCNB+a2s[iX]+sCN+" invalid IPv4/IPv6 address."+EOL);
					return [ "ERROR: invalid IPv4/IPv6 address." ];
				}
			}
		}
		else
		{	//noinspection JSCheckFunctionSignatures
			if (rgxIP.test(sIP) || rgxIPv6.test(sIP))
			{	//noinspection JSCheckFunctionSignatures
				a2Check.push({"ip": sIP, "v6": rgxIPv6.test(sIP)});
			}
			else
			{
				log(sCR+"ERROR: "+sCN+sCNB+sIP+sCN+" invalid IPv4/IPv6 address."+EOL, UID);
				return [ "ERROR: invalid IPv4/IPv6 address." ];
			}
		}
	}
	else if ("object" === typeof(sIP))
	{
		for (var iY in sIP)
		{
			if (!sIP.hasOwnProperty(iY)) { continue; }
			//noinspection JSCheckFunctionSignatures
			if (rgxIP.test(sIP[iY]) || rgxIPv6.test(sIP[iY]))
			{	//noinspection JSCheckFunctionSignatures
				a2Check.push({"ip": sIP[iY], "v6": rgxIPv6.test(sIP[iY])});
			}
			else
			{
				log(sCR+"ERROR: "+sCN+sCNB+sIP[iY]+sCN+" invalid IPv4/IPv6 address."+EOL, UID);
				return [ "ERROR: invalid IPv4/IPv6 address." ];
			}
		}
	}
	else
	{
		log(sCR+"ERROR: "+sCN+sCNB+sIP+sCN+" is not a valid request."+EOL);
		return [ "ERROR: "+sIP+" is not a valid request."+EOL];
	}

	var aRet = [];
	for (iX=0; iX < a2Check.length; ++iX)
	{
		var oRet = {};
		oRet.ip = a2Check[iX].ip;
		oRet.date = new Date();
		//noinspection JSUnresolvedFunction
		oRet.location = (a2Check[iX].v6) ? mMAX.getLocationV6(a2Check[iX].ip) : mMAX.getLocation(a2Check[iX].ip);

		if (null === oRet.location || UID === oRet.location)
		{	/* Dont write ... return. */
			log(sCR+"ERROR: "+sCN+a2Check[iX].ip+sCNB+" invalid address."+EOL+sCN);
			return [ "ERROR: "+a2Check[iX].ip+" invalid address." ];
		}

		if (!bNoASN)
		{	//noinspection JSUnresolvedFunction
			oRet.asn = (a2Check[iX].v6) ? mMAX.getOrganizationV6(oRet.ip) : mMAX.getOrganization(oRet.ip);
		}

		if (!bNoTimeZone)
		{	//noinspection JSUnresolvedVariable
			oRet.timeZone = mMAXTZ(oRet.location.countryCode, oRet.location.region);
			if (UID === oRet.timeZone) { oRet.timeZone="unrecognised-timezone"; }
		}

		if (UID !== typeof(aObjSaveKeys[iX])) { oRet.keyobject = aObjSaveKeys[iX]; }
		if (UID !== typeof(aClfSaveKeys[iX])) { oRet.keyclf = aClfSaveKeys[iX]; }
		aRet.push(oRet);
	}

	if (bCheckDistance) { calculateDistances(aRet); }

	return false === bReturn ? [] : aRet;
}
/** Public module function */
function enableupdates(iHoursUpdate)
{
	try
	{	//noinspection JSUnresolvedFunction
		mVIPIFS = require("child_process").fork(__dirname+"/vipi_files.js");
	}
	catch(e){ log("Issue forking vipi_index.js"+EOL+ e.toString()); }

	var oPS = {"cmd": "start"};
	if (UID !== sDBPath) {oPS.writedir = sDBPath;}
	if (UID === args[19][2]) {oPS.update = true;}
	if (UID !== iHoursUpdate) oA.update_hours = iHoursUpdate;
	if (bQuiet) {oPS.quiet = true;}
	mVIPIFS.on("message", function(m) { /*log(m);*/});
	mVIPIFS.send(oPS);
}

initLoad();