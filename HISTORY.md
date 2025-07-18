### `0.0.5` / 2025-07-18

  * Added arm64 to packge.json to support macos


------------------------------------------
### `0.0.4` / 2022-08-04

  * Added alternative URL for legacy v1 `.db` files - Maxmind only support v2 .mmdb support now.
  * Fixed install / download closure (`vipi_files.js`) which had stopped working since a Node.js release last last commit (sometime in 2018/2019) - thank you to @terrablue on GitHub.
  * Update spelling mistakes, readme references & version info.


------------------------------------------
### `0.0.3` / 2016-02-16

  * adjusted #!/ directives to use env (for nave and none default node.js users)
  * fixed invoked vipi_files.js from vipi.js to be called direct so as to use pwd / cwd instead of __dirname 
  * vipi_benchmark to use npm available DB files. 
  * RPI-1 benchmark data included for fun.


------------------------------------------
### `0.0.2` / 2016-02-12

  * fixed automatic / indefinite update in daemon (every 24 hours).
  * adjusted CWD / PWD to be used for relative path of DB store - otherwise uses global DB files (with module).
  * Included 100,000 benchmark test.
  * Improved progress bar and animation.
  * corrected / clarified documentation with greater notes on performance and benchmarking.


------------------------------------------
### `0.0.1` / 2016-02-07

  * working cli & daemon MVP. 


------------------------------------------
### `0.0.0` / 2015-12-12
2015-December-12
prototype never committed of minimal MVP for visual globe example.
