/** shorthand variables & convenience function */
//var UID = "undefined";
var UID = undefined;
var iERROR=0;
var bQUIET = false;
//----------------------------------------------------------------
/** Packages Required:                                          */
//----------------------------------------------------------------
var mHTTP, mFS, mZLIB;
try
{	//noinspection JSUnresolvedFunction
	mFS = require("fs"); mZLIB = require("zlib");
	process.on("message", signalIn);
	exports = module.exports = {"Init" : Init};
}
catch (e){ console.log("ERROR ", e); try{process.exit(1);}catch(e){++iERROR;} }
function log(msg) { if (!bQUIET) process.stdout.write(msg); /*console.log(msg);*/ }

function isTerminal()
{	//noinspection JSUnresolvedVariable
	return Boolean(process.stdout.isTTY) || (UID !== process.env.TERM && "xterm-256color" === process.env.TERM);
}
var bTTY = isTerminal();

/** strip TTY ANSI colours for no TTY */
function sRaw(msg) { return bTTY ? msg : msg.replace( /\033\[[0-9;]*m/g, "" ); }
/**Red*/var sCR=""; /**Cyan*/ var sCC=""; /**Dark Gray*/ var sCDG=""; /**Green*/ var sCG="";
/**Natural*/ var sCN=""; /**Natural Bold*/ var sCNB=""; /**Purple*/ var sCP="";
/**Yellow*/var sCY=""; /**Blue*/var sCB=""; /**White*/ var sCW="";
/**Red BG + White Text*/ var sCRBG="";

function setColors()
{
	/**Red*/ sCR=sRaw("\033[31m"); /**Cyan*/ sCC=sRaw("\033[36m");
	/**Dark Gray*/ sCDG=sRaw("\033[90m"); /**Green*/ sCG=sRaw("\033[32m");
	/**Natural*/ sCN=sRaw("\033[0m"); /**Natural Bold*/ sCNB=sRaw("\033[1m");
	/**Purple*/ sCP=sRaw("\033[35m"); /**Yellow*/ sCY=sRaw("\033[33m");
	/**Blue*/ sCB=sRaw("\x1b[34m"); /**White*/ sCW=sRaw("\x1b[37m");
	/**Red BG + White Text*/ sCRBG=""+sRaw("\033[41");
}
setColors();

var bInstall = false; // in install mode?
var bForked = false; // process / module in fork use?
// VARIABLES SPECIFIC TO THIS SCRIPT:
var iHours=24;	// Numbers of hours before an update.
var iSecondsUpdate=1000*(60*60);	// 24 hours in milli-seconds for update interval.
var iLRemoved = 0;	// number of removed lookups
var sPort = 80;	// requests default port
var aColons = []; //array or number to detect all ':'
var aLookUps = []; // Global looks table for queued checks
var bChange = false; // Change indicator
var sP = "Downloading : ";
var sS = "▀"; var sS0="▓";
var sS1="▀"; var sS2="║";
var sS3="▄"; var sS4="░";
var iS = 0;
var iSep1= 203;
var iSep2=1;
/** default request object compositions */
var oA =
{ /* - O == optional, R == required: */
/*O*/"writedir"	:	__dirname+"/dbs",
/*R*/"json"		:	"vetags.json",
/*R*/"urlroot"	:	"http://geolite.maxmind.com",
/*O*/"urlappend":	"/download/geoip/database/",
/*R*/"files"	:
	[
	/*-*/"GeoIPv6.dat.gz",
	/*-*/"GeoLiteCity.dat.gz",
	/*-*/"asnum/GeoIPASNum.dat.gz",
	/*-*/"asnum/GeoIPASNumv6.dat.gz",
	/*-*/"GeoLiteCountry/GeoIP.dat.gz",
	/*-*/"GeoLiteCityv6-beta/GeoLiteCityv6.dat.gz"
	],
/*O*/"gunzip"	: true,
/*O*/"update"	: false,
/*O*/"update_hours"	: 24,
/*O*/"ERRORS"	: 0,	// occuring errors
/*O*/"MOVED"	: 0,	// number of files moved.
/*O*/"MSG"	: ""
};
/** template oOption per file with optional .gunzippath & writepath */
var oOption =
{ /*
 "hostname" : oA.urlroot, "port" : sPort, "method" : "GET",
 "downloaded" : false,
 "filename" : "FILE.1.gz",
 "path" : "/ur/path/to/filename",
 "writepath" : "local/path/to/write/FILE.1.gz",
 "gunzippath" : "local/path/to/write/FILE.1" */
};

/** for single / messaging where forked */
function signalIn(m)
{	//noinspection JSUnresolvedVariable
	if (UID === m || UID === m.cmd) { return process.send({"error" : { "msg": "Invalid request / string." }}); }
	//noinspection JSUnresolvedVariable
	if(m.cmd == "start")
	{
		bForked = true;
		//noinspection JSUnresolvedVariable
		bQUIET = UID !== m.quiet;
		oA.update = UID !== m.update; // enable update
		oA.update_hours = UID !== m.update_hours ? m.update_hours : 24 ;
		if (UID !== m.writedir)  { oA.writedir =  m.writedir; }
		// append / prepend path if passed otherwise use default.
		oA.json = (UID !== m.json) ? oA.writedir+m.json : oA.writedir+oA.json;
		process.send({"data" : { "msg": "OK" }});
		/*¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯*/
		/** SCHEDULE FIRST RUN IN 24 hours    */
		/*____________________________________*/
		setInterval(function (){ Init(oA); }, iSecondsUpdate);
		//Init(oA); //return InitLoad(m);
	}
	else
	{	//noinspection JSUnresolvedVariable
		return process.send(m.cmd==="status" ? {"data":{"msg":"UP"}} : {"error" : {"msg":"Invalid command passed."}});
	}
}

/** Checks if passed value is of integer type.
 * @return {boolean}
 * @param value Number value to check @returns Boolean true if it is an integer otherwise false. */
function IsInt(value){ return (parseFloat(value) === parseInt(value)) && !isNaN(value); }
try
{	//noinspection JSUnusedGlobalSymbols
	Object.defineProperty(String.prototype, "indexOfAll",
	{	/** Regular Expression IndexOf for Arrays or String
		 * Iterates array & returns the index(s) of matches as an array or single integer position; otherwise -1 if not found.
		 * @param reg RegEx reg regular expression to test with. E.g. /-ba/gim
		 * @returns position Array|Number	numeric position of all occurrence(s) or -1 means not found anywhere. */
		//noinspection JSUnusedGlobalSymbols
		value: function indexOfAll(reg)
		{
			var a2Return = [];
			for (var i in this)
			{ if (this.hasOwnProperty(i)) { if (this[i].toString().match(reg)) { a2Return.push(i); } } }
			var iL = a2Return.length; //noinspection JSValidateTypes
			return (0===iL) ? Number(-1) : (1===iL)?Number(a2Return[0]):a2Return;
		}
	});
} catch(e) { console.log("ERROR ", e); ++iERROR; }

/** Checks for existence of a file @param String path of file. @return Boolean true if present otherwise false.
 * @return {boolean} */
function GetFileRealPath(s)
{
	try
	{	//noinspection JSUnresolvedFunction
		return mFS.realpathSync(s);
	}
	catch(e){return false;}
}

/** process state broadcaster
 * @return {boolean|Object} */
function BroadCastUpdate()
{
	var oToReturn = {};
	var aToReturn = [];
	var bSuccess = true;
	//var sErrors = "";
	//console.log("\n\n", JSON.stringify(oA, null, "  ")); process.exit(0);
	for (iX=0; iX < oA.fileso.length; ++iX)
	{
		if (oA.fileso[iX].error || !oA.fileso[iX].available) { bSuccess=false; }
		aToReturn.push
		(
			{
			"file" : oA.fileso[iX].path, "validurl" : oA.fileso[iX].validurl,
			"available" : oA.fileso[iX].available, "downloaded" : oA.fileso[iX].downloaded
			}
		);
		if (oA.fileso[iX].error) { aToReturn[aToReturn.length-1].error = oA.fileso[iX].error; }
	}

	if (0 !== oA.ERRORS) { bSuccess = ("" !== oA.MSG) ? oA.MSG : true; }

	oToReturn["data"] = {"msg" : "DONE", "errors" : (true === bSuccess && 0 === oA.ERRORS) ? false : bSuccess, "files" : aToReturn };
	if (!oA.update)
	{
		if(bForked) { return process.send(oToReturn); }
		else
		{
			var sMSG = "";
			if (0 === oA.ERRORS)
			{
				if (oA.gunzip && bChange){ sMSG = "\nSuccesfully - GUnzip-ed files.\n"; }
				if (bChange && bInstall) { sMSG+= "GeoIP DB Files written to: "+sCW+oA.writedir+"\n"+sCN; }
			}
			if (!bInstall) { sMSG+="\n"+JSON.stringify(oToReturn, null, "  "); }
			log(sMSG);
			if (bInstall) { process.exit(0 === oA.ERRORS ? 0 : 1); }
			return 0 === oA.ERRORS;
		}
	}
	else
	{
		if(bForked) { process.send(oToReturn); }
		else
		{
			if (!bInstall) { log("\n"+JSON.stringify(oToReturn, null, "  ")); }
		}
	}

	for (var iX=0; iX < oA.fileso.length; ++iX) { oA.fileso[iX].downloaded = false; }
	oA.ERRORS = 0;
	oA.MSG = "DONE";
	oA.MOVED = 0;
	bChange = false;
}

/** consulre function for decompression post move / write of final write */
function clMoveFile(v)
{
	return function (err)
	{
		if (err)
		{
			++oA.ERRORS;
			var sERR = err.toString();
			if (-1 !== sERR.indexOf("Error: ")) { sERR = sERR.split("Error: ", sERR.length-7).join(""); }
			v.error = sERR ;
			v.available = false;
			if (++oA.MOVED === oA.fileso.length) { BroadCastUpdate(); }
		}
		else
		{
			if (UID !== v.gunzip && v.gunzip)
			{
				var sSourceFile = (UID !== v.writepath) ? v.writepath : v.filename;
				var sWriteFile = (UID !== v.gunzippath) ? v.gunzippath
					: ( (UID !== v.writepath) ? v.writepath.split(v.filename)[0] : "" ) + v.filename.split(".gz")[0];
				//noinspection JSUnresolvedFunction
				var fsFileIn = mFS.createReadStream(sSourceFile);
				//noinspection JSUnresolvedFunction
				var fsFileOut = mFS.createWriteStream(sWriteFile);
				fsFileOut.on("error", function (e)
				{
					++oA.ERRORS;
					var sERR = e.toString();
					if (-1 !== sERR.indexOf("Error: ")) { sERR = sERR.split("Error: ", sERR.length-7).join(""); }
					v.error = sERR ;
					v.available = false;
				});
				fsFileIn.on("error", function (e)
				{
					++oA.ERRORS;
					var sERR = e.toString();
					if (-1 !== sERR.indexOf("Error: ")) { sERR = sERR.split("Error: ", sERR.length-7).join(""); }
					v.error = sERR ;
					v.available = false;
				});
				//noinspection JSUnresolvedFunction
				fsFileIn.pipe(mZLIB.createGunzip()).pipe(fsFileOut)
				.on("finish", function()
				{
					v.available = true;
					if (++oA.MOVED === oA.fileso.length) { BroadCastUpdate(); }
				})
				.on("error", function(e)
				{
					++oA.ERRORS;
					var sERR = e.toString();
					if (-1 !== sERR.indexOf("Error: ")) { sERR = sERR.split("Error: ", sERR.length-7).join(""); }
					v.error = sERR ;
					v.available = false;
					if (++oA.MOVED === oA.fileso.length) { BroadCastUpdate(); }
				});
			}
			else { if (++oA.MOVED === oA.fileso.length) { BroadCastUpdate(); } }
		}
	};
}

/** What to do when everything is done */
function tickComplete()
{
	var iX=0; //GENERAL COUNTER
	var sMSG="";
	if (!bChange)
	{
		iLRemoved=0;
		if (0 === oA.ERRORS)
		{
			if (bInstall) { sMSG="\nALL: "+oA.fileso.length+" <- Maxmind DB files ALREADY INSTALLED & upto date @ "+new Date()+"\n"; }
			else { sMSG="\nNo changes to: "+oA.fileso.length+" files @ "+new Date(); }
		}
		else { sMSG="\nERRORS: Completed with ISSUES :-( @ : " + new Date() +"\n"; }
	}
	else
	{
		if (0 === oA.ERRORS) { sMSG=sCNB+sCC+"\nSuccess"+sCW+" - Downloaded all "+oA.fileso.length+" files @: "+sCN+new Date()+sCN; }
		else { sMSG="\nERRORS: "+oA.ERRORS+" <- Download / Compare ISSUES at requested path(s).\n"; }
	}
	log(sMSG);

	if (bChange && 0 === oA.ERRORS)
	{
		for (iX=0; iX < oA.fileso.length; ++iX)
		{
			if (oA.fileso[iX].downloaded)
			{	//noinspection JSUnresolvedFunction
				mFS.rename(oA.fileso[iX].filename, oA.fileso[iX].writepath, clMoveFile(oA.fileso[iX]));
			}
		}
		//noinspection JSUnresolvedFunction
		mFS.writeFile(oA.json, JSON.stringify(oA.fileso), function(e)
		{
			if (e) { log(e.toString()+"\nCan NOT save etags.json"); }
		});
	}
	else { BroadCastUpdate(); }
}

/** write file to file-stream */
function DownloadCheck(v, res)
{
	bChange = true;
	oA.fileso[v].etag = res.headers.etag;
	aLookUps.push(oA.fileso[v].path);
	oA.fileso[v].downloaded = false;
	oA.fileso[v].available = false;
	//noinspection JSUnresolvedFunction
	var ioFile = mFS.createWriteStream(oA.fileso[v].filename);
	ioFile.on("error", function(e)
	{
		var sERR = e.toString();
		if (-1 !== sERR.indexOf("Error: ")) { sERR = sERR.split("Error: ", sERR.length-7).join(""); }
		++oA.ERRORS;
		oA.fileso[v].error = sERR ;
		oA.fileso[v].downloaded = false;
	});

	res.on("data", function(d)
	{
		if (UID === oA.fileso[v].error)
		{
			ioFile.write(d);
			oA.fileso[v].downloaded = true;
			if (bInstall && 0===iS) { log("\nINITIATING DL PROCESS 4m: maxmind.com...\n"); }
			if (0!==++iS%iSep1) return ;
			sP=(0 === ++iS%iSep2) ? sP+sCB+sCNB+sS0 : sP;
			sS=(sS1 === sS) ? sS2 : ( (sS2 === sS) ? sS3 : ((sS3 === sS) ? sS4 : sS1 ) );
			var sA = ( iS%2 ? sCNB+sCY : sCB+sCNB );
			log("\033[0G"+(iS%4===1 ?sCDG:sCY)+sP+sA+sS+sCN);
		}
		else { oA.fileso[v].downloaded = false; }
	});
	res.on("error", function(e)
	{
		var sERR = e.toString();
		if (-1 !== sERR.indexOf("Error: ")) { sERR = sERR.split("Error: ", sERR.length-7).join(""); }
		++oA.ERRORS;
		oA.fileso[v].error = sERR;
		oA.fileso[v].downloaded = false;
		oA.fileso[v].available = false;
	});
}

/** take out out lookups table */
function DecrementLookups(v)
{
	var iPos = aLookUps.indexOf(oA.fileso[v].path);
	aLookUps.splice(iPos, 1);
	if (oA.fileso.length === ++iLRemoved && aLookUps.length === 0) { tickComplete(); }
}

/** closure function to check presence of file at a path. */
function clGetFile(v, res)
{
	return function (e/*, sPath*/)
	{
		if (e) { DownloadCheck(v, res); }
		else
		{
			oA.fileso[v].available = true;
			DecrementLookups(v);
		}
	};
}

/** closure function to parse http responses */
function clHttpParse(v)
{
	return function(res)
	{
		if ("application/octet-stream" !== res.headers["content-type"])
		{
			++oA.ERRORS;
			oA.fileso[v].validurl = false;
			oA.fileso[v].downloaded = false;
			oA.fileso[v].available = false;
			oA.fileso[v].error = "INVALID return type for: " + oA.fileso[v].filename + " @ :" + new Date();
			if (!bForked) { log(oA.fileso[v].error); }
			DecrementLookups(v);
		}
		else
		{
			oA.fileso[v].validurl = true;
			/* Check whether files is present via e-tag histotry or is already at location - otherwise download */
			if (oA.fileso[v].etag !== res.headers.etag){ DownloadCheck(v, res); }
			else
			{ //noinspection JSUnresolvedFunction
				mFS.realpath(oA.fileso[v].writepath, clGetFile(v, res));
			}
		}
		res.on("end", function(){ if (bChange) { DecrementLookups(v);/*log("Finished: "+oA.fileso[v].filename);*/ } });
	};
}

/** closure function for http errors */
function clHttpError(v)
{
	return function(e)
	{
		++oA.ERRORS;
		oA.fileso[v].downloaded = false;
		oA.fileso[v].error = "ERROR downloading: " + oA.fileso[v].filename + e +"\n";
		if (!bForked) { log(oA.fileso[v].error); }
		DecrementLookups(v);
	};
}

/** Ensure required write path is present */
function InitPaths()
{
	if (UID === oA.writedir) { return ; }
	//noinspection JSUnresolvedFunction
	mFS.mkdir(oA.writedir, function(e)
	{
		if (null !== e && "EEXIST" !== e.code)
		{
			var sMSG = "ERROR Directory '"+oA.writedir+"' could NOT be made.\n"+e;
			if (!bForked) { log(sMSG); }
			else { oA.MSG+=sMSG; ++oA.ERRORS; }
		}
	});
}

/** loads former files collected on last run or before crash / stop */
function InitLoad()
{
	if (UID !== oA.json && GetFileRealPath(oA.json))
	{	//noinspection JSUnresolvedFunction
		var oldReads = mFS.readFileSync(oA.json, "utf8");
		var oldFiles = [];
		if (2 < oldReads.length) { oldFiles = JSON.parse(oldReads); /* log("\nReloaded OLD JSON.\n");*/ }
		for (var iX=0; iX < oldFiles.length; ++iX)
		{
			for (var iY=0; iY < oA.fileso.length; ++iY)
			{
				if (oldFiles[iX].path === oA.fileso[iY].path){ oA.fileso[iY].etag = oldFiles[iX].etag; break; }
			}
		}
	}
}

/*¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯*/
/** MAIN INIT                         */
/*____________________________________*/
/**
 * @return {number} potential exit code
 */
function Init(oAR)
{
	if (0 !== iERROR) { console.log("BAD ENVIROMENT, SERIOUS ISSUES or CLIENT AGENT!\n"); return 1; }
	if (UID !== oAR) { oA = oAR; }
	var sRequire =  (-1 !== oA.urlroot.indexOf("https") || -1 !== oA.urlroot.indexOf(":443")) ? "https" : "http";
	mHTTP = require(sRequire);
	aColons = oA.urlroot.indexOfAll(":");
	/* where no ':' then its plain scheme otherwise try to match */
	if (-1 !== aColons)
	{
		var sTmp = oA.urlroot.split(":");
		/* multiple ':' see which has number */
		if ("object" === typeof(aColons)) { if (IsInt(sTmp[2])) { sPort = sTmp[2]; oA.urlroot = sTmp[1]; } }
		else { if (IsInt(sTmp[1])) { sPort = sTmp[1]; oA.urlroot = sTmp[0]; } }
	}
	/* remove starting '//' for pure DNS string */
	var iCol = oA.urlroot.indexOf("//");
	if (-1 !== iCol && 0 !== iCol){ oA.urlroot = oA.urlroot.split("//")[1]; }
	if (UID === oA.fileso) { oA.fileso = []; }
	oOption = { "hostname" : oA.urlroot, "port" : sPort, "method" : "GET" };
	/* construct requests objects if not already set */
	if (UID !== oA.fileso)
	{
		for (var iX=0; iX < oA.files.length; ++iX)
		{
			var oFileO = JSON.parse(JSON.stringify(oOption));
			var sFileName;
			if (-1 === oA.files[iX].indexOf("/")) { sFileName = oA.files[iX]; }
			else
			{
				sFileName = oA.files[iX].split("/");
				sFileName = sFileName[sFileName.length-1];
			}
			if (UID !== oA.gunzip && oA.gunzip) { oFileO.gunzip = true; }
			oFileO.downloaded = false;
			oFileO.filename = sFileName;
			oFileO.path = oA.urlappend+oA.files[iX];
			oFileO.writepath = oA.writedir+"/"+oFileO.filename;
			oFileO.gunzippath = oA.writedir+"/"+oFileO.filename.split(".gz")[0];
			oA.fileso.push(oFileO);
		}
	}

	InitPaths(); InitLoad();

	/* DO requests for all fileso... */
	for (iX=0; iX < oA.fileso.length; ++iX)
	{	//noinspection JSUnresolvedFunction
		var req = mHTTP.request(oA.fileso[iX], clHttpParse(iX));
		req.on("error", clHttpError(iX)); req.end(0);
	}

	if (UID !== oA.update && true === oA.update)
	{
		// invoked once so delete to prevent recall on each itteration.
		delete (oA.update);
		iSecondsUpdate*= (UID !== oA.update_hours) ? oA.update_hours : iHours;
		updateOnTimer(oA);
	}
} //Init(oA);

/*¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯*/
/** TIMER BASED RE-RUN TO UPDATE      */
/*____________________________________*/
function updateOnTimer(oA)
{
	var fTimer = function (){ /*log("oA ==== \n" +JSON.stringify(oA));*/ Init(oA); };
	setInterval(fTimer, iSecondsUpdate);
}

/*¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯*/
/** NPM INSTALL                       */
/*____________________________________*/
if (-1 !== process.argv.indexOf("--install") || -1 !== process.argv.indexOf("-i"))
{
	bInstall = true;
	bQUIET = -1 !== process.argv.indexOf("--quiet") || -1 !== process.argv.indexOf("-q");
	var iP1 = process.argv.indexOf("--install");
	var iP2 = process.argv.indexOf("-i");
	var iPath = -1 !== iP1 ? iP1 : iP2;
	if (UID !== process.argv[iPath+1])
	{
		var sDBPath = process.argv[iPath+1];
		if ("/" !== sDBPath[sDBPath.length-1])
		{	//noinspection JSUnresolvedVariable
			sDBPath= sDBPath + "/";
		}
		oA.writedir = sDBPath;
		oA.json = sDBPath+oA.json;
	}
	else { oA.json = oA.writedir+"/"+oA.json; }
	oA.update = false ; Init(oA);
}