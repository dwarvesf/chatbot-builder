{
  description =
    "A flake that adds multiple extensions to Postgresql";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        packages = {
          postgresql = pkgs.postgresql_16.withPackages (p: [
            p.pg_partman
            p.timescaledb
            p.pgvector
          ]);
        };

        defaultPackage = self.packages.postgresql;
      });
}
