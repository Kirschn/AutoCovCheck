#!/bin/bash

curl -fsSL https://deb.nodesource.com/setup_17.x | bash -

apt install -y git openssl nodejs

git clone --recurse-submodules https://github.com/Kirschn/AutoCovCheck

cd AutoCovCheck

host="$(hostname)"
mkdir sslcert
openssl req -x509 -out sslcert/server.crt -keyout sslcert/server.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj "/CN=$host" -extensions EXT -config <( \
   printf "[dn]\nCN=$host\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:$host\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")

npm install